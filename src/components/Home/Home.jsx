import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import CreatePost from '../Posts/CreatePost';
import PostCard from '../Posts/PostCard';

const API_URL = import.meta.env.VITE_API_URL || 'https://socialapp-backend-api.onrender.com/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/feed`);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Feed load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => setPosts([newPost, ...posts]);
  const handlePostDeleted = (postId) =>
    setPosts(posts.filter((post) => post._id !== postId));
  const handlePostLiked = (postId, isLiked, likesCount) => {
    setPosts(posts.map((post) =>
      post._id === postId
        ? { ...post, isLiked, likes: Array(likesCount).fill() }
        : post
    ));
  };

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-gradient-to-br from-white via-purple-50 to-white">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="ml-64 min-h-screen bg-[#f7f9fa] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>
        {posts.length === 0 ? (
          <div className="bg-white border rounded-2xl py-16 text-center text-gray-600 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">No posts yet</h2>
            <p className="text-sm text-gray-500">
              Start following people or create your first post to see content here.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-all animate-fade-in"
            >
              <PostCard
                post={post}
                onDelete={handlePostDeleted}
                onLike={handlePostLiked}
              />
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default Home;
