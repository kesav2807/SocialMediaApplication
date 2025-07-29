import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Image, Video, Smile, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://socialapp-backend-api.onrender.com/api';
const MAX_CHAR = 280;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [previewURLs, setPreviewURLs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef(null);
  const emojiRef = useRef(null);
  const { user } = useAuth();

 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && media.length === 0) return;
    if (content.length > MAX_CHAR) {
      toast.error(`Post cannot exceed ${MAX_CHAR} characters.`);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      media.forEach((file) => formData.append('media', file));

      const res = await axios.post(`${API_URL}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onPostCreated(res.data.post);
      setContent('');
      setMedia([]);
      setPreviewURLs([]);
      setShowEmojiPicker(false);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error posting:', error);
      toast.error('Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);
    if (validFiles.length < files.length) {
      toast.warning('Some files were too large and skipped (max 10MB).');
    }

    const previews = validFiles.map(file => URL.createObjectURL(file));
    setMedia(validFiles);
    setPreviewURLs(previews);
  };

  const removeMedia = (index) => {
    const updated = [...media];
    const updatedPreviews = [...previewURLs];
    updated.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setMedia(updated);
    setPreviewURLs(updatedPreviews);
  };

  const isVideo = (file) => file.type && file.type.startsWith('video');

  const handleEmojiSelect = (emoji) => {
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = content.slice(0, cursorPos);
    const textAfter = content.slice(cursorPos);
    const newText = textBefore + emoji.native + textAfter;

    setContent(newText);
    setTimeout(() => {
      textareaRef.current.selectionStart = cursorPos + emoji.native.length;
      textareaRef.current.selectionEnd = cursorPos + emoji.native.length;
      textareaRef.current.focus();
    }, 0);

    setShowEmojiPicker(false); 
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl p-5 border shadow-sm relative"
    >
      <form onSubmit={handleSubmit}>
       
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-base font-bold text-purple-700">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            disabled={loading}
            className="w-full p-3 text-sm bg-gray-50 rounded-xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

      
        {showEmojiPicker && (
          <div ref={emojiRef} className="absolute z-50 top-28 left-16 sm:left-24 shadow-lg bg-white rounded">
            <div className="flex justify-end p-2">
              <button onClick={() => setShowEmojiPicker(false)} className="text-gray-500 hover:text-red-500">
                <X size={18} />
              </button>
            </div>
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
          </div>
        )}

   
        {previewURLs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {previewURLs.map((url, index) => (
              <div key={index} className="relative rounded overflow-hidden shadow-md">
                {isVideo(media[index]) ? (
                  <video src={url} className="w-full h-28 object-cover rounded" controls />
                ) : (
                  <img src={url} alt={`Preview ${index}`} className="w-full h-28 object-cover rounded" />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-90"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

   
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-sm text-gray-600">
            <label htmlFor="media-upload" className="flex items-center gap-1 cursor-pointer hover:text-purple-600">
              <Image size={16} /> Photo
            </label>
            <label htmlFor="media-upload" className="flex items-center gap-1 cursor-pointer hover:text-purple-600">
              <Video size={16} /> Video
            </label>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-purple-600"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              <Smile size={16} /> Emoji
            </button>
            <input
              id="media-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="hidden"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs ${content.length > MAX_CHAR ? 'text-red-500' : 'text-gray-400'}`}>
              {content.length}/{MAX_CHAR}
            </span>
            <button
              type="submit"
              disabled={loading || (!content.trim() && media.length === 0) || content.length > MAX_CHAR}
              className={`px-5 py-2 text-sm rounded-md font-semibold text-white transition ${
                loading || (!content.trim() && media.length === 0) || content.length > MAX_CHAR
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Posting...
                </span>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default CreatePost;
