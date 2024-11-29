import React, { useEffect, useState } from "react";
import axios from "axios";

const PublicLists = () => {
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/public-lists");
        setLists(response.data);
      } catch (err) {
        setError("Failed to fetch public lists.");
      }
    };

    fetchLists();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6">Public Lists</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid gap-4">
        {lists.map((list) => (
          <div key={list.id} className="p-4 bg-white rounded shadow">
            <h2 className="text-2xl font-bold">{list.name}</h2>
            <p>Created by: {list.owner}</p>
            <p>Destinations: {list.numberOfDestinations}</p>
            <p>Average Rating: {list.averageRating}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicLists;
