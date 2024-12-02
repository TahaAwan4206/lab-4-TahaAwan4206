import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("Passwords do not match. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/auth/reset-password/${token}`,
        { newPassword: newPassword.trim() }
      );
      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Password Reset Error:", err.response || err);
      setError(err.response?.data?.error || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-500">Reset Password</h1>
      <form className="mt-6 w-80" onSubmit={handleResetPassword}>
        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="password">
            New Password:
          </label>
          <input
            className="w-full rounded border border-gray-300 p-2"
            type="password"
            id="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="confirm-password">
            Confirm Password:
          </label>
          <input
            className="w-full rounded border border-gray-300 p-2"
            type="password"
            id="confirm-password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;