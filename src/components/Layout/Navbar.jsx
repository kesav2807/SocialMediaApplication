import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Compass,
  MessageSquare,
  Bell,
  LogOut,
  UserCircle,
  Plus,
  Mic,
  MicOff,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
    if (audioRef.current) {
      audioEnabled ? audioRef.current.pause() : audioRef.current.play().catch(console.error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return setSearchResults([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/search/${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    handleSearch(val);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const navigateToProfile = (id) => {
    navigate(`/profile/${id}`);
    closeSearch();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearch && !e.target.closest('.search-box')) closeSearch();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-lg flex flex-col justify-between z-50">
        <div className="p-4 space-y-6">
          <Link to="/" className="text-2xl font-extrabold text-purple-600 mb-6 block">
            SocialApp
          </Link>

          <nav className="space-y-4">
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-purple-100'
              }`}
            >
              <Home size={18} /> Home
            </Link>

            <Link
              to="/explore"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/explore') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-purple-100'
              }`}
            >
              <Compass size={18} /> Explore
            </Link>

            <Link
              to="/chat"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/chat') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-purple-100'
              }`}
            >
              <MessageSquare size={18} /> Messages
            </Link>

            <Link
              to="/notifications"
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/notifications') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-purple-100'
              }`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 left-6 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
              Notifications
            </Link>

            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-100 transition-colors"
            >
              <Search size={18} /> Search
            </button>

            <Link
              to="/create"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-100 transition-colors"
            >
              <Plus size={18} /> Create a post
            </Link>
          </nav>

          {showSearch && (
            <div className="mt-4 relative search-box">
              <div className="flex items-center gap-2">
                <input
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <button onClick={closeSearch}>
                  <X size={18} />
                </button>
              </div>
              <div className="mt-2 max-h-60 overflow-y-auto bg-white shadow rounded-lg p-2 border">
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => navigateToProfile(u._id)}
                    className="flex items-center gap-3 p-2 hover:bg-purple-100 cursor-pointer rounded transition"
                  >
                    {u.avatar ? (
                      <img
                        src={`http://localhost:5000${u.avatar}`}
                        alt={u.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full">
                        {u.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{u.username}</p>
                      <p className="text-xs text-gray-500">{u.bio || 'No bio'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Audio</span>
            <button onClick={toggleAudio}>
              {audioEnabled ? <Mic className="text-purple-600" /> : <MicOff className="text-gray-400" />}
            </button>
          </div>

          <Link
            to={`/profile/${user?._id}`}
            className="flex items-center gap-3 hover:bg-purple-100 p-2 rounded-lg transition-colors"
          >
            {user?.avatar ? (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <UserCircle size={24} />
            )}
            <div>
              <p className="text-sm font-semibold">{user?.username}</p>
              <p className="text-xs text-gray-500">View profile</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 text-sm hover:underline"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <audio ref={audioRef} loop>
        <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav" />
      </audio>

      <div className="ml-64"></div>
    </>
  );
};

export default Navbar;
