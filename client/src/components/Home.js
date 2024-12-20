import React, { useState } from 'react';
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const Home = ({ onLogin }) => {
  const [searchDestination, setSearchDestination] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [searchRegion, setSearchRegion] = useState("");
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
    setError("");

    try {
      const params = {};
      if (searchDestination.trim()) {
        params.destination = searchDestination.trim();
      }
      if (searchCountry.trim()) {
        params.country = searchCountry.trim();
      }
      if (searchRegion.trim()) {
        params.region = searchRegion.trim();
      }

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/open/destinations/search`,
        {
          params: params,
        }
      );

      if (response.data.length === 0) {
        setError("No destinations found. Please try a different query.");
        setSearchResults([]);
      } else {
        setSearchResults(response.data);
        setError("");
      }
    } catch (error) {
      console.error("Error searching destinations:", error);
      setError("Search failed. Please try again.");
      setSearchResults([]);
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Destination"
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Country"
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Region"
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={searchDestinations}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}
          {searchResults.length === 0 && !error && (
            <p className="text-gray-500 mb-4">No results to display.</p>
          )}

          <div className="space-y-4 mt-4">
            {searchResults.map((result, index) => (
              <div key={result.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{result.name || result.Destination}</h3>
                    <p className="text-gray-600">{result.country || result.Country}, {result.region || result.Region}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleResultExpansion(result.id || index)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      {expandedResultId === (result.id || index) ? "Show Less" : "Show More"}
                    </button>
                  </div>
                </div>

                {expandedResultId === (result.id || index) && (
                  <div className="mt-4 pl-4 border-l-2 border-blue-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Currency: {result.currency || result.Currency || "N/A"}</p>
                        <p className="text-sm text-gray-600">Language: {result.language || result.Language || "N/A"}</p>
                        <p className="text-sm text-gray-600">
                          Coordinates: {result.latitude || result.Latitude}, {result.longitude || result.Longitude}
                        </p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 justify-end">
                        <button
                          onClick={() => showOnMap(result.latitude || result.Latitude, result.longitude || result.Longitude, result.name || result.Destination)}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                        >
                          View Map
                        </button>
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                          onClick={() => window.open(`https://duckduckgo.com/?q=${encodeURIComponent((result.name || result.Destination) + " " + (result.country || result.Country))}`, "_blank")}
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
                attribution='&copy; OpenStreetMap contributors'
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
