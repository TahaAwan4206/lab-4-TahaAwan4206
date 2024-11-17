const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post("/signup", body("email").isEmail(), async (req, res) => {
    const { username, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
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
        res.status(500).json({ error: "Failed to verify email." });
    }
});

router.post("/resend-verification", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found." });
        if (user.isVerified) return res.status(400).json({ error: "Email already verified." });

        const verificationToken = crypto.randomBytes(32).toString("hex");
        user.verificationToken = verificationToken;
        await user.save();

        const verificationLink = `${process.env.BASE_URL}/auth/verify/${verificationToken}`;
        await transporter.sendMail({
            to: email,
            subject: "Verify your account",
            html: `<p>Click <a href="${verificationLink}">here</a> to verify your account.</p>`,
        });

        res.json({ message: "Verification email resent." });
    } catch (err) {
        res.status(500).json({ error: "Failed to resend verification email." });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found." });
        if (user.isDeactivated) return res.status(403).json({ error: "Account is deactivated." });
        if (!user.isVerified) return res.status(403).json({ error: "Email not verified." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: "Login failed." });
    }
});

module.exports = router;
