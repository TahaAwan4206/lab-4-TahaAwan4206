const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Destination" }],
    visibility: { type: String, enum: ["public", "private"], default: "private" },
    updatedAt: { type: Date, default: Date.now },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } 
});

module.exports = mongoose.model("List", ListSchema);
