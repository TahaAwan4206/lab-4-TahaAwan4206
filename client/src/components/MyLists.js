import React, { useState, useEffect } from "react";
import axios from "axios";

const ListCard = ({ list, onEdit, onDelete, onToggleVisibility, onRemoveDestination }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={toggleExpanded}
    >
      {!isExpanded ? (
       
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">{list.name}</h3>
          <div className="flex flex-col items-end">
            <div className="flex items-center text-gray-600">
              <span className="mr-2">Rating:</span>
              <span className="font-medium">
                {list.averageRating > 0 ? `${list.averageRating}/5` : "No ratings"}
                {list.reviewCount > 0 && ` (${list.reviewCount} reviews)`}
              </span>
            </div>
            <span className="text-gray-600">
              {list.destinations?.length || 0} Destinations
            </span>
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
                {list.destinations.map((dest) => (
                  <div
                    key={dest._id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-gray-700">
                      {dest.Destination}, {dest.Country}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDestination(list._id, dest._id);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit(list);
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(list._id);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(list);
              }}
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

const MyLists = () => {
  const [lists, setLists] = useState([]);
  const [newList, setNewList] = useState({ name: "", description: "", visibility: false });
  const [editingList, setEditingList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/secure/lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const listsWithRatings = response.data.map((list) => {
        const visibleReviews = list.reviews?.filter((review) => !review.isHidden) || [];
        const averageRating =
          visibleReviews.length > 0
            ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
            : 0;

        return {
          ...list,
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount: visibleReviews.length,
        };
      });

      setLists(listsWithRatings);
    } catch (err) {
      console.error("Error fetching lists:", err);
      setError("Failed to fetch lists.");
    }
  };

  const handleCreateList = async () => {
    try {
      if (!newList.name) {
        setError("List name is required.");
        return;
      }
      if (lists.length >= 20) {
        setError("You can create up to 20 lists.");
        return;
      }

      const duplicate = lists.find(
        (list) => list.name.toLowerCase() === newList.name.trim().toLowerCase()
      );
      if (duplicate) {
        setError("List name already exists.");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/secure/lists`,
        newList,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLists([...lists, response.data.newList]);
      setNewList({ name: "", description: "", visibility: false });
      setError("");
    } catch (err) {
      console.error("Error creating list:", err);
      setError(err.response?.data?.error || "Failed to create list.");
    }
  };

  const handleEditList = async (id) => {
    try {
      if (!editingList.name) {
        setError("List name is required.");
        return;
      }

      const duplicate = lists.find(
        (list) =>
          list.name.toLowerCase() === editingList.name.trim().toLowerCase() && list._id !== id
      );
      if (duplicate) {
        setError("Another list with this name already exists.");
        return;
      }

      const token = localStorage.getItem("token");
      const updateData = {
        name: editingList.name,
        description: editingList.description,
        visibility: editingList.visibility,
      };

      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/secure/lists/${id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedList = response.data.list;
      const visibleReviews = updatedList.reviews?.filter((review) => !review.isHidden) || [];
      const averageRating =
        visibleReviews.length > 0
          ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
          : 0;

      const listWithRating = {
        ...updatedList,
        averageRating: Number(averageRating.toFixed(1)),
        reviewCount: visibleReviews.length,
      };

      setLists(lists.map((list) => (list._id === id ? listWithRating : list)));
      setEditingList(null);
      setError("");
    } catch (err) {
      console.error("Error updating list:", err);
      setError(err.response?.data?.error || "Failed to update list.");
    }
  };

  const handleDeleteList = async (id) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this list?");
      if (!confirmDelete) {
        return;
      }

      const token = localStorage.getItem("token");
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/secure/lists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLists(lists.filter((list) => list._id !== id));
      setError("");
    } catch (err) {
      console.error("Error deleting list:", err);
      setError(err.response?.data?.error || "Failed to delete list.");
    }
  };

  const handleVisibilityToggle = async (list) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/secure/lists/${list._id}`,
        { visibility: !list.visibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.list) {
        const updatedList = response.data.list;
        const visibleReviews = updatedList.reviews?.filter((review) => !review.isHidden) || [];
        const averageRating =
          visibleReviews.length > 0
            ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
            : 0;

        const listWithRating = {
          ...updatedList,
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount: visibleReviews.length,
        };

        setLists(lists.map((l) => (l._id === list._id ? listWithRating : l)));
      }
    } catch (err) {
      console.error("Error toggling visibility:", err);
      setError("Failed to toggle visibility. Please try again.");
    }
  };

  const handleRemoveDestination = async (listId, destinationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/secure/lists/${listId}/destinations/${destinationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.list) {
        const updatedList = response.data.list;
        const visibleReviews = updatedList.reviews?.filter((review) => !review.isHidden) || [];
        const averageRating =
          visibleReviews.length > 0
            ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
            : 0;

        const listWithRating = {
          ...updatedList,
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount: visibleReviews.length,
        };

        setLists((prevLists) =>
          prevLists.map((list) => (list._id === listId ? listWithRating : list))
        );
      }
    } catch (err) {
      console.error("Error removing destination:", err);
      setError("Failed to remove destination from list.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Lists</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New List</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="List Name"
            value={newList.name}
            onChange={(e) => setNewList({ ...newList, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={newList.description}
            onChange={(e) => setNewList({ ...newList, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          />
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newList.visibility}
                onChange={(e) => setNewList({ ...newList, visibility: e.target.checked })}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span className="ml-2 text-gray-700">Make list public</span>
            </label>
          </div>
          <button
            onClick={handleCreateList}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Create List
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Lists</h2>
        {lists.length === 0 ? (
          <p className="text-gray-600">You have no lists yet.</p>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => (
              <ListCard
                key={list._id}
                list={list}
                onEdit={setEditingList}
                onDelete={handleDeleteList}
                onToggleVisibility={handleVisibilityToggle}
                onRemoveDestination={handleRemoveDestination}
              />
            ))}
          </div>
        )}
      </div>

      {editingList && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit List</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={editingList.name}
                onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="List Name"
              />
              <textarea
                value={editingList.description}
                onChange={(e) =>
                  setEditingList({ ...editingList, description: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Description (optional)"
                rows="3"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingList.visibility}
                  onChange={(e) =>
                    setEditingList({ ...editingList, visibility: e.target.checked })
                  }
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
                <span className="ml-2">Public</span>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEditList(editingList._id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingList(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
              {error && <p className="text-red-500">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLists;
