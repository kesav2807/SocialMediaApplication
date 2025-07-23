import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Compass, Search } from 'lucide-react';
import PostCard from '../Posts/PostCard';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'https://socialapp-backend-api.onrender.com/api';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/explore`);
      setPosts(response.data.posts);
    } catch (err) {
      console.error('Error fetching explore posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostLiked = (postId, isLiked, likesCount) => {
    setPosts(posts.map(post =>
      post._id === postId
        ? { ...post, isLiked, likes: Array(likesCount).fill() }
        : post
    ));
  };

  const filteredPosts = posts.filter(post =>
    post.content?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-white md:pl-72 px-4 py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-purple-600 flex items-center gap-2">
          <Compass size={26} /> Explore
        </h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by post content..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-purple-600 mt-20"
          >
            <p className="text-xl font-semibold">No posts found</p>
            <p className="text-sm mt-1 text-gray-500">Try a different keyword or explore more creators.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPosts.map(post => (
              <motion.div
                key={post._id}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="transition-transform duration-300"
              >
                <PostCard post={post} onLike={handlePostLiked} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Explore;
