import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    onLogout(); 
    navigate("/");
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/Home" className="text-white text-2xl font-bold">
          EuropeanVoyager
        </Link>

        <div className="flex items-center space-x-4">
          <Link to="/public-lists" className="text-white hover:text-gray-300">
            Public Lists
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-gray-300">
                Dashboard
              </Link>
              <Link to="/my-lists" className="text-white hover:text-gray-300">
                My Lists
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin-dashboard"
                  className="text-white hover:text-gray-300"
                >
                  Admin
                </Link>
              )}
              <div className="text-white mx-4">Welcome, {user?.username}</div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="text-white hover:text-gray-300">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
