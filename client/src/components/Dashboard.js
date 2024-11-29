import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = ({ isAuthenticated, user }) => {
  const navigate = useNavigate();
  const [publicLists, setPublicLists] = useState([]);
  const [privateLists, setPrivateLists] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/public-lists")
      .then((response) => setPublicLists(response.data))
      .catch((err) => {
        setError("Failed to fetch public lists.");
        console.error(err);
      });
      
    if (isAuthenticated) {
      axios
        .get("http://localhost:3000/api/secure/private-lists", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((response) => setPrivateLists(response.data))
        .catch((err) => {
          setError("Failed to fetch private lists.");
          console.error(err);
        });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-4">Dashboard</h1>

      {isAuthenticated ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">Welcome, {user.username}!</h2>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Your Private Lists</h3>
            {privateLists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {privateLists.map((list) => (
                  <div
                    key={list.id}
                    className="p-4 bg-white shadow-md rounded hover:shadow-lg"
                  >
                    <h4 className="font-bold">{list.name}</h4>
                    <p className="text-sm text-gray-600">{list.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No private lists found. Create one!</p>
            )}
          </div>
        </>
      ) : (
        <div>
          <h2 className="text-center text-lg font-semibold mb-4">
            You are not logged in.
          </h2>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Signup
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Public Lists</h3>
        {publicLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicLists.map((list) => (
              <div
                key={list.id}
                className="p-4 bg-white shadow-md rounded hover:shadow-lg"
              >
                <h4 className="font-bold">{list.name}</h4>
                <p className="text-sm text-gray-600">{list.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No public lists available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
