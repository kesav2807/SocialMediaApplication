import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://socialapp-backend-api.onrender.com/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const latest = notifications.find(n => !n.isRead);
    if (latest) {
      setPopup(latest);
      const timer = setTimeout(() => setPopup(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/notifications/all`);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/users/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification =>
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.type === 'follow' && notification.sender?._id) {
      navigate(`/profile/${notification.sender._id}`);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-white via-purple-50 to-white">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-white px-4 py-10 md:pl-72">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-purple-700">Notifications</h2>

        {/* Popup */}
        {popup && (
          <div className="fixed top-8 right-8 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            <strong>New:</strong> {popup.message}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center text-purple-500 mt-20">
            <p className="text-lg font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`flex items-start gap-4 p-4 rounded-xl shadow-md cursor-pointer transition-all duration-300 ${
                  notification.isRead
                    ? 'bg-white hover:bg-gray-100'
                    : 'bg-purple-50 border-l-4 border-purple-600 hover:bg-purple-100 animate-fade-in'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Avatar */}
                {notification.sender?.avatar ? (
                  <img
                    src={`https://socialapp-backend-api.onrender.com${notification.sender.avatar}`}
                    alt={notification.sender.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg font-bold">
                    {notification.sender?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}

                {/* Message */}
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatTime(notification.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
