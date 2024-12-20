import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const Dashboard = ({ user, setIsAuthenticated, setUser }) => {
  const [mapData, setMapData] = useState({ visible: false, coordinates: null, name: "" });
  const [userLists, setUserLists] = useState([]);
  const [searchDestination, setSearchDestination] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [searchRegion, setSearchRegion] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [error, setError] = useState("");
  const [expandedDestination, setExpandedDestination] = useState(null);

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  const fetchUserLists = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/secure/lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserLists(response.data);
    } catch (error) {
      console.error("Error fetching user lists:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [setUser, setIsAuthenticated]);

  useEffect(() => {
    fetchUserLists();
  }, [fetchUserLists]);

  const showOnMap = (latitude, longitude, name) => {
    setMapData({
      visible: true,
      coordinates: [latitude, longitude],
      name,
    });
  };

  const closeMap = () => {
    setMapData({ visible: false, coordinates: null, name: "" });
  };

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

  const addToList = async (e, destination) => {
    e.stopPropagation();

    if (!selectedList) {
      setError("Please select a list first.");
      return;
    }

    try {
      const destinationId = destination._id || destination.id;
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/secure/lists/${selectedList}/destinations`,
        { destinationId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.list) {
        setUserLists((prevLists) =>
          prevLists.map((list) =>
            list._id === selectedList ? response.data.list : list
          )
        );
        setError("");
      } else {
        setError("Failed to update list.");
      }
    } catch (error) {
      console.error("Error adding destination to list:", error.response?.data);
      setError(error.response?.data?.error || "Failed to add destination to list.");
    }
  };

  const toggleExpandDestination = (index) => {
    setExpandedDestination((prev) => (prev === index ? null : index));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Search Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Destination"
            value={searchDestination}
            onChange={(e) => setSearchDestination(e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            type="text"
            placeholder="Country"
            value={searchCountry}
            onChange={(e) => setSearchCountry(e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            type="text"
            placeholder="Region"
            value={searchRegion}
            onChange={(e) => setSearchRegion(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>
        <button
          onClick={searchDestinations}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {searchResults.length === 0 && !error && (
          <p className="text-gray-500 mt-4">No results to display.</p>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4">
          {searchResults.map((destination, index) => (
            <div
              key={destination._id || index}
              className="border p-4 rounded bg-white shadow-md cursor-pointer"
              onClick={() => toggleExpandDestination(index)}
            >
              <h3 className="text-lg font-bold">
                {destination.name || destination.Destination}
              </h3>
              <p>
                <strong>Country:</strong>{" "}
                {destination.country || destination.Country}
              </p>
              <p>
                <strong>Region:</strong>{" "}
                {destination.region || destination.Region}
              </p>

              {expandedDestination === index && (
                <div className="mt-4">
                  <p>
                    <strong>Latitude:</strong>{" "}
                    {destination.latitude || destination.Latitude}
                  </p>
                  <p>
                    <strong>Longitude:</strong>{" "}
                    {destination.longitude || destination.Longitude}
                  </p>
                  <p>
                    <strong>Currency:</strong>{" "}
                    {destination.currency || destination.Currency}
                  </p>
                  <p>
                    <strong>Language:</strong>{" "}
                    {destination.language || destination.Language}
                  </p>
                  <div className="mt-4 flex items-center space-x-2">
                    <select
                      value={selectedList}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSelectedList(e.target.value)}
                      className="border p-2 rounded"
                    >
                      <option value="">Select a list</option>
                      {userLists.map((list) => (
                        <option key={list._id} value={list._id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={(e) => addToList(e, destination)}
                      disabled={!selectedList}
                      className={`px-4 py-2 rounded ${
                        selectedList
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Add to List
                    </button>
                    <button
                      onClick={() =>
                        window.open(
                          `https://duckduckgo.com/?q=${encodeURIComponent(
                            (destination.name || destination.Destination) +
                              " " +
                              (destination.country || destination.Country)
                          )}`,
                          "_blank"
                        )
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Search on DDG
                    </button>
                    <button
                      onClick={() =>
                        showOnMap(
                          destination.latitude || destination.Latitude,
                          destination.longitude || destination.Longitude,
                          destination.name || destination.Destination
                        )
                      }
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Show on Map
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {mapData.visible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "80%",
              height: "80%",
              backgroundColor: "white",
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={closeMap}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "red",
                color: "white",
                border: "none",
                padding: "10px",
                cursor: "pointer",
                borderRadius: "5px",
                zIndex: 1001,
              }}
            >
              Close
            </button>
            <MapContainer
              center={mapData.coordinates || [0, 0]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
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

export default Dashboard;
