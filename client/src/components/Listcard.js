import React, { useState } from "react";

const ListCard = ({ list, onEdit, onDelete, onToggleVisibility, onRemoveDestination }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDestinations, setExpandedDestinations] = useState([]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const toggleDestination = (destId) => {
    setExpandedDestinations((prevState) =>
      prevState.includes(destId)
        ? prevState.filter((id) => id !== destId)
        : [...prevState, destId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      {!isExpanded ? (
        <div className="cursor-pointer" onClick={toggleExpanded}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{list.name}</h3>
              <div className="flex items-center text-gray-600">
                <span className="mr-2">Rating:</span>
                <span className="font-medium">
                  {list.averageRating > 0 ? `${list.averageRating}/5` : "No ratings"}
                  {list.reviewCount > 0 && ` (${list.reviewCount} reviews)`}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-600">{list.destinations?.length || 0} Destinations</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{list.name}</h3>
              <p className="text-gray-600 mt-1">{list.description || "No description"}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                list.visibility ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {list.visibility ? "Public" : "Private"}
            </span>
          </div>

          <div className="border-t border-b border-gray-200 py-4 my-4">
            <h4 className="font-semibold text-gray-700 mb-2">
              Destinations ({list.destinations?.length || 0})
            </h4>
            {list.destinations?.length > 0 ? (
              <div className="space-y-2">
                {list.destinations.map((dest) => {
                  const isDestExpanded = expandedDestinations.includes(dest._id);
                  return (
                    <div key={dest._id} className="flex flex-col bg-gray-50 p-2 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">
                          {dest.Destination}, {dest.Country}
                        </span>
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleDestination(dest._id)}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium mr-2"
                          >
                            {isDestExpanded ? "Collapse" : "Expand"}
                          </button>
                          <button
                            onClick={() => onRemoveDestination(list._id, dest._id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {isDestExpanded && (
                        <div className="mt-2 text-gray-600">
                          {/* Replace with actual details */}
                          <p>Additional details about the destination...</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No destinations added yet</p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-gray-600">
              <span className="mr-2">Rating:</span>
              <span className="font-medium">
                {list.averageRating > 0 ? `${list.averageRating}/5` : "No ratings"}
                {list.reviewCount > 0 && ` (${list.reviewCount} reviews)`}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Last Modified: {new Date(list.updatedAt).toLocaleString()}
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onEdit(list)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(list._id)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => onToggleVisibility(list)}
              className={`px-4 py-2 rounded text-white transition-colors ${
                list.visibility
                  ? "bg-gray-500 hover:bg-gray-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {list.visibility ? "Make Private" : "Make Public"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCard;
