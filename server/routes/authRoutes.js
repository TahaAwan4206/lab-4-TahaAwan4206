const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

router.post(
    "/signup",
    body("email").isEmail().withMessage("Invalid email format."),
    async (req, res) => {
        const { username, email, password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ error: "Email already registered." });

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ username, email, password: hashedPassword });
            await user.save();

            res.status(201).json({ message: "Account created. Please log in." });
        } catch (err) {
            res.status(500).json({ error: "Failed to create account." });
        }
    }
);

module.exports = router;
