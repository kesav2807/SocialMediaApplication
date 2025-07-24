# 🚀 Social Media App with Real-time Chat (MERN Stack)

A full-featured, scalable **social media platform** with **real-time private and group chat**, built using **React.js**, **Node.js**, **Express**, **MongoDB**, and **Socket.io**.

---
## Run a Project 
    npm i 
- **Frontend**
-     npm run dev
- **Backend**
-     cd server
-     node index.js
---

## 🔗 Live Demo

https://socialmediaapplication-s66u.onrender.com/

---

## 📦 Tech Stack

- **Frontend**: React.js, Axios, Socket.io-client  
- **Backend**: Node.js, Express.js, Socket.io  
- **Database**: MongoDB + Mongoose  
- **Authentication**: JWT + Bcrypt  
- **Storage**: Cloudinary (for media upload)  
- **Real-Time**: WebSockets (Socket.IO)  

---

## 🔐 Features Overview

### ✅ 1. User Authentication & Profiles
- Register with email and password
- Login with JWT-based session
- Secure password encryption using **bcrypt**
- Profile: update avatar, name, and bio

---

### 📝 2. Posts (CRUD)
- Create text posts with optional image/video
- View own and others' posts
- Delete your posts
- Like/unlike any post

---

### 💬 3. Comments & Likes
- Comment on posts
- Like/unlike posts
- View like counts and users who liked

---

### 🤝 4. Follow System
- Follow/unfollow other users
- View follower and following counts
- Home feed displays posts only from followed users

---

### 🧭 5. Feed & Explore
- **Feed**: Personalized timeline from followed users
- **Explore**: Discover posts from public/random users

---

### 🔒 6. Privacy & Authorization
- Only content owners can edit or delete their posts/comments
- Protected routes using JWT middleware

---

## 💬 7. Chat System

### 📩 1-to-1 Real-time Chat
- Instant messaging with typing indicators
- Chat history with timestamps
- Message status: sent, delivered, seen
- Online/offline status tracking

### 👥 Group Chat
- Create, join, and leave groups
- Admin privileges: add/remove members, assign roles
- Group chat history & media support
- Mentions (`@username`) with notifications

---

## 🔔 8. Notifications
- In-app notifications for:
  - 💬 New messages (DM or group)
  - ❤️ Likes on your posts
  - 💬 New comments
  - 🙋‍♂️ Follows
  - 🔔 Mentions in chat

---

## 📁 Folder Structure

📦 root/
┣ 📁 client/ # React frontend
┃ ┣ 📁 src/
┃ ┗ 📄 package.json
┣ 📁 server/ # Node.js backend
┃ ┣ 📁 controllers/
┃ ┣ 📁 models/
┃ ┣ 📁 routes/
┃ ┣ 📄 server.js
┃ ┗ 📄 .env
┗ 📄 README.md

---



### 🚀 Backend Setup

backend 
cd server
npm install
npm run dev

Frondend 
npm run dev

---

### 🔐 Environment Variables (.env)
PORT=5000
MONGODB_URI=mongodb+srv://kesav2807:Raji2807@cluster0.4k1tgsi.mongodb.net/socialapp
JWT_SECRET=kesav2807@socialapp!2025

---

### 👨‍💻 Author
Keshav
🔗 GitHub: @kesav2807

