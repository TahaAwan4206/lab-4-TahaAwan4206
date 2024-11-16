require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const Destination = require("./models/Destination");

mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

const populateData = async () => {
    const destinations = [];

    fs.createReadStream("./data/destinations.csv")
        .pipe(csv())
        .on("data", (row) => {
            destinations.push({
                Destination: row.Destination,
                Region: row.Region,
                Country: row.Country,
                Latitude: parseFloat(row.Latitude),
                Longitude: parseFloat(row.Longitude),
                Currency: row.Currency,
                Language: row.Language,
            });
        })
        .on("end", async () => {
            try {
                await Destination.insertMany(destinations);
                console.log("Database seeded with destinations");
                mongoose.disconnect();
            } catch (err) {
                console.error("Error inserting data:", err);
            }
        })
        .on("error", (err) => {
            console.error("Error reading CSV file:", err);
        });
};

populateData();
