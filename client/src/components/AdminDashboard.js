import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersResponse, reviewsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/reviews`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setUsers(usersResponse.data);
      setReviews(reviewsResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (userId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(prevUsers => prevUsers.map(user => {
        if (user._id === userId) {
          return { ...user, isDeactivated: action === 'deactivate' };
        }
        return user;
      }));
      
      setSuccess(`User ${action}d successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to ${action} user`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReviewVisibility = async (reviewId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/reviews/${reviewId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReviews(prevReviews => prevReviews.map(review => {
        if (review._id === reviewId) {
          return { ...review, isHidden: action === 'hide' };
        }
        return review;
      }));
      
      setSuccess(`Review ${action === 'hide' ? 'hidden' : 'unhidden'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to ${action} review`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleGrantAdmin = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/grant-admin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(prevUsers => prevUsers.map(user => {
        if (user._id === userId) {
          return { ...user, role: 'admin' };
        }
        return user;
      }));
      
      setSuccess('Admin privileges granted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to grant admin privileges');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isDeactivated ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.isDeactivated ? 'Deactivated' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleUserStatusChange(user._id, user.isDeactivated ? 'reactivate' : 'deactivate')}
                      className={`mr-2 px-3 py-1 rounded ${user.isDeactivated ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                    >
                      {user.isDeactivated ? 'Reactivate' : 'Deactivate'}
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleGrantAdmin(user._id)}
                        className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Grant Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Review Management</h2>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map(review => (
                <tr key={review._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{review.user?.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{review.rating}</td>
                  <td className="px-6 py-4">{review.comment}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.isHidden ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {review.isHidden ? 'Hidden' : 'Visible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleReviewVisibility(review._id, review.isHidden ? 'unhide' : 'hide')}
                      className={`px-3 py-1 rounded ${review.isHidden ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                    >
                      {review.isHidden ? 'Unhide' : 'Hide'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;