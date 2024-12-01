import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

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
      const response = await axios.get("http://localhost:3000/api/secure/lists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const listsWithRatings = response.data.map(list => {
        const visibleReviews = list.reviews?.filter(review => !review.isHidden) || [];
        const averageRating = visibleReviews.length > 0
          ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
          : 0;
        
        return {
          ...list,
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount: visibleReviews.length
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
        "http://localhost:3000/api/secure/lists",
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
          list.name.toLowerCase() === editingList.name.trim().toLowerCase() &&
          list._id !== id
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
        `http://localhost:3000/api/secure/lists/${id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = response.data.list;
      const visibleReviews = list.reviews?.filter(review => !review.isHidden) || [];
      const averageRating = visibleReviews.length > 0
        ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
        : 0;

      const updatedList = {
        ...list,
        averageRating: Number(averageRating.toFixed(1)),
        reviewCount: visibleReviews.length
      };

      setLists(lists.map((list) => (list._id === id ? updatedList : list)));
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
      if (!token) {
        setError("Please log in again.");
        return;
      }
  
      await axios.delete(`http://localhost:3000/api/secure/lists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLists(prevLists => prevLists.filter(list => list._id !== id));
      setError("");
    } catch (err) {
      console.error("Error deleting list:", err);
      if (err.response?.status === 404) {
        setError("List not found or you don't have permission to delete it.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to delete this list.");
      } else {
        setError(err.response?.data?.error || "Failed to delete list.");
      }
    }
  };

  const handleVisibilityToggle = async (list) => {
    try {
      const token = localStorage.getItem("token");
      const updatedVisibility = !list.visibility;
      
      const response = await axios.put(
        `http://localhost:3000/api/secure/lists/${list._id}`,
        { visibility: updatedVisibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.list) {
        const updatedList = response.data.list;
        const visibleReviews = updatedList.reviews?.filter(review => !review.isHidden) || [];
        const averageRating = visibleReviews.length > 0
          ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
          : 0;

        const listWithRating = {
          ...updatedList,
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount: visibleReviews.length
        };

        setLists(prevLists => 
          prevLists.map(l => l._id === list._id ? listWithRating : l)
        );
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
        `http://localhost:3000/api/secure/lists/${listId}/destinations/${destinationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.list) {
        const updatedList = response.data.list;
        const visibleReviews = updatedList.reviews?.filter(review => !review.isHidden) || [];
        const averageRating = visibleReviews.length > 0
          ? visibleReviews.reduce((acc, review) => acc + review.rating, 0) / visibleReviews.length
          : 0;

        const listWithRating = {
          ...updatedList,
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount: visibleReviews.length
        };

        setLists(prevLists =>
          prevLists.map(list =>
            list._id === listId ? listWithRating : list
          )
        );
      }
    } catch (err) {
      console.error("Error removing destination:", err);
      setError("Failed to remove destination from list.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">My Lists</h1>

      {/* Create New List Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Create New List</h2>
        <input
          type="text"
          placeholder="List Name"
          value={newList.name}
          onChange={(e) => setNewList({ ...newList, name: e.target.value })}
          className="border p-2 rounded mb-2 w-full"
        />
        <textarea
          placeholder="Description (optional)"
          value={newList.description}
          onChange={(e) => setNewList({ ...newList, description: e.target.value })}
          className="border p-2 rounded mb-2 w-full"
        ></textarea>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={newList.visibility}
            onChange={(e) => setNewList({ ...newList, visibility: e.target.checked })}
            className="form-checkbox"
          />
          <span className="ml-2">Public</span>
        </label>
        <button
          onClick={handleCreateList}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
        >
          Create
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* List Display Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Lists</h2>
        {lists.length === 0 ? (
          <p className="text-gray-600">You have no lists yet.</p>
        ) : (
          lists.map((list) => (
            <div key={list._id} className="border p-4 rounded mb-4 bg-white shadow">
              <p>
                <strong>Name:</strong> {list.name}
              </p>
              <p>
                <strong>Description:</strong> {list.description || "No description"}
              </p>
              <p>
                <strong>Visibility:</strong> {list.visibility ? "Public" : "Private"}
              </p>
              <p>
                <strong>Last Modified:</strong> {new Date(list.updatedAt).toLocaleString()}
              </p>

              {list.destinations?.length > 0 && (
                <div className="mt-2 mb-2">
                  <strong>Destinations:</strong>
                  <ul className="ml-4">
                    {list.destinations.map((dest) => (
                      <li key={dest._id} className="flex items-center justify-between py-1">
                        <span>{dest.Destination} - {dest.Country}</span>
                        <button
                          onClick={() => handleRemoveDestination(list._id, dest._id)}
                          className="text-red-500 hover:text-red-700 ml-2 px-2 py-1 rounded border border-red-500 hover:border-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p>
                <strong>Destinations Count:</strong> {list.destinations?.length || 0}
              </p>
              {list.destinations?.length > 0 && (
  <div className="mt-2 mb-2">
    <strong>Destinations:</strong>
    <ul className="ml-4">
      {list.destinations.map((dest) => (
        <li key={dest._id} className="flex items-center justify-between">
          <span>{dest.Destination} - {dest.Country}</span>
          <button
            onClick={() => handleRemoveDestination(list._id, dest._id)}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  </div>
)}
              <p>
                <strong>Average Rating:</strong> {list.averageRating > 0 ? `${list.averageRating}/5` : "No ratings"}
                {list.reviewCount > 0 && ` (${list.reviewCount} reviews)`}
              </p>
              <div className="mt-2">
                <button
                  onClick={() => setEditingList(list)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteList(list._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleVisibilityToggle(list)}
                  className={`${
                    list.visibility ? "bg-gray-500" : "bg-green-500"
                  } text-white px-4 py-2 rounded`}
                >
                  {list.visibility ? "Make Private" : "Make Public"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit List Modal */}
      {editingList && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-1/2">
            <h2 className="text-2xl font-bold mb-4">Edit List</h2>
            <input
              type="text"
              value={editingList.name}
              onChange={(e) =>
                setEditingList({ ...editingList, name: e.target.value })
              }
              className="border p-2 rounded mb-2 w-full"
              placeholder="List Name"
            />
            <textarea
              value={editingList.description}
              onChange={(e) =>
                setEditingList({ ...editingList, description: e.target.value })
              }
              className="border p-2 rounded mb-2 w-full"
              placeholder="Description (optional)"
            ></textarea>
            <label className="inline-flex items-center mb-2">
              <input
                type="checkbox"
                checked={editingList.visibility}
                onChange={(e) =>
                  setEditingList({ ...editingList, visibility: e.target.checked })
                }
                className="form-checkbox"
              />
              <span className="ml-2">Public</span>
            </label>
            <div className="flex justify-end">
              <button
                onClick={() => handleEditList(editingList._id)}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setEditingList(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLists;