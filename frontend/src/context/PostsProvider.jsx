// posts/PostsProvider.jsx
import React, { useCallback, useMemo, useState } from "react";
import PostsContext from "./PostsContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getAuthData = () => {
  const stored = localStorage.getItem("authData");
  if (!stored) return null;
  try {
    const { token, expiry, userId } = JSON.parse(stored);
    if (Date.now() > expiry) {
      localStorage.removeItem("authData");
      return null;
    }
    return { token, userId };
  } catch {
    return null;
  }
};


const PostsProvider = ({ children }) => {
  const [feed, setFeed] = useState([]);
  const [userPosts, setUserPosts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  const createPost = useCallback(async ({ content, file, taggedUserIds }) => {
    const auth = getAuthData();
    if (!auth?.token) {
      setError("Please login again");
      return null;
    }

    try {
      setLoading(true);

      const form = new FormData();
      if (content?.trim()) form.append("content", content.trim());
      if (file) form.append("media", file);
      if (taggedUserIds?.length > 0) {
        form.append("taggedUserIds", JSON.stringify(taggedUserIds));
      }

      const res = await fetch(`${API_BASE}/api/posts/create`, {
        method: "POST",
        headers: {
          "auth-token": auth.token,
        },
        body: form,
      });

      // THIS IS THE KEY FIX — HANDLE NON-JSON RESPONSES FROM YOUR OLD MIDDLEWARE
      let data;
      const text = await res.text();

      if (text.trim() === "" || text.includes("Unauthorized") || text.includes("Invalid Token")) {
        console.error("Auth failed:", text);
        setError("Session expired. Please login again.");
        localStorage.removeItem("authData");
        window.location.href = "/signin";
        return null;
      }

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Server sent non-JSON:", text);
        setError("Server error. Try again.");
        return null;
      }

      if (!res.ok || !data.success) {
        setError(data.error || data.message || "Failed to post");
        return null;
      }

      const post = data.post;
      setFeed(prev => [post, ...prev]);
      setUserPosts(prev => ({
        ...prev,
        [post.userId]: [post, ...(prev[post.userId] || [])]
      }));

      return post;

    } catch (err) {
      console.error("Network error:", err);
      setError("No internet connection");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // keep other functions same...
  const fetchFeed = useCallback(async () => {
    const auth = getAuthData();
    if (!auth?.token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/posts/feed`, { headers: { "auth-token": auth.token } });
      if (!res.ok) {
        const txt = await res.text();
        if (txt.includes("Unauthorized") || txt.includes("Invalid")) {
          localStorage.removeItem("authData");
          window.location.href = "/signin";
        }
        throw new Error(txt);
      }
      const data = await res.json();
      setFeed(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPosts = useCallback(async (userId) => {
    const auth = getAuthData();
    if (!auth?.token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/posts/user/${userId}`, { headers: { "auth-token": auth.token } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUserPosts(prev => ({ ...prev, [userId]: Array.isArray(data) ? data : [] }));
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePost = useCallback(async (postId) => {
    const auth = getAuthData();
    if (!auth?.token) return false;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "auth-token": auth.token },
      });
      if (!res.ok) throw new Error(await res.text());
      
      setFeed(prev => prev.filter(p => p.id !== postId));
      setUserPosts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(uid => {
          updated[uid] = updated[uid].filter(p => p.id !== postId);
        });
        return updated;
      });
      return true;
    } catch {
      setError("Failed to delete");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    feed, userPosts, loading, error,
    createPost, fetchFeed, fetchUserPosts, deletePost, clearError
  }), [feed, userPosts, loading, error, createPost, fetchFeed, fetchUserPosts, deletePost]);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
};

export default PostsProvider;