const express = require("express");
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

router.get("/users", [verifyToken, verifyAdmin], async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users." });
    }
});

router.patch("/users/:id/deactivate", [verifyToken, verifyAdmin], async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isDeactivated: true }, { new: true });
        if (!user) return res.status(404).json({ error: "User not found." });

        res.json({ message: "User deactivated successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to deactivate user." });
    }
});

module.exports = router;
