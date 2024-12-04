import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
   
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/verify/${token}`);
        setMessage(response.data.message);

        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        setError(
          err.response?.data?.error || "Verification failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-500 mb-4">Email Verification</h1>
      
      {loading && (
        <div className="text-gray-600 mb-4">Verifying your email...</div>
      )}
      
      {message && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md">
          {message}
          <p className="text-sm mt-2">Redirecting to login page in 3 seconds...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
          <button 
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;