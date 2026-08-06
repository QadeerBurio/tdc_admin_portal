// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Login function - THIS WAS MISSING
  const login = async (newToken, userData) => {
    try {
      if (newToken) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }
      
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Load user & token from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // Save to localStorage whenever user or token changes
  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user, token]);

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];

    // Redirect to login page
    navigate("/login", { replace: true });
  };

  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        loading,
        logout,
        login, // NOW EXPORTED
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};