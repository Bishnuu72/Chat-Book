import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import FriendContext from './FriendContext';
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = `${API_BASE}/api/friends`;

// FIXED: Get auth headers from 'authData' (matches Signin.jsx)
const getAuthHeaders = () => {
  const authData = localStorage.getItem('authData');
  if (!authData) {
    console.log('No authData found');
    return { headers: { 'Content-Type': 'application/json' } };
  }

  try {
    const { token, expiry } = JSON.parse(authData);
    const now = Date.now();
    if (now >= expiry) {
      console.log('Token expired');
      localStorage.removeItem('authData');
      return { headers: { 'Content-Type': 'application/json' } };
    }
    // console.log('Current valid token in FriendState: Present');
    return {
      headers: {
        'Content-Type': 'application/json',
        'auth-token': token,
      },
    };
  } catch (err) {
    console.error('Invalid authData:', err);
    localStorage.removeItem('authData');
    return { headers: { 'Content-Type': 'application/json' } };
  }
};

const FriendState = (props) => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const tokenRef = useRef(null); // Track parsed token

  // Refs for stable shared logic (breaks hoisting cycles)
  const apiCallRef = useRef(null);
  const logoutRef = useRef(null);

  // Helper for all API calls (stored in ref for stability)
  apiCallRef.current = (method, url, data = {}) => {
    if (isLoggingOut) return null;
    return axios({
      method,
      url,
      data,
      ...getAuthHeaders(),
      timeout: 5000,
    }).catch((err) => {
      if (err.response?.status === 401) {
        logoutRef.current();
        return null;
      }
      throw err;
    });
  };

  const makeApiCall = apiCallRef.current;

  // Logout (stored in ref)
  logoutRef.current = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    localStorage.removeItem('authData');
    setError(null);
    setFriends([]);
    setPendingRequests([]);
    setSearchUsers([]);
    tokenRef.current = null;
    window.location.href = '/signin';
  };

  const logout = logoutRef.current;

  // BASIC FUNCTIONS FIRST (no deps on other callbacks)
  // Get all friends
  const getFriends = useCallback(async () => {
    if (isLoggingOut || !tokenRef.current) return;
    const url = `${API_BASE_URL}/list`;
    setLoading(true);
    setError(null);
    try {
      const response = await makeApiCall('get', url);
      if (!response) return;
      const friendsData = Array.isArray(response.data) ? response.data : [];
      setFriends(friendsData);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch friends';
      setError(errorMsg);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  // Get pending friend requests
  const getPendingRequests = useCallback(async () => {
    if (isLoggingOut || !tokenRef.current) return;
    const url = `${API_BASE_URL}/pending`;
    setLoading(true);
    setError(null);
    try {
      const response = await makeApiCall('get', url);
      if (!response) return;
      const requestsData = Array.isArray(response.data) ? response.data : [];
      setPendingRequests(requestsData);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch pending requests';
      setError(errorMsg);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  // Search users (stabilized)
  const searchUsersFunc = useCallback(async (query) => {
    console.log('searchUsersFunc called with query:', query);
    if (!query || query.trim() === '' || isLoggingOut || !tokenRef.current) {
      console.log('Search aborted: Invalid query or no token');
      setSearchUsers([]);
      return;
    }
    const trimmedQuery = query.trim();
    const url = `${API_BASE_URL}/search?query=${encodeURIComponent(trimmedQuery)}`;
    console.log('Calling search API:', url);
    setLoading(true);
    setError(null);
    try {
      const response = await makeApiCall('get', url);
      if (!response) {
        console.log('Search response null (likely 401)');
        return;
      }
      const searchData = Array.isArray(response.data) ? response.data : [];
      console.log('Search results received:', searchData);
      setSearchUsers(searchData);
    } catch (err) {
      console.error('Search error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to search users';
      setError(errorMsg);
      setSearchUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  // DEPENDENT FUNCTIONS (now safe)
  // Send friend request
  const sendRequest = useCallback(async (receiverId) => {
    const url = `${API_BASE_URL}/add`;
    setLoading(true);
    setError(null);
    try {
      const response = await makeApiCall('post', url, { receiverId });
      if (!response) return { success: false, message: 'Session expired. Please log in again.' };
      getPendingRequests();
      return { success: true, message: response.data.message };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send request';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  // Accept friend request
  const acceptRequest = useCallback(async (requesterId) => {
    const url = `${API_BASE_URL}/accept/${requesterId}`;
    setLoading(true);
    setError(null);
    try {
      const response = await makeApiCall('put', url, {});
      if (!response) return { success: false, message: 'Session expired. Please log in again.' };
      getFriends();
      getPendingRequests();
      return { success: true, message: response.data.message };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to accept request';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  // Reject friend request
  const rejectRequest = useCallback(async (requesterId) => {
    const url = `${API_BASE_URL}/reject/${requesterId}`;
    setLoading(true);
    setError(null);
    try {
      const response = await makeApiCall('put', url, {});
      if (!response) return { success: false, message: 'Session expired. Please log in again.' };
      getPendingRequests();
      return { success: true, message: response.data.message || 'Request rejected successfully' };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to reject request';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  // FIXED: retryFetches (direct calls, no callback deps)
  const retryFetches = useCallback(() => {
    if (isLoggingOut || !tokenRef.current) return;
    getFriends();
    getPendingRequests();
  }, [isLoggingOut]); // FIXED: No callback deps - direct calls are safe

  const clearError = useCallback(() => setError(null), []);

  // FIXED: Storage watch (safe deps)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authData') {
        const newAuthData = e.newValue;
        const newToken = newAuthData ? JSON.parse(newAuthData)?.token : null;
        if (newToken !== tokenRef.current) {
          console.log('AuthData changed detected, re-fetching data...');
          tokenRef.current = newToken;
          if (newToken) {
            retryFetches();
          } else {
            setFriends([]);
            setPendingRequests([]);
            setSearchUsers([]);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(() => {
      const currentToken = getAuthHeaders().headers['auth-token'] || null;
      if (currentToken !== tokenRef.current) {
        handleStorageChange({ key: 'authData', newValue: localStorage.getItem('authData') });
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [retryFetches]); // FIXED: Safe dep

  // FIXED: Initial fetches (safe deps)
  useEffect(() => {
    tokenRef.current = getAuthHeaders().headers['auth-token'] || null;
    if (tokenRef.current) {
      getFriends();
      getPendingRequests();
    }
  }, []); // FIXED: Empty deps - functions are stable

  const contextValue = {
    friends,
    pendingRequests,
    searchUsers,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    getFriends,
    performSearch: searchUsersFunc,
    getPendingRequests,
    clearError,
    retryFetches,
    logout,
  };

  return (
    <FriendContext.Provider value={contextValue}>
      {props.children}
    </FriendContext.Provider>
  );
};

export default FriendState;