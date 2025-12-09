import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import FriendContext from '../context/FriendContext';
import FrndImg from '../assets/chatAvatar/bishnu.jpg';
import Swal from 'sweetalert2';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SearchResult = () => {
  const { searchQuery } = useParams();
  const navigate = useNavigate();
  const {
    searchUsers,
    friends,
    loading,
    error,
    sendRequest,
    performSearch,
    clearError,
  } = useContext(FriendContext);

  // PERSISTENT sent requests (saved in localStorage)
  const [sentRequests, setSentRequests] = useState(() => {
    const saved = localStorage.getItem('sentFriendRequests');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save to localStorage whenever sentRequests changes
  useEffect(() => {
    localStorage.setItem('sentFriendRequests', JSON.stringify(Array.from(sentRequests)));
  }, [sentRequests]);

  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      performSearch(searchQuery.trim());
    } else {
      navigate('/home');
    }
  }, [searchQuery, performSearch, navigate]);

  useEffect(() => {
    if (error && !loading) {
      Swal.fire({
        title: 'Search Error',
        text: error,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: { title: 'fcb-font', popup: 'fcb-font', htmlContainer: 'fcb-font', confirmButton: 'fcb-font' }
      });
      clearError();
    }
  }, [error, clearError, loading]);

  const handleAddFriend = async (userId, userName) => {
    if (sentRequests.has(userId) || (friends && friends.some(f => f.id === userId))) return;
    if (loading) return;

    // Optimistic UI
    setSentRequests(prev => new Set([...prev, userId]));

    try {
      const result = await sendRequest(userId);
      if (!result.success) {
        // Rollback if failed
        setSentRequests(prev => { const s = new Set(prev); s.delete(userId); return s; });
        Swal.fire({ title: 'Error', text: result.message || 'Failed to send request', icon: 'error' });
      } else {
        Swal.fire({
          title: 'Success!',
          text: `Friend request sent to ${userName}!`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      setSentRequests(prev => { const s = new Set(prev); s.delete(userId); return s; });
      Swal.fire({ title: 'Error', text: 'Failed to send request', icon: 'error' });
    }
  };

  const getButtonConfig = (userId) => {
    const isFriend = friends && friends.some(f => f.id === userId);
    const isSent = sentRequests.has(userId);

    if (isFriend) return { text: 'Added', variant: 'btn-success', disabled: true };
    if (isSent) return { text: 'Request Sent!', variant: 'btn-secondary', disabled: true };
    return { text: loading ? 'Sending...' : 'Add Friend', variant: 'btn-primary', disabled: loading };
  };

  if (loading && sentRequests.size === 0) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
          <h5 className="text-muted">Searching for users...</h5>
        </div>
      </div>
    );
  }

  const users = Array.isArray(searchUsers) ? searchUsers : [];

  // Helper: render profile logo (image or initial)
  const renderProfileLogo = (user, size = 110) => {
    if (user?.profileImg) {
      return (
        <img
          src={`${API_BASE}${user.profileImg}`}
          alt={user.fullName}
          className="rounded-circle shadow-lg border border-5 border-white"
          style={{ width: `${size}px`, height: `${size}px`, objectFit: "cover" }}
          onError={(e) => e.target.src = FrndImg}
        />
      );
    }
    const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?";
    return (
      <div
        className="rounded-circle shadow-lg border border-5 border-white d-flex align-items-center justify-content-center"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "#2979ff",
          color: "#fff",
          fontSize: `${size / 2}px`,
          fontWeight: "bold",
        }}
      >
        {initial}
      </div>
    );
  };

  return (
    <section className="min-vh-100 py-5" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      <div className="container">

        <div className="mb-4">
          <Link to="/home" className="btn btn-outline-primary rounded-pill px-4 shadow-sm">
            ← Back to Home
          </Link>
        </div>

        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold text-primary mb-2">Search Results</h1>
          <p className="lead text-muted">
            Found <strong className="text-primary">{users.length}</strong> user{users.length !== 1 && 's'} for "
            <span className="text-primary fw-bold">{searchQuery}</span>"
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {users.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i className="fas fa-search display-1 text-muted mb-4 opacity-25"></i>
              <h3 className="text-muted">No users found</h3>
              <p className="lead text-muted">Try searching with a different name</p>
              <button 
                onClick={() => performSearch(searchQuery.trim())}
                disabled={loading}
                className="btn btn-primary btn-lg rounded-pill px-5 shadow-lg mt-3"
              >
                <i className="fas fa-sync-alt me-2"></i> Retry Search
              </button>
            </div>
          ) : (
            users.map((user) => {
              const btn = getButtonConfig(user.id);
              return (
                <div key={user.id} className="col-sm-6 col-md-4 col-lg-3">
                  <div
                    className="card h-100 border-0 shadow-lg rounded-4 overflow-hidden transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.35)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-12px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div className="card-body text-center p-4">
                      <div className="position-relative d-inline-block mb-4">
                        {renderProfileLogo(user, 110)}
                        <div
                          className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-4 border-white"
                          style={{ width: "22px", height: "22px" }}
                        ></div>
                      </div>

                      <h5 className="fw-bold text-dark mb-1">{user.fullName}</h5>
                      <p className="text-muted small mb-4">Registered User</p>

                      <button
                        className={`btn ${btn.variant} rounded-pill px-5 py-3 fw-bold shadow-sm w-100`}
                        onClick={() => handleAddFriend(user.id, user.fullName)}
                        disabled={btn.disabled}
                        style={{ fontSize: "15px", letterSpacing: "0.5px" }}
                      >
                        {btn.text}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchResult;
