const express = require("express");
const List = require("../models/List");
const Destination = require("../models/Destination");

const router = express.Router();

router.get("/public-lists", async (req, res) => {
    try {
        const publicLists = await List.find({ visibility: "public" })
            .select("name description destinations updatedAt")
            .populate("destinations", "Destination Region Country");
        res.json(publicLists);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch public lists." });
    }
});

module.exports = router;
