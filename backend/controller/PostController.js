const PostSql = require("../model/PostSql");
const path = require("path");

const classifyMediaType = (file) => {
  if (!file) return { mediaUrl: null, mediaType: "none" };
  const ext = (file.mimetype || "").toLowerCase();
  if (ext.startsWith("image/")) return { mediaUrl: `/uploads/posts/${file.filename}`, mediaType: "image" };
  if (ext.startsWith("video/")) return { mediaUrl: `/uploads/posts/${file.filename}`, mediaType: "video" };
  // pdf or other
  return { mediaUrl: `/uploads/posts/${file.filename}`, mediaType: "file" };
};

// controller/PostController.js
exports.createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error("createPost: missing req.user");
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const userId = req.user.id;
    const { content, taggedUserIds } = req.body;
    const file = req.file;

    console.log("createPost: received", { userId, hasFile: !!file, contentLen: (content || "").length });

    const { mediaUrl, mediaType } = classifyMediaType(file);

    let tags = [];
    if (taggedUserIds) {
      if (Array.isArray(taggedUserIds)) tags = taggedUserIds.map(Number).filter(Boolean);
      else {
        try { tags = JSON.parse(taggedUserIds).map(Number).filter(Boolean); } catch (e) {
          console.warn("createPost: failed to parse taggedUserIds", taggedUserIds);
        }
      }
    }

    const postId = await PostSql.insertPost({
      userId,
      content: content && content.trim() ? content.trim() : null,
      mediaUrl,
      mediaType,
    });
    console.log("createPost: inserted postId", postId);

    if (tags.length > 0) {
      await PostSql.insertTags(postId, tags);
    }

    const post = await PostSql.getPostById(postId);
    if (!post) {
      console.error("createPost: getPostById returned null for", postId);
      return res.status(500).json({ success: false, error: "Post not found after insert" });
    }

    console.log("createPost: final post payload ok");
    return res.json({ success: true, post });
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};




exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const feed = await PostSql.getFeed(userId);
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const viewerId = req.user.id;
    const userId = Number(req.params.userId);
    const posts = await PostSql.getUserPosts(userId);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postId);
    const post = await PostSql.getPostById(postId);
    if (!post || post.userId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await PostSql.deletePost(postId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
