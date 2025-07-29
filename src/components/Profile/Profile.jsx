import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../Posts/PostCard';
import { X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://socialapp-backend-api.onrender.com/api';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, updateProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '', isPrivate: false });
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const isOwn = !userId || userId === currentUser._id;

  useEffect(() => {
    async function fetchData() {
      const id = userId || currentUser._id;
      const [userRes, postsRes] = await Promise.all([
        axios.get(`${API_URL}/users/${id}`),
        axios.get(`${API_URL}/posts/user/${id}`),
      ]);
      setProfile(userRes.data.user);
      setPosts(postsRes.data.posts);
      setForm({
        username: userRes.data.user.username,
        bio: userRes.data.user.bio || '',
        isPrivate: userRes.data.user.isPrivate,
      });
    }
    fetchData();
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

  if (!profile) {
    return (
      <div className="ml-64 flex justify-center items-center h-screen text-purple-600 font-semibold">
        Loading...
      </div>
    );
  }

  const canViewPosts =
    isOwn || !profile.isPrivate || profile.followers.some((f) => f._id === currentUser._id);

  return (
    <div className="ml-64 min-h-screen bg-white">
     
      <div className="relative h-44 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md rounded-b-2xl">
        <div className="absolute -bottom-16 left-12">
          {profile.avatar ? (
            <img
              src={`https://socialapp-backend-api.onrender.com${profile.avatar}`}
              className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md"
              alt="avatar"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white flex justify-center items-center text-4xl font-bold text-purple-700 shadow-md">
              {profile.username[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>


      <div className="max-w-5xl mx-auto mt-20 px-6 flex justify-between items-start md:flex-row flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-800">{profile.username}</h2>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                profile.isPrivate ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'
              }`}
            >
              {profile.isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
          <p className="mt-2 text-gray-700">{profile.bio}</p>
          <div className="mt-4 flex gap-6 text-sm text-gray-600">
            <span>{posts.length} posts</span>
            <span
              className="hover:text-purple-600 cursor-pointer"
              onClick={() => setShowFollowers(true)}
            >
              {profile.followers.length} followers
            </span>
            <span
              className="hover:text-purple-600 cursor-pointer"
              onClick={() => setShowFollowing(true)}
            >
              {profile.following.length} following
            </span>
          </div>
        </div>
        {!editing && (
          <button
            onClick={isOwn ? () => setEditing(true) : handleFollow}
            className={`rounded-full px-6 py-2 text-white font-medium shadow-md transition ${
              isOwn
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : profile.followers.some((f) => f._id === currentUser._id)
                ? 'bg-gray-400 hover:bg-gray-500'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isOwn
              ? 'Edit Profile'
              : profile.followers.some((f) => f._id === currentUser._id)
              ? 'Unfollow'
              : 'Follow'}
          </button>
        )}
      </div>

   
      {editing && (
        <div className="max-w-5xl mx-auto mt-6 bg-white p-6 rounded-xl shadow-md">
          <form onSubmit={handleSave} className="space-y-4">
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              className="w-full p-3 border rounded-lg"
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Bio"
              className="w-full p-3 border rounded-lg"
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              />
              <label className="text-gray-700">Private Account</label>
            </div>
            <input type="file" id="avatar-upload" />
            <div className="flex gap-3 mt-3">
              <button className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700">
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-300 px-5 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    
      <div className="max-w-5xl mx-auto mt-8 border-b flex gap-6 px-6 sticky top-20 bg-white z-10">
        {['posts', 'about', 'connections'].map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`uppercase text-sm font-semibold pb-2 transition ${
              tab === tabName
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

    
      <div className="max-w-5xl mx-auto mt-6 px-6 pb-16">
        {tab === 'about' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-2 text-gray-800">About</h3>
            <p className="text-gray-700">{profile.bio}</p>
            <p className="mt-2 text-sm text-gray-500">
              Account: {profile.isPrivate ? 'Private' : 'Public'}
            </p>
          </div>
        )}

        {tab === 'posts' &&
          (canViewPosts ? (
            posts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 mt-8">No posts yet.</p>
            )
          ) : (
            <div className="text-center mt-8 text-gray-500">
              This account is private. Follow to view posts.
            </div>
          ))}

        {tab === 'connections' && (
          <div className="bg-white p-6 rounded-xl shadow-md text-gray-600">
            <p>Connections module coming soon...</p>
          </div>
        )}
      </div>

     
      {showFollowers && (
        <Modal title="Followers" onClose={() => setShowFollowers(false)} list={profile.followers} />
      )}
      {showFollowing && (
        <Modal title="Following" onClose={() => setShowFollowing(false)} list={profile.following} />
      )}
    </div>
  );
}


function Modal({ title, onClose, list }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative shadow-lg">
        <button className="absolute top-3 right-3 text-gray-600 hover:text-red-500" onClick={onClose}>
          <X />
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-800">{title}</h2>
        <ul className="space-y-3 max-h-[300px] overflow-y-auto">
          {list.map((user) => (
            <li key={user._id}>
              <Link
                to={`/profile/${user._id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition"
              >
                {user.avatar ? (
                  <img
                    src={`https://socialapp-backend-api.onrender.com${user.avatar}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white text-sm">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                <span className="text-gray-800 font-medium">{user.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
