# Time Publishers Private Limited - Complete Website

A comprehensive web hosting and domain registration platform built with React, Node.js, PostgreSQL, and Firebase.

## 🚀 Features

- **Domain Registration & Management**
- **Web Hosting Services**
- **User Authentication** (Email/Password, Google, Microsoft OAuth)
- **Admin Panel** with full CRUD operations
- **Client Dashboard** with service management
- **Contact Form** with email notifications
- **Complaint/Support System**
- **AI Chat Assistant**

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, PostgreSQL
- **Authentication**: Firebase Auth
- **Email**: Nodemailer
- **Database**: PostgreSQL with proper migrations

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Firebase project
- SMTP email service (Gmail recommended)

## 🔧 Setup Instructions

### **CRITICAL: Firebase Authentication Setup**

**Before the app will work, you MUST configure Firebase Authentication:**

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project** (or create a new one)
3. **Enable Authentication Methods**:
   - Go to **Authentication** → **Sign-in method**
   - **Enable Email/Password**: Click on "Email/Password" and toggle it ON
   - **Enable Google**: Click on "Google" and toggle it ON (add your project's OAuth consent screen)
   - **Enable Microsoft**: Click on "Microsoft" and toggle it ON (requires Microsoft Azure app setup)

4. **Add Authorized Domains**:
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add these domains:
     - `localhost`
     - `127.0.0.1`
     - Your production domain when you deploy

5. **Get Firebase Configuration**:
   - Go to **Project Settings** → **General** → **Your apps**
   - Click "Add app" → Web app
   - Copy the configuration object

**Without these steps, you'll get these errors:**
- `auth/operation-not-allowed` - Authentication method not enabled
- `auth/unauthorized-domain` - Domain not authorized

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb time_publishers

# Run database migrations
cd server
node scripts/migrate.js
cd ..
```

### 3. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Enable Authentication with:
   - Email/Password
   - Google OAuth
   - Microsoft OAuth
4. Get your Firebase configuration from Project Settings > General > Your apps
5. Download Firebase Admin SDK service account key

### 4. Environment Variables

Create `.env` file in the root directory:

```env
# Firebase Configuration - GET THESE FROM YOUR FIREBASE PROJECT
VITE_FIREBASE_API_KEY=your_actual_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_URL=http://localhost:3001/api
```

Create `server/.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/time_publishers
DB_HOST=localhost
DB_PORT=5432
DB_NAME=time_publishers
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=websol@timepublishers.com
FROM_NAME=Time Publishers Private Limited

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

```

### 5. How to Get Firebase Configuration

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project** (or create a new one)
3. **Click the gear icon** → Project settings
4. **Scroll down to "Your apps"** section
5. **Click on the web app** (</> icon) or create one if none exists
6. **Copy the configuration values**:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

### 6. Firebase Admin SDK Setup

1. **Go to Project Settings** → Service accounts
2. **Click "Generate new private key"**
3. **Download the JSON file**
4. **Extract values** from the JSON and add to `server/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`

### 7. Enable OAuth Providers

1. **Go to Authentication** → Sign-in method
2. **Enable Google**: Add your OAuth client credentials
3. **Enable Microsoft**: Add your Azure app credentials

## 🚀 Running the Application

```bash
# Start the backend server (in one terminal)
cd server
npm run dev

# Start the frontend (in another terminal)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 👤 Admin Access

The first user who registers with `websol@timepublishers.com` will automatically become an admin and can access the admin panel at `/admin`.

## 📧 Email Configuration

For Gmail SMTP:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

## 🔒 Security Features

- Firebase Authentication with email verification
- JWT token validation
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection protection
- XSS protection

## 📱 Features Overview

### For Clients:
- Register and manage domains
- Purchase and manage hosting services
- View billing and renewal dates
- Submit support tickets
- Chat with AI assistant
- Update profile information

### For Admins:
- Manage all services and pricing
- View and manage all users
- Handle contact inquiries
- Manage support tickets
- View business statistics
- Full CRUD operations on all data

## 🤝 Support

For technical support, contact: websol@timepublishers.com

## 📄 License

© 2024 Time Publishers Private Limited. All rights reserved.