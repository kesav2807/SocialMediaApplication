import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../Posts/PostCard';
import { Grid3x3, Users, Info, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://socialapp-backend-api.onrender.com/api';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, updateProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '', isPrivate: false });
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState('followers');

  const isOwn = !userId || userId === currentUser._id;

  useEffect(() => {
    async function loadData() {
      const id = userId || currentUser._id;
      const [u, p] = await Promise.all([
        axios.get(`${API_URL}/users/${id}`),
        axios.get(`${API_URL}/posts/user/${id}`),
      ]);
      setProfile(u.data.user);
      setPosts(p.data.posts);
      setForm({
        username: u.data.user.username,
        bio: u.data.user.bio || '',
        isPrivate: u.data.user.isPrivate,
      });
    }
    loadData();
  }, [userId, currentUser._id]);

  const handleFollow = async () => {
    await axios.post(`${API_URL}/users/${profile._id}/follow`);
    const { data } = await axios.get(`${API_URL}/users/${profile._id}`);
    setProfile(data.user);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    const avatar = document.getElementById('avatar-upload')?.files[0];
    if (avatar) fd.append('avatar', avatar);
    const res = await updateProfile(fd);
    if (res.success) {
      setEditing(false);
      const { data } = await axios.get(`${API_URL}/users/${profile._id}`);
      setProfile(data.user);
    }
  };

  const canViewPosts =
    isOwn || !profile.isPrivate || profile.followers?.some((f) => f._id === currentUser._id);

  if (!profile) {
    return <div className="flex justify-center items-center h-screen text-purple-500 font-semibold">Loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pt-6 pb-12 px-4 text-gray-800 font-sans">
      {/* Profile Header */}
      <div className="bg-white/30 backdrop-blur-md p-6 rounded-3xl border border-purple-200 shadow-lg flex flex-col md:flex-row gap-10 items-center">
        {profile.avatar ? (
          <img
            src={`${API_URL.replace('/api', '')}${profile.avatar}`}
            alt="avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-purple-300 shadow-md"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-3xl font-bold border-4 border-purple-200 shadow">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center md:text-left flex-1 space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <h2 className="text-2xl font-semibold">{profile.username}</h2>
            {isOwn ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-1 text-sm rounded-full text-purple-600 border border-purple-500 hover:bg-purple-100 transition"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`text-sm px-4 py-1 rounded-full transition font-medium ${
                  profile.followers.some((f) => f._id === currentUser._id)
                    ? 'bg-gray-200 text-gray-800 border'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                {profile.followers.some((f) => f._id === currentUser._id) ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
          <div className="flex justify-center md:justify-start gap-6 text-sm text-purple-600 font-medium">
            <span>{posts.length} posts</span>
            <span
              onClick={() => {
                setListType('followers');
                setShowListModal(true);
              }}
              className="cursor-pointer hover:underline"
            >
              {profile.followers.length} followers
            </span>
            <span
              onClick={() => {
                setListType('following');
                setShowListModal(true);
              }}
              className="cursor-pointer hover:underline"
            >
              {profile.following.length} following
            </span>
          </div>
          <div className="text-sm text-gray-600 whitespace-pre-wrap">
            {profile.bio}
            <div className="text-xs mt-1 text-purple-500">
              {profile.isPrivate ? '🔒 Private' : '🌐 Public'}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="mt-6 bg-white/40 backdrop-blur p-6 rounded-2xl border border-purple-300 shadow">
          <form onSubmit={handleSave} className="space-y-4">
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400"
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Bio"
              rows="3"
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              />
              <label>Private Account</label>
            </div>
            <input type="file" id="avatar-upload" className="text-sm" />
            <div className="flex gap-3">
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                Save
              </button>
              <button onClick={() => setEditing(false)} type="button" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex justify-center gap-8">
        {[
          { name: 'posts', icon: <Grid3x3 className="w-4 h-4" /> },
          { name: 'about', icon: <Info className="w-4 h-4" /> },
          { name: 'connections', icon: <Users className="w-4 h-4" /> },
        ].map(({ name, icon }) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition ${
              tab === name
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            {icon} {name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tab === 'about' && (
          <div className="bg-white/40 backdrop-blur p-4 rounded-xl shadow text-sm">
            <p>{profile.bio}</p>
            <p className="mt-2 text-purple-500">Account: {profile.isPrivate ? 'Private' : 'Public'}</p>
          </div>
        )}
        {tab === 'posts' && (
          canViewPosts ? (
            posts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 bg-white/30 backdrop-blur-md p-4 rounded-2xl shadow">
                {posts.map((p) => (
                  <PostCard
                    key={p._id}
                    post={p}
                    onDelete={(postId) => setPosts((prev) => prev.filter((post) => post._id !== postId))}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-purple-400 mt-4">No posts yet.</p>
            )
          ) : (
            <div className="text-center mt-4 text-purple-400">This account is private. Follow to see posts.</div>
          )
        )}
        {tab === 'connections' && (
          <div className="text-purple-400 text-center mt-4">Connections module coming soon…</div>
        )}
      </div>

      {/* Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">
            <button
              onClick={() => setShowListModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X />
            </button>
            <h2 className="text-lg font-semibold mb-4 capitalize text-purple-600">{listType}</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(listType === 'followers' ? profile.followers : profile.following).map((user) => (
                <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded cursor-pointer">
                  {user.avatar ? (
                    <img
                      src={`${API_URL.replace('/api', '')}${user.avatar}`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-800">{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
