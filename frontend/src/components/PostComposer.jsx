import React, { useContext, useState } from "react";
import PostsContext from "../context/PostsContext";
import FriendContext from "../context/FriendContext";

const PostComposer = ({ onPosted }) => {
  const { createPost, loading } = useContext(PostsContext);
  const { friends } = useContext(FriendContext);

  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [taggedIds, setTaggedIds] = useState([]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && (f.type.startsWith("image/") || f.type.startsWith("video/"))) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const toggleTag = (id) => {
    setTaggedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

const submit = async () => {
  if (!content.trim() && !file) {
    console.warn("PostComposer: nothing to post (empty content and no file)");
    return;
  }
  console.log("PostComposer: submitting post", { content, file, taggedIds });

  try {
    const post = await createPost({ content: content.trim(), file, taggedUserIds: taggedIds });
    console.log("PostComposer: createPost returned", post);

    if (post) {
      setContent("");
      setFile(null);
      setPreviewUrl(null);
      setTaggedIds([]);
      onPosted?.(post);
    } else {
      console.warn("PostComposer: no post returned from createPost");
      alert("Failed to post. Check console and server logs for details.");
    }
  } catch (err) {
    console.error("PostComposer: error while posting", err);
    alert("Unexpected error while posting.");
  }
};



  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <textarea
          className="form-control mb-3"
          rows={3}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="d-flex align-items-center gap-2 mb-3">
          <input type="file" onChange={onFileChange} />
          {previewUrl && file?.type.startsWith("image/") && (
            <img src={previewUrl} alt="Preview" style={{ width: 120, height: 120, objectFit: "cover" }} />
          )}
          {previewUrl && file?.type.startsWith("video/") && (
            <video src={previewUrl} controls style={{ width: 200 }} />
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Tag friends</label>
          <div className="d-flex flex-wrap gap-2">
            {Array.isArray(friends) && friends.length > 0 ? (
              friends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`btn btn-sm ${taggedIds.includes(f.id) ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => toggleTag(f.id)}
                >
                  {f.fullName}
                </button>
              ))
            ) : (
              <span className="text-muted">No friends to tag</span>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-primary" disabled={loading || (!content.trim() && !file)} onClick={submit}>
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;