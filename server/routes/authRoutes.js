const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const validateSignup = [
    body("email")
        .isEmail().withMessage("Invalid email format.")
        .trim()
        .normalizeEmail(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long.")
        .matches(/^[A-Za-z0-9@#$%^&+=!]*$/)
        .withMessage("Password contains invalid characters."),
    body("username")
        .notEmpty()
        .withMessage("Username is required.")
        .matches(/^[A-Za-z\u00C0-\u017F\s]*$/)
        .withMessage("Username contains invalid characters."),
];

const validatePasswordUpdate = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required."),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long.")
        .matches(/^[A-Za-z0-9@#$%^&+=!]*$/)
        .withMessage("New password contains invalid characters."),
];
router.post("/signup", validateSignup, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered." });
        }
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const user = new User({
            username,
            email,
            password,
            verificationToken,
            isVerified: false,
            role: "user"
        });

        await user.save();


        const verificationLink = `http://localhost:3001/verify-email/${verificationToken}`;
        await transporter.sendMail({
            to: email,
            subject: "Verify your EuropeanVoyager account",
            html: `
                <h1>Welcome to EuropeanVoyager!</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `,
        });

        res.status(201).json({ 
            message: "Account created successfully. Please check your email for verification."
        });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Failed to create account." });
    }
});

router.get("/verify/:token", async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired verification token." });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: "Email verified successfully. You can now log in." });
    } catch (err) {
        console.error("Verification Error:", err);
        res.status(500).json({ error: "Failed to verify email." });
    }
});

router.post("/login", [
    body("email").isEmail().withMessage("Invalid email format.").trim().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required."),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        if (user.isDeactivated) {
            return res.status(403).json({ 
                error: "Account is deactivated. Please contact administrator at admin@europeanvoyager.com"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({ 
                error: "Email not verified. Please verify your email before logging in."
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
});


router.put("/update-password", verifyToken, validatePasswordUpdate, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        user.password = newPassword; 
        await user.save();

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Password Update Error:", err);
        res.status(500).json({ error: "Failed to update password." });
    }
});

router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: "Email is already verified." });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        user.verificationToken = verificationToken;
        await user.save();

        const verificationLink = `${process.env.BASE_URL}/verify-email/${verificationToken}`;
        await transporter.sendMail({
            to: email,
            subject: "Verify your EuropeanVoyager account",
            html: `
                <h1>Email Verification</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `,
        });

        res.json({ message: "Verification email sent successfully." });
    } catch (err) {
        console.error("Resend Verification Error:", err);
        res.status(500).json({ error: "Failed to resend verification email." });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;
        await transporter.sendMail({
            to: email,
            subject: "Password Reset Request",
            html: `
                <h1>Password Reset Request</h1>
                <p>Please click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this reset, please ignore this email.</p>
            `,
        });

        res.json({ message: "Password reset email sent successfully." });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: "Failed to process password reset request." });
    }
});


router.post("/reset-password/:token", [
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long.")
        .matches(/^[A-Za-z0-9@#$%^&+=!]*$/)
        .withMessage("Password contains invalid characters."),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token." });
        }

        user.password = req.body.newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password has been reset successfully." });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ error: "Failed to reset password." });
    }
});


router.get("/user", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.error("Get User Error:", err);
        res.status(500).json({ error: "Failed to fetch user data." });
    }
});

module.exports = router;