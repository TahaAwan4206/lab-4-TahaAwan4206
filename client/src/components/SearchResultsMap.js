import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import PublicLists from "./components/PublicLists";
import VerifyEmail from "./components/VerifyEmail";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import MyLists from "./components/MyLists";
import PrivacyPolicy from "./components/PrivacyPolicy";
import AcceptableUsePolicy from "./components/AcceptableUsePolicy";
import DMCANotice from "./components/DMCANotice";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

      
        const response = await axios.get("http://localhost:3000/api/secure/user", {
          headers: { Authorization: `Bearer ${token}` },
        });


        if (response.data._id === parsedUser._id) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          throw new Error("Token mismatch");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleLogin = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar
          isAuthenticated={isAuthenticated}
          user={user}
          setIsAuthenticated={setIsAuthenticated}
          setUser={setUser}
          onLogout={handleLogout}
        />
        <main className="flex-grow bg-gray-100">
          <Routes>
            <Route
              path="/"
              element={<Home isAuthenticated={isAuthenticated} user={user} />}
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Signup />
                )
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/public-lists" element={<PublicLists />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard
                    user={user}
                    setIsAuthenticated={setIsAuthenticated}
                    setUser={setUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  requiredRole="admin"
                  user={user}
                >
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-lists"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <MyLists user={user} />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/acceptable-use" element={<AcceptableUsePolicy />} />
            <Route path="/dmca-policy" element={<DMCANotice />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-center space-x-6">
            <Link to="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link to="/acceptable-use" className="hover:underline">
              Acceptable Use
            </Link>
            <Link to="/dmca-policy" className="hover:underline">
              DMCA Notice
            </Link>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
