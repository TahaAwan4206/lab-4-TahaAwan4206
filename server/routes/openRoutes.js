const express = require("express");
const List = require("../models/List");
const Review = require("../models/Review");

const router = express.Router();

const normalizeInput = (input) => input.trim().replace(/\s+/g, " ");

const isTypoMatch = (term, target) => {
    const levenshtein = (a, b) => {
        const dp = Array(a.length + 1)
            .fill(null)
            .map(() => Array(b.length + 1).fill(0));

        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
            }
        }

        return dp[a.length][b.length];
    };

    return levenshtein(term.toLowerCase(), target.toLowerCase()) <= 2;
};

router.get("/public-lists", async (req, res) => {
    const { search } = req.query;
    const normalizedSearch = search ? normalizeInput(search) : null;

    try {
        const publicLists = await List.find({ visibility: "public" })
            .populate("owner", "username")
            .populate("destinations", "Destination Region Country");

        const detailedLists = await Promise.all(
            publicLists.map(async (list) => {
                const filteredDestinations = list.destinations.filter((destination) => {
                    if (!normalizedSearch) return true;

                    const matchesDestination = isTypoMatch(normalizedSearch, destination.Destination);
                    const matchesRegion = isTypoMatch(normalizedSearch, destination.Region);
                    const matchesCountry = isTypoMatch(normalizedSearch, destination.Country);

                    return matchesDestination || matchesRegion || matchesCountry;
                });

                const reviews = await Review.find({ list: list._id });
                const averageRating =
                    reviews.length > 0
                        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                        : 0;

                return {
                    id: list._id,
                    name: list.name,
                    description: list.description,
                    destinations: filteredDestinations,
                    owner: list.owner.username,
                    numberOfDestinations: filteredDestinations.length,
                    averageRating: averageRating.toFixed(2),
                    updatedAt: list.updatedAt,
                };
            })
        );

        res.json(detailedLists);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch public lists." });
    }
});

module.exports = router;
