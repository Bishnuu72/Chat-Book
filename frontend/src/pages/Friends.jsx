import React, { useEffect, useContext } from "react";
import FriendContext from "../context/FriendContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const renderProfileLogo = (user, size = 90) => {
  if (user?.profileImg) {
    return (
      <img
        src={`${API_BASE}${user.profileImg}`}
        alt={user.fullName}
        className="rounded-circle mb-3 shadow-lg border border-3 border-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "cover",
          transition: "all 0.3s ease",
        }}
      />
    );
  }

  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?";
  return (
    <div
      className="rounded-circle mb-3 d-flex align-items-center justify-content-center shadow-lg"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        fontSize: `${size / 2.2}px`,
        fontWeight: "bold",
        border: "4px solid rgba(255,255,255,0.3)",
        backdropFilter: "blur(10px)",
      }}
    >
      {initial}
    </div>
  );
};

const Friends = () => {
  const {
    friends,
    pendingRequests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    getFriends,
    getPendingRequests,
    clearError,
  } = useContext(FriendContext);

  useEffect(() => {
    getFriends();
    getPendingRequests();
  }, [getFriends, getPendingRequests]);

  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);

  const handleAcceptRequest = async (requesterId) => {
    try {
      const result = await acceptRequest(requesterId);
      alert(result.message || "Friend request accepted!");
    } catch {
      alert("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requesterId) => {
    if (!window.confirm("Reject this friend request?")) return;
    try {
      const result = await rejectRequest(requesterId);
      alert(result.message || "Friend request rejected.");
    } catch {
      alert("Failed to reject request");
    }
  };

  return (
    <section className="friends-section min-vh-100 py-5" style={{
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold text-primary mb-3" style={{
            background: "linear-gradient(90deg, #2979ff, #00d4ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Your Friends Circle
          </h1>
          <p className="text-muted fs-5">Connect, share, and grow together</p>
        </div>

        {/* Friends Grid */}
        <div className="mb-5">
          <h2 className="mb-4 text-dark fw-bold fs-3">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Your Friends ({friends?.length || 0})
          </h2>

          <div className="row g-4">
            {Array.isArray(friends) && friends.length > 0 ? (
              friends.map((f) => (
                <div className="col-lg-3 col-md-4 col-sm-6" key={f.id}>
                  <div
                    className="card friend-card h-100 border-0 shadow-lg rounded-3 overflow-hidden position-relative"
                    style={{
                      background: "rgba(255, 255, 255, 0.25)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      transition: "all 0.4s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-12px)";
                      e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
                    }}
                  >
                    <div className="card-body text-center p-4 d-flex flex-column align-items-center">
                      {renderProfileLogo(f, 90)}
                      <h5 className="mb-2 fw-bold text-dark">{f.fullName}</h5>
                      <span
                        className="badge rounded-pill px-3 py-2"
                        style={{
                          background: "linear-gradient(45deg, #4facfe, #00f2fe)",
                          color: "white",
                          fontSize: "0.85rem",
                        }}
                      >
                        <i className="bi bi-check2-all me-1"></i> Friend
                      </span>
                    </div>
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(41,121,255,0.1), rgba(0,212,255,0.1))",
                        transition: "all 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <div className="bg-light rounded-4 p-5 shadow-sm">
                  <i className="bi bi-emoji-frown display-1 text-muted mb-3"></i>
                  <p className="lead text-muted">No friends yet. Start connecting!</p>
                  <button className="btn btn-primary btn-lg mt-3 px-5">
                    <i className="bi bi-search me-2"></i> Find People
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div>
          <h2 className="mb-4 text-dark fw-bold fs-3">
            <i className="bi bi-clock-history text-warning me-2"></i>
            Pending Requests ({pendingRequests?.length || 0})
          </h2>

          <div className="row g-4">
            {Array.isArray(pendingRequests) && pendingRequests.length > 0 ? (
              pendingRequests.map((req) => (
                <div className="col-lg-3 col-md-4 col-sm-6" key={req.requesterId}>
                  <div
                    className="card pending-card h-100 border-0 rounded-3 overflow-hidden shadow-lg"
                    style={{
                      background: "rgba(255, 255, 255, 0.3)",
                      backdropFilter: "blur(15px)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      transition: "all 0.4s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-10px) scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                    }}
                  >
                    <div className="card-body text-center p-4 d-flex flex-column align-items-center">
                      {renderProfileLogo(
                        { fullName: req.requesterName, profileImg: req.profileImg },
                        90
                      )}
                      <h5 className="mb-3 fw-bold text-dark">{req.requesterName}</h5>

                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-success btn-sm px-4 py-2 rounded-pill shadow-sm"
                          onClick={() => handleAcceptRequest(req.requesterId)}
                          disabled={loading}
                          style={{
                            background: "linear-gradient(45deg, #56ab2f, #a8e6cf)",
                            border: "none",
                            fontWeight: "600",
                          }}
                        >
                          <i className="bi bi-check-lg me-1"></i> Accept
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm px-4 py-2 rounded-pill shadow-sm"
                          onClick={() => handleRejectRequest(req.requesterId)}
                          disabled={loading}
                          style={{ fontWeight: "600" }}
                        >
                          <i className="bi bi-x-lg">Delete</i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <div className="bg-white rounded-4 p-5 shadow">
                  <i className="bi bi-inbox display-1 text-success mb-3"></i>
                  <p className="lead text-muted">No pending requests. All caught up!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Friends;