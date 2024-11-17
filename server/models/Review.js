const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
    {
        list: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
        isHidden: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);
