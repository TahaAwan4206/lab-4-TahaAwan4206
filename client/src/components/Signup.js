import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    // Username validation
    if (!username.match(/^[A-Za-z\u00C0-\u017F\s]*$/)) {
      setError("Username can only contain letters and spaces");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Password validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (!password.match(/^[A-Za-z0-9@#$%^&+=!]*$/)) {
      setError("Password contains invalid characters");
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/auth/signup", {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (err.response?.data?.errors) {
       
        const validationErrors = err.response.data.errors
          .map(error => error.msg)
          .join(", ");
        setError(validationErrors);
      } else {
        setError(err.response?.data?.error || "An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-500">Sign Up</h1>
      <form className="mt-6 w-80" onSubmit={handleSignup}>
        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="username">
            Username:
          </label>
          <input
            className="w-full rounded border border-gray-300 p-2"
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={1}
            maxLength={30}
          />
          <p className="text-sm text-gray-500">Letters and spaces only</p>
        </div>
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
            required
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
            required
            minLength={6}
          />
          <p className="text-sm text-gray-500">
            At least 6 characters, letters, numbers and @#$%^&+=! only
          </p>
        </div>
        {error && (
          <p className="mb-4 text-red-500 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 text-green-500 bg-green-50 p-2 rounded border border-green-200">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded p-2 text-white ${
            isLoading 
              ? "bg-blue-300 cursor-not-allowed" 
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p className="mt-4 text-gray-700">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-500 hover:underline">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default Signup;