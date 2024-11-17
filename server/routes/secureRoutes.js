const express = require("express");
const verifyToken = require("../middleware/auth").verifyToken;
const List = require("../models/List");
const Review = require("../models/Review");

const router = express.Router();

router.get("/lists", verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const userLists = await List.find({ owner: userId });
        res.json(userLists);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch lists." });
    }
});

router.post("/lists", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { name, description, destinations, visibility } = req.body;

    try {
        const existingList = await List.findOne({ name, owner: userId });
        if (existingList) return res.status(400).json({ error: "List already exists." });

        const newList = new List({ name, description, destinations, visibility, owner: userId });
        await newList.save();

        res.status(201).json({ message: "List created successfully.", newList });
    } catch (err) {
        res.status(500).json({ error: "Failed to create list." });
    }
});

router.put("/lists/:id", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, destinations, visibility } = req.body;

    try {
        const list = await List.findById(id);
        if (!list) return res.status(404).json({ error: "List not found." });
        if (list.owner.toString() !== userId) return res.status(403).json({ error: "Unauthorized." });

        list.name = name || list.name;
        list.description = description || list.description;
        list.destinations = destinations || list.destinations;
        list.visibility = visibility || list.visibility;
        list.updatedAt = Date.now();

        await list.save();
        res.json({ message: "List updated successfully.", list });
    } catch (err) {
        res.status(500).json({ error: "Failed to update list." });
    }
});

router.delete("/lists/:id", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const list = await List.findById(id);
        if (!list) return res.status(404).json({ error: "List not found." });
        if (list.owner.toString() !== userId) return res.status(403).json({ error: "Unauthorized." });

        await list.remove();
        res.json({ message: "List deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete list." });
    }
});

router.post("/lists/:id/reviews", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    try {
        const review = new Review({ list: id, user: userId, rating, comment });
        await review.save();
        res.status(201).json({ message: "Review added successfully.", review });
    } catch (err) {
        res.status(500).json({ error: "Failed to add review." });
    }
});

module.exports = router;
