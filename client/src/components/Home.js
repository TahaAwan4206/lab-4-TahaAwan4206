import React, { useState, useEffect } from 'react';
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const LandingPage = ({ onLogin }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const [mapData, setMapData] = useState({ visible: false, coordinates: null, name: "" });

  
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  const searchDestinations = async () => {
    try {
      if (!searchTerm.trim()) {
        setError("Please enter a search term.");
        return;
      }
      const response = await axios.get(
        `http://localhost:3000/api/open/destinations/search?query=${encodeURIComponent(
          searchTerm.trim()
        )}`
      );
      if (response.data.length === 0) {
        setError("No destinations found. Please try a different search.");
      } else {
        setSearchResults(response.data);
        setError("");
      }
    } catch (error) {
      console.error("Error searching destinations:", error);
      setError("Search failed. Please try again.");
    }
  };

  const showOnMap = (latitude, longitude, name) => {
    if (latitude && longitude) {
      setMapData({
        visible: true,
        coordinates: [latitude, longitude],
        name,
      });
    } else {
      setError("Invalid coordinates for the selected destination.");
    }
  };

  const closeMap = () => {
    setMapData({ visible: false, coordinates: null, name: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  
      <div className="max-w-6xl mx-auto pt-12 px-4">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-5xl font-bold text-blue-600">
            EuropeanVoyager
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create and discover curated European travel lists. Search destinations, plan your trips, 
            and share your adventures with fellow travelers.
          </p>
          
          <div className="space-y-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors mx-2">
              Login
            </button>
            <button className="bg-gray-50 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-200 mx-2">
              Continue as Guest
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Explore Destinations</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search for a destination or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={searchDestinations}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </div>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="grid gap-4 mt-4">
            {searchResults.map((result) => (
              <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{result.name}</h3>
                    <p className="text-gray-600">{result.country}, {result.region}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => showOnMap(result.latitude, result.longitude, result.name)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                    >
                      View Map
                    </button>
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                      onClick={() => window.open(`https://duckduckgo.com/?q=${result.name} ${result.country}`, "_blank")}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    
      {mapData.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-11/12 h-5/6 rounded-lg relative">
          <button
            onClick={closeMap}
             className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 z-[1002]"
                >
                Close
                </button>
            <MapContainer
              center={mapData.coordinates || [0, 0]}
              zoom={13}
              className="h-full w-full rounded-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {mapData.coordinates && (
                <Marker position={mapData.coordinates}>
                  <Popup>{mapData.name}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;