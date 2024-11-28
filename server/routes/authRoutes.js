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
    body("email").isEmail().withMessage("Invalid email format.").trim().normalizeEmail(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long.")
        .matches(/^[A-Za-z0-9@#$%^&+=!]*$/).withMessage("Password contains invalid characters."),
    body("username")
        .notEmpty().withMessage("Username is required.")
        .matches(/^[A-Za-z\u00C0-\u017F\s]*$/).withMessage("Username contains invalid characters."),
];

const validatePasswordUpdate = [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword")
        .isLength({ min: 6 }).withMessage("New password must be at least 6 characters long.")
        .matches(/^[A-Za-z0-9@#$%^&+=!]*$/).withMessage("New password contains invalid characters."),
];

router.post("/signup", validateSignup, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const user = new User({ username, email, password: hashedPassword, verificationToken });

        await user.save();

        const verificationLink = `${process.env.BASE_URL}/auth/verify/${verificationToken}`;
        await transporter.sendMail({
            to: email,
            subject: "Verify your account",
            html: `<p>Click <a href="${verificationLink}">here</a> to verify your account.</p>`,
        });

        res.status(201).json({ message: "Account created. Please verify your email." });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Failed to create account." });
    }
});

router.get("/verify/:token", async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).json({ error: "Invalid or expired token." });

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.json({ message: "Email verified. You can now log in." });
    } catch (err) {
        console.error("Verification Error:", err);
        res.status(500).json({ error: "Failed to verify email." });
    }
});

router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Invalid email format.").trim().normalizeEmail(),
        body("password").notEmpty().withMessage("Password is required."),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: "Invalid email or password." });
            }

            if (user.isDeactivated) {
                return res.status(403).json({
                    error: "Account is deactivated. Please contact the administrator.",
                });
            }

            if (!user.isVerified) {
                return res.status(403).json({
                    error: "Email not verified. Please check your inbox and verify your email.",
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "Invalid email or password." });
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({ token });
        } catch (err) {
            res.status(500).json({ error: "Login failed due to a server error." });
        }
    }
);


router.put("/update-password", verifyToken, validatePasswordUpdate, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Password Update Error:", err);
        res.status(500).json({ error: "Failed to update password." });
    }
});

router.post("/resend-verification", async (req, res) => {
    const { email } = req.body;

    try {
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

        const verificationLink = `${process.env.BASE_URL}/auth/verify/${verificationToken}`;
        await transporter.sendMail({
            to: email,
            subject: "Verify your account",
            html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
        });

        res.json({ message: "Verification email sent successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to resend verification email." });
    }
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000; 
        await user.save();

        const resetLink = `${process.env.BASE_URL}/auth/reset-password/${resetToken}`;
        await transporter.sendMail({
            to: email,
            subject: "Password Reset",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });

        res.json({ message: "Password reset email sent successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to send password reset email." });
    }
});

router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiration = null;
        await user.save();

        res.json({ message: "Password reset successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to reset password." });
    }
});


module.exports = router;
