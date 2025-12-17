const pool = require("../DB/db");

exports.insertPost = async ({ userId, content, mediaUrl, mediaType }) => {
  const [res] = await pool.execute(
    `INSERT INTO posts (userId, content, mediaUrl, mediaType, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [userId, content, mediaUrl, mediaType]
  );
  if (!res || !res.insertId) {
    throw new Error("Insert failed: no insertId");
  }
  return res.insertId;
};

exports.getPostById = async (postId) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.userId, u.fullName AS authorName, u.profileImg AS authorImg,
            p.content, p.mediaUrl, p.mediaType, p.createdAt
     FROM posts p
     JOIN users u ON u.id = p.userId
     WHERE p.id = ?`,
    [postId]
  );
  const post = rows[0];
  if (!post) return null;
  const [tags] = await pool.execute(
    `SELECT pt.taggedUserId AS id, u.fullName, u.profileImg
     FROM post_tags pt
     JOIN users u ON u.id = pt.taggedUserId
     WHERE pt.postId = ?`,
    [postId]
  );
  post.tags = tags || [];
  return post;
};


// Insert tags
exports.insertTags = async (postId, taggedIds) => {
  if (!Array.isArray(taggedIds) || taggedIds.length === 0) return;
  const values = taggedIds.map((id) => `(${postId}, ${id})`).join(",");
  await pool.query(`INSERT INTO post_tags (postId, taggedUserId) VALUES ${values}`);
};

// Get single post (with author and tags)
exports.getPostById = async (postId) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.userId, u.fullName AS authorName, u.profileImg AS authorImg,
            p.content, p.mediaUrl, p.mediaType, p.createdAt
     FROM posts p
     JOIN users u ON u.id = p.userId
     WHERE p.id = ?`,
    [postId]
  );
  const post = rows[0];
  if (!post) return null;
  const [tags] = await pool.execute(
    `SELECT pt.taggedUserId AS id, u.fullName, u.profileImg
     FROM post_tags pt
     JOIN users u ON u.id = pt.taggedUserId
     WHERE pt.postId = ?`,
    [postId]
  );
  post.tags = tags;
  return post;
};

// Get feed: own posts + friends’ posts, newest first
exports.getFeed = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.userId,
            u.fullName AS authorName, u.profileImg AS authorImg,
            p.content, p.mediaUrl, p.mediaType, p.createdAt
     FROM posts p
     JOIN users u ON u.id = p.userId
     WHERE p.userId = ?
        OR p.userId IN (
          SELECT CASE
                   WHEN f.requesterId = ? THEN f.receiverId
                   WHEN f.receiverId = ? THEN f.requesterId
                 END AS friendId
          FROM friends f
          WHERE f.status = 'accepted'
        )
     ORDER BY p.createdAt DESC`,
    [userId, userId, userId]
  );

  // attach tags for each post
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const [tagRows] = await pool.query(
    `SELECT pt.postId, pt.taggedUserId AS id, u.fullName, u.profileImg
     FROM post_tags pt
     JOIN users u ON u.id = pt.taggedUserId
     WHERE pt.postId IN (${ids.join(",")})`
  );

  const tagsByPost = {};
  tagRows.forEach((t) => {
    tagsByPost[t.postId] = tagsByPost[t.postId] || [];
    tagsByPost[t.postId].push({ id: t.id, fullName: t.fullName, profileImg: t.profileImg });
  });

  return rows.map((r) => ({ ...r, tags: tagsByPost[r.id] || [] }));
};

// Get posts by specific user
exports.getUserPosts = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.userId, u.fullName AS authorName, u.profileImg AS authorImg,
            p.content, p.mediaUrl, p.mediaType, p.createdAt
     FROM posts p
     JOIN users u ON u.id = p.userId
     WHERE p.userId = ?
     ORDER BY p.createdAt DESC`,
    [userId]
  );
  // attach tags
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];
  const [tagRows] = await pool.query(
    `SELECT pt.postId, pt.taggedUserId AS id, u.fullName, u.profileImg
     FROM post_tags pt
     JOIN users u ON u.id = pt.taggedUserId
     WHERE pt.postId IN (${ids.join(",")})`
  );
  const tagsByPost = {};
  tagRows.forEach((t) => {
    tagsByPost[t.postId] = tagsByPost[t.postId] || [];
    tagsByPost[t.postId].push({ id: t.id, fullName: t.fullName, profileImg: t.profileImg });
  });
  return rows.map((r) => ({ ...r, tags: tagsByPost[r.id] || [] }));
};

exports.deletePost = async (postId) => {
  await pool.execute(`DELETE FROM posts WHERE id = ?`, [postId]);
};
