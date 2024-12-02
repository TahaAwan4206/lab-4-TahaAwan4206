const express = require("express");
const { body, param, validationResult } = require("express-validator");
const verifyToken = require("../middleware/auth").verifyToken;
const List = require("../models/List");
const Review = require("../models/Review");


const router = express.Router();


router.get("/lists", verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const userLists = await List.find({ owner: userId })
            .populate('destinations')
            .populate({
                path: 'reviews',
                match: { isHidden: false },
                populate: {
                    path: 'user',
                    select: 'username'
                }
            });


        const listsWithRatings = userLists.map(list => {
            const listObj = list.toObject();
            const visibleReviews = listObj.reviews || [];
            const avgRating = visibleReviews.length > 0
                ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
                : 0;
            
            return {
                ...listObj,
                averageRating: Number(avgRating.toFixed(1)),
                reviewCount: visibleReviews.length
            };
        });

        res.json(listsWithRatings);
    } catch (err) {
        console.error("Error fetching lists:", err);
        res.status(500).json({ error: "Failed to fetch lists." });
    }
});


router.post(
    "/lists",
    verifyToken,
    [
        body("name")
            .notEmpty().withMessage("List name is required.")
            .matches(/^[^\d<>]*$/).withMessage("List name must not contain numbers or invalid characters."),
        body("description").optional().escape().trim(),
        body("destinations").optional().isArray().withMessage("Destinations must be an array."),
        body("visibility").isBoolean().withMessage("Visibility must be a boolean value."),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const userId = req.user.id;
        const { name, description, destinations, visibility } = req.body;

        try {
            const existingList = await List.findOne({ name, owner: userId });
            if (existingList) return res.status(400).json({ error: "List name already exists." });

            const newList = new List({
                name,
                description,
                destinations: destinations || [],
                visibility,
                owner: userId,
                reviews: []
            });
            
            await newList.save();

            const populatedList = await List.findById(newList._id)
                .populate('destinations')
                .populate({
                    path: 'reviews',
                    match: { isHidden: false },
                    populate: {
                        path: 'user',
                        select: 'username'
                    }
                });

            res.status(201).json({ 
                message: "List created successfully.", 
                newList: populatedList 
            });
        } catch (err) {
            console.error("Error creating list:", err);
            res.status(500).json({ error: "Failed to create list." });
        }
    }
);


router.put("/lists/:id", verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        visibility: req.body.visibility,
        updatedAt: Date.now()
      };
  
      const updatedList = await List.findOneAndUpdate(
        { _id: id, owner: userId },
        { $set: updateData },
        { new: true }
      )
      .populate('destinations')
      .populate({
        path: 'reviews',
        match: { isHidden: false },
        populate: {
          path: 'user',
          select: 'username'
        }
      });
  
      if (!updatedList) {
        return res.status(404).json({ error: "List not found" });
      }
  
      res.json({ list: updatedList });
    } catch (error) {
      console.error("Error updating list:", error);
      res.status(500).json({ error: "Failed to update list" });
    }
  });


router.delete(
    "/lists/:id",
    verifyToken,
    [param("id").isMongoId().withMessage("Invalid list ID.")],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const userId = req.user.id;
        const { id } = req.params;

        try {
            const list = await List.findOneAndDelete({ _id: id, owner: userId });
            if (!list) {
                return res.status(404).json({ error: "List not found or unauthorized." });
            }

   
            await Review.deleteMany({ list: id });
            
            res.json({ message: "List deleted successfully." });
        } catch (err) {
            console.error("Error deleting list:", err);
            res.status(500).json({ error: "Failed to delete list." });
        }
    }
);

router.post(
    "/lists/:id/reviews",
    verifyToken,
    [
        param("id").isMongoId().withMessage("Invalid list ID."),
        body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5."),
        body("comment").optional().escape().trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        try {
       
            const list = await List.findOne({ _id: id, visibility: true });
            if (!list) {
                return res.status(404).json({ error: "List not found or not public" });
            }

   
            const existingReview = await Review.findOne({ list: id, user: userId });
            if (existingReview) {
                return res.status(400).json({ error: "You have already reviewed this list" });
            }

            const review = new Review({
                list: id,
                user: userId,
                rating,
                comment,
                isHidden: false
            });

            await review.save();
            
            list.reviews.push(review._id);
            await list.save();

            const populatedReview = await Review.findById(review._id)
                .populate('user', 'username');

            res.status(201).json({ 
                message: "Review added successfully", 
                review: populatedReview 
            });
        } catch (err) {
            console.error("Error adding review:", err);
            res.status(500).json({ error: "Failed to add review." });
        }
    }
);

router.post(
    "/lists/:listId/destinations",
    verifyToken,
    async (req, res) => {
        const { listId } = req.params;
        const { destinationId } = req.body;

        if (!destinationId) {
            return res.status(400).json({ error: "Destination ID is required." });
        }

        try {
            const list = await List.findById(listId);
            if (!list) {
                return res.status(404).json({ error: "List not found." });
            }

            
            if (!list.destinations.includes(destinationId)) {
                list.destinations.push(destinationId);
                await list.save();
            }

         
            const updatedList = await List.findById(listId).populate("destinations");

            res.json({ message: "Destination added successfully.", list: updatedList });
        } catch (error) {
            console.error("Error adding destination to list:", error);
            res.status(500).json({ error: "Failed to add destination to list." });
        }
    }
);

  
  
router.post('/lists/:listId/reviews', verifyToken, [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be an integer between 1 and 5'),
    body('comment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { listId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    try {
        
        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

       
        const review = new Review({
            list: listId,
            user: userId,
            rating,
            comment
        });

        await review.save();

       
        list.reviews.push(review._id);

       
        const reviews = await Review.find({ list: listId, isHidden: false });
        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

        
        list.averageRating = averageRating;
        await list.save();

        res.status(201).json({ message: 'Review added successfully' });
    } catch (err) {
        console.error("Error adding review:", err);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

router.delete("/lists/:listId/destinations/:destinationId", verifyToken, async (req, res) => {
    try {
      const { listId, destinationId } = req.params;
      const userId = req.user.id;
  
      const list = await List.findOne({ _id: listId, owner: userId });
      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }
  
      list.destinations = list.destinations.filter(
        dest => dest.toString() !== destinationId
      );
      
      await list.save();
  
      const updatedList = await List.findById(listId)
        .populate('destinations')
        .populate({
          path: 'reviews',
          match: { isHidden: false },
          populate: {
            path: 'user',
            select: 'username'
          }
        });
  
      res.json({ list: updatedList });
    } catch (error) {
      console.error("Error removing destination:", error);
      res.status(500).json({ error: "Failed to remove destination" });
    }
  });

module.exports = router;