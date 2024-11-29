import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-center">
      <h1 className="text-5xl font-bold text-blue-500 mb-4">Destination Explorer</h1>
      <p className="text-lg text-gray-700 mb-8">
        Welcome to Destination Explorer! Create and explore curated lists of amazing travel destinations worldwide.
      </p>
      <div className="flex space-x-4">
        <Link to="/login">
          <button className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">
            Login
          </button>
        </Link>
        <Link to="/signup">
          <button className="rounded bg-green-500 px-6 py-2 text-white hover:bg-green-600">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
