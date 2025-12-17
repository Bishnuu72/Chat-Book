import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import chatLogo from "../assets/chatbookLogo/chatbook-logo.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);

  const getAuthData = () => {
    const stored = localStorage.getItem("authData");
    if (!stored) return null;
    const { token, expiry, userId } = JSON.parse(stored);
    const now = Date.now();
    if (now > expiry) {
      localStorage.removeItem("authData");
      return null;
    }
    return { token, userId };
  };

  const auth = getAuthData();

  const fetchProfile = async () => {
    try {
      if (!auth) return;
      const res = await fetch(`${API_BASE}/api/users/${auth.userId}`, {
        headers: { "auth-token": auth.token },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Error fetching profile:", err.message);
    }
  };

  useEffect(() => {
    if (auth) {
      setIsLoggedIn(true);
      fetchProfile();
    } else {
      setIsLoggedIn(false);
      if (location.pathname !== "/signin" && location.pathname !== "/") {
        navigate("/signin");
      }
    }
  }, [location, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authData");
    setIsLoggedIn(false);
    navigate("/signin");
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search-result/${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="Navbar-section bg-white shadow-sm sticky-top">
      <div className="container-fluid nav-all d-flex align-items-center justify-content-between flex-wrap py-2 px-4">

        {/* Logo */}
        <div className="nav-logo">
          <Link to="/home">
            <img src={chatLogo} alt="Chatbook" style={{ height: "48px" }} />
          </Link>
        </div>

        {/* Navigation Links - Exactly as before */}
        {isLoggedIn && (
          <div className="nav-links">
            <ul>
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/friend">Friends</Link></li>
              <li><Link to="/message">Messages</Link></li>
              {/* <li><Link to="#">Notifications</Link></li>
              <li><Link to="#">Explore</Link></li>
              <li><Link to="#">Market Place</Link></li> */}
            </ul>
          </div>
        )}

        {/* Search Section - Exactly as before */}
        {isLoggedIn && (
          <form onSubmit={handleSearch} className="nav-search d-flex me-3" style={{ flex: 1, maxWidth: "250px" }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              enterKeyHint="search"
              style={{ maxWidth: "200px" }}
            />
            <button type="submit" className="btn btn-outline-primary btn-sm ms-1">
              <i className="fas fa-search"></i>
            </button>
          </form>
        )}

        {/* PROFILE BUTTON + DROPDOWN - NOW ABSOLUTELY GORGEOUS */}
        <div className="position-relative">
          {isLoggedIn && user && (
            <>
              {/* Premium Profile Button */}
              <div
                ref={avatarRef}
                onClick={toggleMenu}
                className="d-flex align-items-center gap-3 bg-white rounded-pill px-4 py-2 shadow-lg border border-2 border-light cursor-pointer position-relative overflow-hidden"
                style={{
                  cursor: "pointer",
                  transition: "all 0.4s ease",
                  background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
                }}
              >
                {/* Avatar */}
                {user.profileImg ? (
                  <img
                    src={`${API_BASE}${user.profileImg}`}
                    alt={user.fullName}
                    className="rounded-circle shadow"
                    style={{ width: "50px", height: "50px", objectFit: "cover", border: "4px solid #fff" }}
                  />
                ) : (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow"
                    style={{
                      width: "50px",
                      height: "50px",
                      background: "linear-gradient(135deg, #667eea, #764ba2)",
                      fontSize: "22px",
                      border: "4px solid #fff",
                    }}
                  >
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name + Arrow */}
                <div className="text-start">
                  <div className="fw-bold text-dark" style={{ fontSize: "15px" }}>
                    {user.fullName.split(" ")[0]}
                  </div>
                  <small className="text-muted fw-medium">My Account</small>
                </div>

                <i
                  className={`fas fa-chevron-down ms-3 transition-transform ${showMenu ? "rotate-180" : ""}`}
                  style={{ fontSize: "14px", color: "#777" }}
                ></i>

                {/* Glow Effect */}
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))",
                    transition: "all 0.4s ease",
                  }}
                />
              </div>

              {/* Ultra Beautiful Dropdown */}
              {showMenu && (
                <div
                  ref={dropdownRef}
                  className="position-absolute end-0 mt-3 bg-white rounded-4 shadow-2xl border-0 overflow-hidden"
                  style={{
                    width: "300px",
                    zIndex: 9999,
                    backdropFilter: "blur(20px)",
                    background: "rgba(255, 255, 255, 0.97)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Header */}
                  <div className="p-4 text-center" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                    {user.profileImg ? (
                      <img
                        src={`${API_BASE}${user.profileImg}`}
                        alt={user.fullName}
                        className="rounded-circle mb-3 shadow-lg"
                        style={{ width: "90px", height: "90px", objectFit: "cover", border: "5px solid white" }}
                      />
                    ) : (
                      <div
                        className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center text-white fw-bold shadow-lg"
                        style={{
                          width: "90px",
                          height: "90px",
                          background: "linear-gradient(135deg, #667eea, #764ba2)",
                          fontSize: "40px",
                          border: "5px solid white",
                        }}
                      >
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h5 className="text-white fw-bold mb-1">{user.fullName}</h5>
                    <p className="text-white opacity-90 mb-0" style={{ fontSize: "14px" }}>Welcome back! ✨</p>
                  </div>

                  {/* Menu */}
                  <div className="p-3">
                    <Link
                      to="/profile"
                      className="d-flex align-items-center px-4 py-3 text-dark text-decoration-none rounded-3 mb-2"
                      style={{
                        background: "rgba(102,126,234,0.05)",
                        transition: "all 0.3s ease",
                        fontWeight: "500",
                      }}
                      onClick={() => setShowMenu(false)}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(102,126,234,0.15)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(102,126,234,0.05)"}
                    >
                      <i className="fas fa-user-circle me-3 text-primary" style={{ fontSize: "20px" }}></i>
                      <span>My Profile</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-100 d-flex align-items-center px-4 py-3 text-danger bg-transparent border-0 rounded-3"
                      style={{
                        fontWeight: "500",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee";
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <i className="fas fa-sign-out-alt me-3" style={{ fontSize: "20px" }}></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Navbar;