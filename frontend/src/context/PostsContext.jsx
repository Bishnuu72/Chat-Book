import { createContext } from "react";

const PostsContext = createContext({
  feed: [],
  userPosts: {},
  loading: false,
  error: null,
  createPost: async () => {},
  fetchFeed: async () => {},
  fetchUserPosts: async () => {},
  deletePost: async () => {},
  clearError: () => {},
});

export default PostsContext;
