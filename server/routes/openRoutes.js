const express = require("express");
const { query, param, validationResult } = require("express-validator");
const List = require("../models/List");
const Review = require("../models/Review");
const Destination = require("../models/Destination");

const router = express.Router();

const normalizeInput = (input) =>
  input.trim().toLowerCase().replace(/\s+/g, " ");

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

const calculateFieldMatchScore = (query, destination, field) => {
  const normalizedQuery = normalizeInput(query);
  const fieldValue = destination[field];
  if (!fieldValue) return 0;
  const normalizedFieldValue = normalizeInput(fieldValue);

  let score = 0;

  if (normalizedFieldValue === normalizedQuery) {
    score += 100;
  } else if (normalizedFieldValue.startsWith(normalizedQuery)) {
    score += 50;
  } else if (normalizedFieldValue.includes(normalizedQuery)) {
    score += 25;
  }

  const levenDist = levenshteinDistance(normalizedQuery, normalizedFieldValue);
  if (levenDist <= 2) {
    score += Math.max(0, (3 - levenDist) * 10);
  }

  return score;
};

const performSoftSearch = (query, destinations, field = null) => {
  const scoredDestinations = destinations.map((destination) => {
    let score;
    if (field) {
      score = calculateFieldMatchScore(query, destination, field);
    } else {
      score = calculateMatchScore(query, destination);
    }
    return { destination, score };
  });

  return scoredDestinations
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ destination }) => destination);
};

const calculateMatchScore = (query, destination) => {
  const normalizedQuery = normalizeInput(query);
  const normalizedDestination = normalizeInput(destination.Destination);
  const normalizedCountry = normalizeInput(destination.Country);
  const normalizedRegion = normalizeInput(destination.Region);

  let score = 0;

  if (normalizedDestination === normalizedQuery) score += 100;
  if (normalizedCountry === normalizedQuery) score += 80;
  if (normalizedRegion === normalizedQuery) score += 60;

  if (normalizedDestination.startsWith(normalizedQuery)) score += 50;
  if (normalizedCountry.startsWith(normalizedQuery)) score += 40;
  if (normalizedRegion.startsWith(normalizedQuery)) score += 30;

  if (normalizedDestination.includes(normalizedQuery)) score += 25;
  if (normalizedCountry.includes(normalizedQuery)) score += 20;
  if (normalizedRegion.includes(normalizedQuery)) score += 15;

  const levenDistDest = levenshteinDistance(
    normalizedQuery,
    normalizedDestination
  );
  const levenDistCountry = levenshteinDistance(
    normalizedQuery,
    normalizedCountry
  );
  const levenDistRegion = levenshteinDistance(
    normalizedQuery,
    normalizedRegion
  );

  if (levenDistDest <= 2) score += Math.max(0, (3 - levenDistDest) * 10);
  if (levenDistCountry <= 2) score += Math.max(0, (3 - levenDistCountry) * 8);
  if (levenDistRegion <= 2) score += Math.max(0, (3 - levenDistRegion) * 6);

  return score;
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
    const { destination, country, region } = req.query;
  
    try {
      const allDestinations = await Destination.find();
      let matchedDestinations = allDestinations;
  
      if (destination) {
        matchedDestinations = performSoftSearch(destination, matchedDestinations);
      }
  
      if (country) {
        matchedDestinations = performSoftSearch(
          country,
          matchedDestinations,
          "Country"
        );
      }
  
      if (region) {
        matchedDestinations = performSoftSearch(
          region,
          matchedDestinations,
          "Region"
        );
      }
  
      const transformedDestinations = matchedDestinations.slice(0, 20).map((dest) => ({
        id: dest._id,
        name: dest.Destination,
        country: dest.Country,
        region: dest.Region,
        latitude: dest.Latitude,
        longitude: dest.Longitude,
        currency: dest.Currency,
        language: dest.Language,
      }));
  
      res.json(transformedDestinations);
    } catch (err) {
      console.error("Error performing search:", err);
      res.status(500).json({ error: "Failed to perform search." });
    }
  });

module.exports = router;
