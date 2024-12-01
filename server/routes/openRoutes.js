const express = require("express");
const { query, param, validationResult } = require("express-validator");
const List = require("../models/List");
const Review = require("../models/Review");
const Destination = require("../models/Destination");

const router = express.Router();

const normalizeInput = (input) => input.trim().toLowerCase().replace(/\s+/g, " ");

const levenshteinDistance = (a, b) => {
    const dp = Array(a.length + 1)
        .fill(null)
        .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }

    return dp[a.length][b.length];
};

const calculateMatchScore = (query, destination) => {
    const normalizedQuery = normalizeInput(query);
    const normalizedDestination = normalizeInput(destination.Destination);
    const normalizedCountry = normalizeInput(destination.Country);
    const normalizedRegion = normalizeInput(destination.Region);

  
    const scores = {
        exactMatch: 0,
        startsWith: 0,
        contains: 0,
        levenshtein: 0
    };

    
    if (normalizedDestination === normalizedQuery) scores.exactMatch += 100;
    if (normalizedCountry === normalizedQuery) scores.exactMatch += 80;
    if (normalizedRegion === normalizedQuery) scores.exactMatch += 60;

    if (normalizedDestination.startsWith(normalizedQuery)) scores.startsWith += 50;
    if (normalizedCountry.startsWith(normalizedQuery)) scores.startsWith += 40;
    if (normalizedRegion.startsWith(normalizedQuery)) scores.startsWith += 30;

  
    if (normalizedDestination.includes(normalizedQuery)) scores.contains += 25;
    if (normalizedCountry.includes(normalizedQuery)) scores.contains += 20;
    if (normalizedRegion.includes(normalizedQuery)) scores.contains += 15;

    const levenDist = levenshteinDistance(normalizedQuery, normalizedDestination);
    if (levenDist <= 2) {
        scores.levenshtein += Math.max(0, (3 - levenDist) * 10); 
    }

    return Object.values(scores).reduce((a, b) => a + b, 0);
};

const performSoftSearch = (query, destinations) => {
  
    const scoredDestinations = destinations.map(destination => ({
        destination,
        score: calculateMatchScore(query, destination)
    }));

 
    return scoredDestinations
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ destination }) => destination);
};

router.get("/public-lists", async (req, res) => {
    try {
        const { sort, country, region, limit = 10 } = req.query;
        
        let query = { visibility: true };

        if (country) {
            query['destinations.Country'] = new RegExp('^' + country, 'i');
        }
        if (region) {
            query['destinations.Region'] = new RegExp('^' + region, 'i');
        }

        let sortQuery = {};
        switch (sort) {
            case 'rating':
                sortQuery = { averageRating: -1 };
                break;
            case 'destinations':
                sortQuery = { 'destinations.length': -1 };
                break;
            default:
                sortQuery = { updatedAt: -1 };
        }

        const lists = await List.find(query)
            .sort(sortQuery)
            .limit(parseInt(limit))
            .populate('owner', 'username')
            .populate({
                path: 'reviews',
                match: { isHidden: false }, 
                populate: { path: 'user', select: 'username' }
            })
            .populate('destinations');

        const listsWithRatings = lists.map(list => {
            const listObj = list.toObject();
            const visibleReviews = listObj.reviews || [];
            const averageRating = visibleReviews.length > 0
                ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
                : 0;
            
            return {
                ...listObj,
                averageRating: Number(averageRating.toFixed(1)),
                reviewCount: visibleReviews.length
            };
        });

        res.json(listsWithRatings);
    } catch (err) {
        console.error("Error fetching public lists:", err);
        res.status(500).json({ error: "Failed to fetch public lists." });
    }
});

router.get("/destinations/search", async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() === "") {
        console.warn("Search query is missing.");
        return res.status(400).json({ error: "Query parameter is required." });
    }

    try {
        console.log(`Performing search with query: "${query}"`);
        const allDestinations = await Destination.find();
        console.log(`Total destinations fetched: ${allDestinations.length}`);

        const matchedDestinations = performSoftSearch(query, allDestinations);
        console.log(`Destinations matched: ${matchedDestinations.length}`);

        const transformedDestinations = matchedDestinations.slice(0, 20).map(dest => ({
            id: dest._id,
            name: dest.Destination,
            country: dest.Country,
            region: dest.Region,
            latitude: dest.Latitude,
            longitude: dest.Longitude,
            currency: dest.Currency,
            language: dest.Language
        }));

        res.json(transformedDestinations);
    } catch (err) {
        console.error("Error performing search:", err);
        res.status(500).json({ error: "Failed to perform search." });
    }
});

module.exports = router;