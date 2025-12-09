import React from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const LinkifiedText = ({ text }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="mb-2">
      {parts.map((part, idx) =>
        urlRegex.test(part) ? (
          <a key={idx} href={part} target="_blank" rel="noreferrer">
            {part}
          </a>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </p>
  );
};

const Avatar = ({ fullName, profileImg, size = 40 }) => {
  if (profileImg) {
    return (
      <img
        src={`${API_BASE}${profileImg}`}
        alt={fullName}
        className="rounded-circle"
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }
  const initial = (fullName || "?").charAt(0).toUpperCase();
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white"
      style={{ width: size, height: size, fontWeight: "bold", fontSize: size / 2 }}
    >
      {initial}
    </div>
  );
};

const PostItem = ({ post, onDelete }) => {
  const { id, authorName, authorImg, content, mediaUrl, mediaType, createdAt, tags } = post;

  return (
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Avatar fullName={authorName} profileImg={authorImg} />
          <div>
            <div className="fw-semibold">{authorName}</div>
            <div className="text-muted small">{new Date(createdAt).toLocaleString()}</div>
          </div>
          <div className="ms-auto">
            {onDelete && (
              <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(id)}>
                Delete
              </button>
            )}
          </div>
        </div>

        <LinkifiedText text={content} />

        {mediaUrl && mediaType === "image" && (
          <img src={`${API_BASE}${mediaUrl}`} alt="post" className="rounded" style={{ maxWidth: "100%", height: "auto" }} />
        )}
        {mediaUrl && mediaType === "video" && (
          <video src={`${API_BASE}${mediaUrl}`} controls className="rounded" style={{ maxWidth: "100%" }} />
        )}
        {mediaUrl && mediaType === "file" && (
          <a href={`${API_BASE}${mediaUrl}`} target="_blank" rel="noreferrer" className="btn btn-outline-secondary mt-2">
            Download attachment
          </a>
        )}

        {Array.isArray(tags) && tags.length > 0 && (
          <div className="mt-3">
            <span className="text-muted small me-2">With:</span>
            {tags.map((t) => (
              <span key={t.id} className="badge bg-light text-dark me-2">
                {t.fullName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostItem;
