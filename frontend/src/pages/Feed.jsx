import React, { useContext, useEffect } from "react";
import PostsContext from "../context/PostsContext";
import PostComposer from "../components/PostComposer";
import PostItem from "../components/PostItem";

const Feed = () => {
  const { feed, fetchFeed, deletePost } = useContext(PostsContext);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="container py-4">
      <PostComposer onPosted={() => fetchFeed()} />
      {Array.isArray(feed) && feed.length > 0 ? (
        feed.map((post) => <PostItem key={post.id} post={post} onDelete={deletePost} />)
      ) : (
        <p className="text-muted">No posts yet. Be the first to share something!</p>
      )}
    </div>
  );
};

export default Feed;
