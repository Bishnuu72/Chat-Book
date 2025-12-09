import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");

  const getAuthData = () => {
    const stored = localStorage.getItem("authData");
    if (!stored) return null;
    const { token, expiry, userId } = JSON.parse(stored);
    if (Date.now() > expiry) {
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
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file || !auth) return;
    try {
      const formData = new FormData();
      formData.append("profileImg", file);

      const res = await fetch(
        `${API_BASE}/api/users/${auth.userId}/upload-photo`,
        {
          method: "POST",
          headers: { "auth-token": auth.token },
          body: formData,
        }
      );

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessage("Profile photo updated successfully!");
      setUser((prev) => ({ ...prev, profileImg: data.profileImg }));
      setFile(null);
      setPreview(null);
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Error uploading photo:", err.message);
      setMessage("Failed to update photo");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
      </div>
    );
  }

  const renderProfileLogo = (size = 180) => {
    if (preview) {
      return (
        <img
          src={preview}
          alt="Preview"
          className="rounded-circle shadow-lg border border-5 border-white"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: "cover",
            transition: "all 0.4s ease",
          }}
        />
      );
    }

    if (user.profileImg) {
      return (
        <img
          src={`${API_BASE}${user.profileImg}`}
          alt={user.fullName}
          className="rounded-circle shadow-lg border border-5 border-white"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: "cover",
            transition: "all 0.4s ease",
          }}
        />
      );
    }

    const initial = user.fullName.charAt(0).toUpperCase();
    return (
      <div
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-lg"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          fontSize: `${size / 3.5}px`,
          border: "6px solid white",
        }}
      >
        {initial}
      </div>
    );
  };

  return (
    <section className="min-vh-100" style={{
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "40px 20px",
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">

            {/* Profile Card */}
            <div
              className="card border-0 shadow-lg overflow-hidden"
              style={{
                borderRadius: "28px",
                background: "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {/* Header Gradient */}
              <div
                className="position-relative text-center p-5"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  color: "white",
                }}
              >
                <div className="position-relative d-inline-block">
                  {renderProfileLogo(180)}
                  <div
                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "20px",
                      transform: "translate(30%, 30%)",
                      cursor: "pointer",
                    }}
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    <i className="fas fa-camera"></i>
                  </div>
                </div>

                <h2 className="mt-4 fw-bold">{user.fullName}</h2>
                <p className="opacity-90 mb-0">{user.email}</p>
              </div>

              {/* Body */}
              <div className="card-body p-5 text-center">

                {/* Upload Section */}
                <div className="mt-4">
                  <h4 className="fw-bold text-dark mb-4">Update Profile Photo</h4>

                  {/* Hidden File Input */}
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {/* Preview */}
                  {preview && (
                    <div className="mb-4">
                      <div className="d-inline-block position-relative">
                        {renderProfileLogo(120)}
                        <button
                          onClick={() => {
                            setPreview(null);
                            setFile(null);
                          }}
                          className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 shadow-lg"
                          style={{ transform: "translate(50%, -50%)" }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <button
                    onClick={handleUpload}
                    disabled={!file}
                    className="btn btn-lg rounded-pill px-5 shadow-lg fw-bold transition-all"
                    style={{
                      background: file ? "linear-gradient(135deg, #667eea, #764ba2)" : "#ccc",
                      color: "white",
                      padding: "14px 40px",
                      opacity: file ? 1 : 0.6,
                      cursor: file ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={(e) => file && (e.target.style.transform = "translateY(-3px)")}
                    onMouseLeave={(e) => file && (e.target.style.transform = "translateY(0)")}
                  >
                    <i className="fas fa-cloud-upload-alt me-2"></i>
                    Upload New Photo
                  </button>
                </div>

                {/* Message */}
                {message && (
                  <div
                    className={`mt-4 p-3 rounded-3 fw-medium ${
                      message.includes("success")
                        ? "bg-success text-white"
                        : "bg-danger text-white"
                    }`}
                    style={{
                      animation: "fadeIn 0.5s ease",
                    }}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-4">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                Your profile is secure and private
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;