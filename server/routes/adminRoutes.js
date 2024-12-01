const express = require("express");
const { param, validationResult } = require("express-validator");
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const User = require("../models/User");
const Review = require("../models/Review");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

router.use(adminLimiter);


const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
};

router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).json({ error: "Failed to fetch users." });
    }
});


router.get("/reviews", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("user", "username email")
            .populate("list", "name");
        res.json(reviews);
    } catch (err) {
        console.error("Error fetching reviews:", err.message);
        res.status(500).json({ error: "Failed to fetch reviews." });
    }
});


router.put(
    "/users/:id/grant-admin",
    verifyToken,
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid user ID.")],
    async (req, res) => {
        if (handleValidationErrors(req, res)) return;

        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found." });

            user.role = "admin";
            await user.save();

            res.json({ message: "Admin privileges granted successfully." });
        } catch (err) {
            console.error("Error granting admin privileges:", err.message);
            res.status(500).json({ error: "Failed to grant admin privileges." });
        }
    }
);


router.put(
    "/users/:id/deactivate",
    verifyToken,
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid user ID.")],
    async (req, res) => {
        if (handleValidationErrors(req, res)) return;

        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found." });

            user.isDeactivated = true;
            await user.save();

            res.json({ message: "User deactivated successfully." });
        } catch (err) {
            console.error("Error deactivating user:", err.message);
            res.status(500).json({ error: "Failed to deactivate user." });
        }
    }
);


router.put(
    "/users/:id/reactivate",
    verifyToken,
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid user ID.")],
    async (req, res) => {
        if (handleValidationErrors(req, res)) return;

        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found." });

            user.isDeactivated = false;
            await user.save();

            res.json({ message: "User reactivated successfully." });
        } catch (err) {
            console.error("Error reactivating user:", err.message);
            res.status(500).json({ error: "Failed to reactivate user." });
        }
    }
);


router.put(
    "/reviews/:id/hide",
    verifyToken,
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid review ID.")],
    async (req, res) => {
        if (handleValidationErrors(req, res)) return;

        try {
            const review = await Review.findById(req.params.id);
            if (!review) return res.status(404).json({ error: "Review not found." });

            review.isHidden = true;
            await review.save();

            res.json({ message: "Review hidden successfully." });
        } catch (err) {
            console.error("Error hiding review:", err.message);
            res.status(500).json({ error: "Failed to hide review." });
        }
    }
);


router.put(
    "/reviews/:id/unhide",
    verifyToken,
    verifyAdmin,
    [param("id").isMongoId().withMessage("Invalid review ID.")],
    async (req, res) => {
        if (handleValidationErrors(req, res)) return;

        try {
            const review = await Review.findById(req.params.id);
            if (!review) return res.status(404).json({ error: "Review not found." });

            review.isHidden = false;
            await review.save();

            res.json({ message: "Review visibility restored." });
        } catch (err) {
            console.error("Error unhiding review:", err.message);
            res.status(500).json({ error: "Failed to unhide review." });
        }
    }
);

module.exports = router;
