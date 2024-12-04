require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const secureRoutes = require("./routes/secureRoutes");
const adminRoutes = require("./routes/adminRoutes");
const openRoutes = require("./routes/openRoutes"); 


const app = express();

app.use(cors());
app.use(express.json());

app.use(cors({
  origin: `${process.env.BASE_URL}`, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, 
}));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

  const path = require("path");

app.use("/auth", authRoutes);
app.use("/api/secure", secureRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/open", openRoutes); 

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
