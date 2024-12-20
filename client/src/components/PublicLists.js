import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PublicLists = () => {
  const [publicLists, setPublicLists] = useState([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedList, setExpandedList] = useState(null);
  const [expandedDestinations, setExpandedDestinations] = useState({});
  const [newReview, setNewReview] = useState({ rating: 1, comment: "" });
  const [reviewListId, setReviewListId] = useState(null);

  useEffect(() => {
    fetchPublicLists();
  }, [limit]);

  const fetchPublicLists = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/open/public-lists`, {
        params: {
          limit: limit,
        },
      });

      const listsWithRatings = response.data.map((list) => {
        const visibleReviews = list.reviews?.filter((review) => !review.isHidden) || [];
        const averageRating =
          visibleReviews.length > 0
            ? Number(
                (
                  visibleReviews.reduce((acc, review) => acc + review.rating, 0) /
                  visibleReviews.length
                ).toFixed(1)
              )
            : 0;
        return {
          ...list,
          averageRating: averageRating,
          reviewCount: visibleReviews.length,
        };
      });

      setPublicLists(listsWithRatings);
    } catch (error) {
      console.error("Error fetching public lists:", error);
      setError("Failed to load public lists. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (listId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to add a review");
        return;
      }

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/secure/lists/${listId}/reviews`,
        newReview,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedListResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/open/public-lists/${listId}`);
      
      const visibleReviews = updatedListResponse.data.reviews?.filter(review => !review.isHidden) || [];
      const averageRating =
        visibleReviews.length > 0
          ? Number(
              (
                visibleReviews.reduce((acc, review) => acc + review.rating, 0) /
                visibleReviews.length
              ).toFixed(1)
            )
          : 0;

      const updatedListWithRatings = {
        ...updatedListResponse.data,
        averageRating: averageRating,
        reviewCount: visibleReviews.length,
      };

      setPublicLists((lists) => 
        lists.map((list) => list._id === listId ? updatedListWithRatings : list)
      );

      setReviewListId(null);
      setNewReview({ rating: 1, comment: "" });
      setError("");
    } catch (err) {
      console.error("Review error:", err);
      if (err.response?.status === 404) {
        setError("This list no longer exists");
        await fetchPublicLists();
      } else {
        setError(err.response?.data?.error || "Failed to add review");
      }
    }
  };

  const toggleDestination = (listId, destIndex) => {
    setExpandedDestinations((prev) => {
      const listDestinations = new Set(prev[listId] || []);
      if (listDestinations.has(destIndex)) {
        listDestinations.delete(destIndex);
      } else {
        listDestinations.add(destIndex);
      }
      return { ...prev, [listId]: listDestinations };
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Public Lists</h2>

      <div className="mb-4">
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="p-2 border rounded w-full md:w-1/4"
        >
          {[...Array(10).keys()].map((i) => (
            <option key={i + 1} value={i + 1}>
              Show {i + 1} {i + 1 === 1 ? "List" : "Lists"}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-600">Loading lists...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="space-y-4">
        {publicLists.map((list) => (
          <div key={list._id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{list.name}</h3>
                <p className="text-sm text-gray-600">Created by {list.owner?.username || 'Unknown'}</p>
                <p className="text-sm text-gray-500">
                  {list.averageRating !== undefined && list.averageRating >= 0
                    ? `${list.averageRating}/5`
                    : "No ratings yet"}
                </p>
                {list.reviewCount > 0 && (
                  <p className="text-sm text-gray-500">({list.reviewCount} reviews)</p>
                )}
              </div>
              <button
                onClick={() => setExpandedList(expandedList === list._id ? null : list._id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {expandedList === list._id ? "Hide Details" : "View Details"}
              </button>
            </div>

            {expandedList === list._id && (
              <div className="mt-4">
                {list.description && (
                  <p className="text-gray-700 mb-3">{list.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <h4 className="font-semibold">Destinations:</h4>
                  {list.destinations && list.destinations.map((dest, index) => (
                    <div key={`${list._id}-dest-${index}`} className="border-l-2 border-blue-500 pl-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{dest.name || dest.Destination}</p>
                          <p className="text-sm text-gray-600">
                            {dest.region || dest.Region}, {dest.country || dest.Country}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleDestination(list._id, index)}
                          className="text-sm text-blue-500 underline"
                        >
                          {expandedDestinations[list._id]?.has(index) ? "Hide Details" : "Show Details"}
                        </button>
                      </div>

                      {expandedDestinations[list._id]?.has(index) && (
                        <div className="mt-2 text-sm text-gray-700">
                          {Object.entries(dest)
                            .filter(([key]) => key !== "_id" && key !== "__v")
                            .map(([key, value]) => (
                              <p key={key}>
                                <strong>{key}:</strong> {value}
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-2">Reviews:</h4>
                  
                  {list._id !== reviewListId && (
                    <button
                      onClick={() => setReviewListId(list._id)}
                      className="bg-green-500 text-white px-4 py-2 rounded mb-4"
                    >
                      Add Review
                    </button>
                  )}

                  {reviewListId === list._id && (
                    <div className="mb-4 p-4 border rounded">
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                        className="border p-2 rounded w-full mb-2"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>{num} Stars</option>
                        ))}
                      </select>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        placeholder="Add your comment (optional)"
                        className="border p-2 rounded w-full mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAddReview(list._id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                          Submit Review
                        </button>
                        <button
                          onClick={() => {
                            setReviewListId(null);
                            setNewReview({ rating: 1, comment: "" });
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {list.reviews && list.reviews.map((review) => (
                    <div key={review._id} className="border-l-4 border-blue-500 pl-3 mb-2">
                      <p><strong>Rating:</strong> {review.rating}/5</p>
                      {review.comment && (
                        <p><strong>Comment:</strong> {review.comment}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        By {review.user?.username || 'Anonymous'} on {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && publicLists.length === 0 && (
          <p className="text-center text-gray-500">No public lists available.</p>
        )}
      </div>
    </div>
  );
};

export default PublicLists;
