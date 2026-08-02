# Mad Over Tiramisu - Backend API

This is the backend API for the Mad Over Tiramisu e-commerce platform with a CMS (Content Management System) for admins.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

## ✨ Features

- 🔐 **Admin Authentication** - Secure login with JWT tokens
- 🛍️ **Product Management** - Create, edit, delete products
- 📝 **Content Management** - Edit homepage content sections
- 📸 **Image Upload** - Upload images to Cloudinary
- 📧 **Email Notifications** - Send contact form emails to owner
- 📊 **Activity Logging** - Track all admin actions
- 🔄 **Password Reset** - Secure password reset with email tokens
- 👥 **Role-Based Access** - Super Admin and Editor roles

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Account** (free tier available) - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Cloudinary Account** (free tier available) - [Cloudinary](https://cloudinary.com/)

## 🚀 Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
MONGODB_URI=mongodb+srv://youruser:password@cluster.mongodb.net/mad-over-tiramisu
JWT_SECRET=your-secret-key-here
CLOUDINARY_CLOUD_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
OWNER_EMAIL=owner@tiramisu.com
FRONTEND_URL=http://localhost:5173
```

## 🔑 Getting Credentials

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free)
4. Go to Database → Connect → Copy connection string
5. Paste in `.env` as `MONGODB_URI`

### Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Go to Dashboard
4. Copy Cloud Name, API Key, and API Secret
5. Paste in `.env`

### Gmail App Password Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Create an App Password for "Mail"
4. Copy the password and paste in `.env` as `EMAIL_PASSWORD`

**Note**: Use the app password, NOT your actual Gmail password

## ▶️ Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on `http://localhost:5000`

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ Cloudinary Configured
✅ Application initialized in development mode

==================================================
✨ Server is running on port 5000
📍 URL: http://localhost:5000
🔗 API: http://localhost:5000/api
🏥 Health: http://localhost:5000/api/health
==================================================
```

### Production Mode

```bash
npm start
```

### Test the Server

Visit: `http://localhost:5000/api/health`

You should get a response like:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   └── cloudinary.js    # Cloudinary setup
│   │
│   ├── models/              # MongoDB schemas
│   │   ├── User.js          # Admin user
│   │   ├── Product.js       # Product
│   │   ├── Content.js       # Homepage sections
│   │   ├── ActivityLog.js   # Activity tracking
│   │   ├── ContactMessage.js
│   │   ├── PasswordResetToken.js
│   │   └── Owner.js         # Business owner info
│   │
│   ├── middleware/          # Express middleware
│   │   ├── authMiddleware.js    # JWT verification
│   │   └── errorMiddleware.js   # Error handling
│   │
│   ├── routes/              # API routes (to be created)
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── content.js
│   │   ├── activityLog.js
│   │   └── contact.js
│   │
│   ├── controllers/         # Route logic (to be created)
│   ├── services/            # Business logic (to be created)
│   ├── utils/               # Utility functions
│   │   ├── errorHandler.js  # Custom error class
│   │   ├── tokenUtils.js    # JWT utilities
│   │   └── validators.js    # Input validation
│   │
│   └── server.js            # Main entry point
│
├── package.json             # Dependencies
├── .env.example             # Example env variables
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🔌 API Documentation

### Health Check

```
GET /api/health

Response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T...",
  "environment": "development"
}
```

### Authentication Routes (To be implemented)

```
POST /api/auth/login              - Login with email/password
POST /api/auth/forgot-password    - Request password reset
POST /api/auth/reset-password     - Reset with token
POST /api/auth/change-password    - Change password (logged in)
GET  /api/auth/me                 - Get current user info
```

### Product Routes (To be implemented)

```
GET    /api/products              - Get all products
POST   /api/products              - Create product (admin)
PUT    /api/products/:id          - Update product (admin)
DELETE /api/products/:id          - Delete product (admin)
```

### Content Routes (To be implemented)

```
GET    /api/content/:section      - Get section content
PUT    /api/content/:section      - Update section (admin)
```

### Other Routes (To be implemented)

```
GET    /api/activity-log          - View activity log (admin)
GET    /api/contact-messages      - View contact messages (admin)
POST   /api/contact               - Submit contact form
POST   /api/upload                - Upload image to Cloudinary
```

## 🛡️ Security Notes

- **Never commit `.env` file** - It contains sensitive credentials
- **Use strong JWT_SECRET** - Generate with: https://randomkeygen.com/
- **Enable 2FA on Gmail** - Required for app passwords
- **Keep Cloudinary API Secret private** - Never expose in frontend
- **Use HTTPS in production** - Never expose credentials over HTTP

## 🐛 Troubleshooting

### MongoDB Connection Error

**Problem**: `MongooseError: Cannot connect to MongoDB`

**Solution**:
1. Check your `MONGODB_URI` is correct
2. Make sure IP whitelist includes your IP (MongoDB Atlas)
3. Verify database credentials

### Cloudinary Error

**Problem**: `Cloudinary configuration is incomplete`

**Solution**:
1. Check all three Cloudinary variables are in `.env`
2. Restart server: `npm run dev`

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE :::5000`

**Solution**:
1. Change PORT in `.env` to different number (e.g., 5001)
2. Or kill the process using that port

### Email Not Sending

**Problem**: Contact form emails not being sent

**Solution**:
1. Verify Gmail app password (not regular password)
2. Make sure 2FA is enabled on Gmail account
3. Check `OWNER_EMAIL` is correct

## 📚 Next Steps

1. **Implement Routes** - Create all API endpoints
2. **Setup Controllers** - Add business logic
3. **Create Services** - Email, file upload logic
4. **Test API** - Use Postman to test endpoints
5. **Connect Frontend** - Link React app to API
6. **Deploy** - Deploy to Railway.app or Render.com

## 📖 Learning Resources

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Tutorial](https://jwt.io/introduction)
- [REST API Best Practices](https://restfulapi.net/)

## 📝 License

MIT

## 👨‍💻 Support

For issues or questions, please check the main README or contact the development team.

---

**Last Updated**: January 2024
**Version**: 1.0.0
