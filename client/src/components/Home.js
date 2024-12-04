import React, { useState } from 'react';
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const Home = ({ onLogin }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const [mapData, setMapData] = useState({ visible: false, coordinates: null, name: "" });
  const [expandedResultId, setExpandedResultId] = useState(null);

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
        `${process.env.REACT_APP_BACKEND_URL}/api/open/destinations/search?query=${encodeURIComponent(
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

  const toggleResultExpansion = (id) => {
    setExpandedResultId(expandedResultId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-5xl font-bold text-blue-600">
            EuropeanVoyager
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create and discover curated European travel lists. Search destinations, plan your trips, 
            and share your adventures with fellow travelers.
          </p>
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
          
          <div className="space-y-4 mt-4">
            {searchResults.map((result) => (
              <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{result.name}</h3>
                    <p className="text-gray-600">{result.country}, {result.region}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleResultExpansion(result.id)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      {expandedResultId === result.id ? "Show Less" : "Show More"}
                    </button>
                  </div>
                </div>

                {expandedResultId === result.id && (
                  <div className="mt-4 pl-4 border-l-2 border-blue-500">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Currency: {result.currency || "N/A"}</p>
                        <p className="text-sm text-gray-600">Language: {result.language || "N/A"}</p>
                        <p className="text-sm text-gray-600">Coordinates: {result.latitude}, {result.longitude}</p>
                      </div>
                      <div className="flex gap-2 justify-end">
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
                )}
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

export default Home;