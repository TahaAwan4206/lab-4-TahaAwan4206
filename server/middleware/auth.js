const jwt = require("jsonwebtoken");
const User = require("../models/User"); 

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (user.isDeactivated) {
            return res.status(403).json({
                error: "Account is deactivated. Contact the administrator.",
            });
        }

        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired. Please log in again." });
        }

        if (err.name === "JsonWebTokenError") {
            return res.status(403).json({ error: "Invalid token." });
        }

        res.status(403).json({ error: "Authentication failed." });
    }
};

const verifyAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            console.error("verifyAdmin: req.user is missing. Ensure verifyToken is called.");
            return res.status(401).json({ error: "Unauthorized access. Token missing or invalid." });
        }

        if (req.user.role !== "admin") {
            console.error(`verifyAdmin: User ${req.user.id} does not have admin privileges.`);
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        next();
    } catch (error) {
        console.error("Admin verification error:", error.message);
        res.status(500).json({ error: "An error occurred during admin verification." });
    }
};

module.exports = { verifyToken, verifyAdmin };
