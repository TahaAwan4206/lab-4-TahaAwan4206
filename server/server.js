require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const openRoutes = require("./routes/openRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use(cors());

app.use("/api/open", openRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
