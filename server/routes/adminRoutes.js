const express = require("express");
const { param, validationResult } = require("express-validator");
const verifyAdmin = require("../middleware/auth").verifyAdmin;
const User = require("../models/User");
const Review = require("../models/Review");

const router = express.Router();

router.put(
    "/users/:id/deactivate",
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid user ID.")],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found." });

            user.isDeactivated = true;
            await user.save();

            res.json({ message: "User deactivated successfully." });
        } catch (err) {
            res.status(500).json({ error: "Failed to deactivate user." });
        }
    }
);

router.put(
    "/users/:id/reactivate",
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid user ID.")],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found." });

            user.isDeactivated = false;
            await user.save();

            res.json({ message: "User reactivated successfully." });
        } catch (err) {
            res.status(500).json({ error: "Failed to reactivate user." });
        }
    }
);

router.put(
    "/reviews/:id/hide",
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid review ID.")],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const review = await Review.findById(req.params.id);
            if (!review) return res.status(404).json({ error: "Review not found." });

            review.isHidden = true;
            await review.save();

            res.json({ message: "Review hidden successfully." });
        } catch (err) {
            res.status(500).json({ error: "Failed to hide review." });
        }
    }
);

router.put(
    "/reviews/:id/unhide",
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid review ID.")],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const review = await Review.findById(req.params.id);
            if (!review) return res.status(404).json({ error: "Review not found." });

            review.isHidden = false;
            await review.save();

            res.json({ message: "Review visibility restored." });
        } catch (err) {
            res.status(500).json({ error: "Failed to unhide review." });
        }
    }
);

module.exports = router;
