const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    isDeactivated: { type: Boolean, default: false },
    verificationToken: { type: String } 
});

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || this.password.startsWith("$2b$")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("User", UserSchema);
