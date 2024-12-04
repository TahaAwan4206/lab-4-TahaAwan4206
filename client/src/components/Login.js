import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
  
      if (!email.trim() || !password.trim()) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

     
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

  
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

     
      onLogin(user, token);

      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "An error occurred";

      if (errorMsg.includes("not verified")) {
        setError(
          <div>
            Your email has not been verified.{" "}
            <button
              onClick={() => handleResendVerification(email)}
              className="text-blue-500 underline ml-2"
            >
              Resend verification email
            </button>
          </div>
        );
      } else if (errorMsg.includes("deactivated")) {
        setError(
          "Account deactivated. Please contact administrator at admin@europeanvoyager.com"
        );
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (email) => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/resend-verification`, {
        email,
      });
      setError("Verification email sent. Please check your inbox.");
    } catch (err) {
      setError("Failed to resend verification email. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-500">Login</h1>
      <form className="mt-6 w-80" onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="email">
            Email:
          </label>
          <input
            className="w-full rounded border border-gray-300 p-2"
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="password">
            Password:
          </label>
          <input
            className="w-full rounded border border-gray-300 p-2"
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-4 space-y-2 text-center">
        <p className="text-gray-700">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-500 hover:underline"
          >
            Sign Up
          </button>
        </p>
        <p className="text-gray-700">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-blue-500 hover:underline"
          >
            Forgot Password?
          </button>
        </p>
        <p className="text-gray-700">
          <button
            onClick={() => navigate("/public-lists")}
            className="text-gray-600 hover:underline"
          >
            Continue as Guest
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
