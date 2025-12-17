import React from "react";

export default function Main() {
  return (
    <div className="main-page d-flex flex-column align-items-center text-center px-3 pt-5">
      {/* MAIN TEXT */}
      <h1 className="fw-bold display-4 mt-0">🌐 Your Chat-Book for</h1>
      <h1 className="fw-bold display-4 mt-0 glow-text">communication</h1>

      <p className="mt-0 fs-5" style={{ maxWidth: "600px", margin: "0 auto" }}>
        Connect with like-minded people across the globe.  
        Chat freely with friends.  
        Share ideas and moments instantly.
      </p>

      <button className="btn mt-4 px-4 py-2 fw-semibold glow-button">
       Explore Friends
      </button>

      {/* ICON STICKERS SECTION */}
      <div className="icon-section w-100" style={{ maxWidth: "1200px" }}>
        {/* TOP ICONS */}
        <div className="d-flex justify-content-between w-100 px-5 mt-4">
          <div className="icon-box">👥</div>
          <div className="icon-box">💬</div>
        </div>

        {/* CENTER ICON */}
        <div className="d-flex justify-content-center">
          <div className="icon-box" style={{ fontSize: "5rem" }}>🌐</div>
        </div>

        {/* BOTTOM ICONS */}
        <div className="d-flex justify-content-between w-100 px-5">
          <div className="icon-box">🛰️</div>
          <div className="icon-box">📡</div>
        </div>
      </div>
    </div>
  );
}
