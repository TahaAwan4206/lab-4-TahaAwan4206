const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Destination" }],
    visibility: { type: String, enum: ["public", "private"], default: "private" },
    lastModified: { type: Date, default: Date.now },
});

const List = mongoose.model("List", listSchema);
module.exports = List;
