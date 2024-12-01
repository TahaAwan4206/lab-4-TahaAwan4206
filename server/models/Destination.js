const mongoose = require("mongoose");

const destinationSchema = new mongoose.Schema({
    Destination: { type: String, required: true },
    Region: { type: String, required: true },
    Country: { type: String, required: true },
    Latitude: { type: Number },
    Longitude: { type: Number },
    Currency: { type: String },
    Language: { type: String },
});

destinationSchema.index({
    Destination: "text",
    Region: "text",
    Country: "text",
});

const Destination = mongoose.model("Destination", destinationSchema);
module.exports = Destination;
