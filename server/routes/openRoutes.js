const express = require("express");
const Destination = require("../models/Destination");
const List = require("../models/List");
const router = express.Router();


router.get("/destinations", async (req, res) => {
    const { destination, region, country } = req.query;
    const filters = {};
    if (destination) filters.Destination = { $regex: destination, $options: "i" };
    if (region) filters.Region = { $regex: region, $options: "i" };
    if (country) filters.Country = { $regex: country, $options: "i" };

    try {
        const results = await Destination.find(filters);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch destinations" });
    }
});


router.post("/lists", async (req, res) => {
    const { name, description, destinations } = req.body;
    try {
        const newList = new List({ name, description, destinations });
        await newList.save();
        res.status(201).json(newList);
    } catch (err) {
        res.status(400).json({ error: "Failed to create list" });
    }
});

module.exports = router;
