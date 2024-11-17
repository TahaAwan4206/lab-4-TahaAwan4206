const express = require("express");
const verifyToken = require("../middleware/auth").verifyToken;
const List = require("../models/List");
const Destination = require("../models/Destination");

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

router.get("/lists/:id", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const list = await List.findById(id).populate("destinations");
        if (!list) return res.status(404).json({ error: "List not found." });

        if (list.owner.toString() !== userId) {
            return res.status(403).json({ error: "You do not have permission to view this list." });
        }

        res.json(list);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch list." });
    }
});

router.post("/lists", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { name, description, destinations, visibility } = req.body;

    try {
        const existingList = await List.findOne({ name, owner: userId });
        if (existingList) {
            return res.status(400).json({ error: "A list with this name already exists." });
        }

        const newList = new List({
            name,
            description,
            destinations,
            visibility,
            owner: userId
        });

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

        if (list.owner.toString() !== userId) {
            return res.status(403).json({ error: "You do not have permission to edit this list." });
        }

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

        if (list.owner.toString() !== userId) {
            return res.status(403).json({ error: "You do not have permission to delete this list." });
        }

        await list.remove();
        res.json({ message: "List deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete list." });
    }
});

module.exports = router;
