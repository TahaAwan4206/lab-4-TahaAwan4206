import React, { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const SearchResultsMap = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 5;

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/search?query=${query}`);
      setResults(response.data);
      setError("");
      setCurrentPage(1); 
    } catch (err) {
      setError("Search failed. Please try again.");
    }
  };

  const paginatedResults = () => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    return results.slice(startIndex, startIndex + resultsPerPage);
  };

  const handlePageChange = (direction) => {
    const newPage = currentPage + direction;
    if (newPage > 0 && newPage <= Math.ceil(results.length / resultsPerPage)) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6">Search Destinations</h1>
      <div className="mb-4">
        <input
          type="text"
          className="p-2 border rounded w-full"
          placeholder="Search for destinations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Search
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {results.length > 0 && (
        <>
          <MapContainer center={[51.505, -0.09]} zoom={5} className="h-96 mb-6">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {paginatedResults().map((result) => (
              <Marker key={result.id} position={[result.latitude, result.longitude]}>
                <Popup>
                  <strong>{result.name}</strong>
                  <p>{result.region}, {result.country}</p>
                  <p><strong>Language:</strong> {result.language}</p>
                  <p><strong>Currency:</strong> {result.currency}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="flex justify-between items-center">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(-1)}
              className={`px-4 py-2 rounded ${currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {Math.ceil(results.length / resultsPerPage)}
            </span>
            <button
              disabled={currentPage === Math.ceil(results.length / resultsPerPage)}
              onClick={() => handlePageChange(1)}
              className={`px-4 py-2 rounded ${currentPage === Math.ceil(results.length / resultsPerPage) ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResultsMap;
