import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

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

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-grow bg-gray-100">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Home onLogin={handleLogin} />
                )
              }
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
            <a href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="/acceptable-use" className="hover:underline">
              Acceptable Use
            </a>
            <a href="/dmca-policy" className="hover:underline">
              DMCA Notice
            </a>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;