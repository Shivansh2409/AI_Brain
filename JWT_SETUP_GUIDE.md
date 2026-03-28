# JWT Authentication Setup - Complete Implementation Guide

## ✅ What Was Implemented

### 1. **Custom JWT Authentication System** (Replaced Google Sign-In)

- ✅ User registration with email/password
- ✅ User login with credentials
- ✅ Password hashing with bcryptjs
- ✅ JWT token generation (30-day expiration)
- ✅ JWT verification on protected routes

### 2. **Frontend Changes**

- ✅ Created `/app/auth/login/page.tsx` - Login page
- ✅ Created `/app/auth/register/page.tsx` - Registration page
- ✅ Updated dashboard (`/app/page.tsx`):
  - JWT check on mount (redirects to login if not authenticated)
  - User info display (name, email)
  - Logout button
  - JWT token sent with all API requests

### 3. **Backend Changes**

- ✅ Updated User model: uses email/password instead of googleId
- ✅ New auth endpoints:
  - `POST /api/auth/register` - Create new account
  - `POST /api/auth/login` - Login user
- ✅ Added password hashing/comparison with bcryptjs
- ✅ Protected routes with JWT middleware:
  - `/api/save` - Protected ✅
  - `/api/upload` - Protected ✅
  - `/api/feed` - Protected ✅
  - `/api/search` - Protected ✅

### 4. **Extension Changes**

- ✅ Removed all Google Sign-In code
- ✅ Removed OAuth2 from manifest
- ✅ Created content script to sync JWT from frontend to extension
- ✅ Created background script for token management
- ✅ Extension now checks for JWT before allowing saves
- ✅ Shows warning message if user not logged in

---

## 🚀 Setup Instructions

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install bcryptjs
npm install
```

### Step 2: Update Environment Variables

Ensure your `.env` file has:

```
GOOGLE_CLIENT_ID=<can be removed now>
JWT_SECRET=your_secret_key_here
PORT=3000
MONGODB_URI=your_mongo_uri
```

### Step 3: Start Backend Server

```bash
npm run dev
```

### Step 4: Start Frontend

```bash
cd brain-frontend
npm run dev
```

Frontend runs on: `http://localhost:3001`

### Step 5: Load Extension in Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `brain-extension` folder

---

## 📱 User Flow

### Registration & Login

1. User visits dashboard: `http://localhost:3001`
2. No JWT found → Redirected to `/auth/login`
3. User clicks "Sign up here" → Goes to `/auth/register`
4. User fills in name, email, password → Account created
5. JWT token generated and saved to `localStorage`
6. User redirected to dashboard

### Using Extension

1. User logs in on dashboard
2. JWT token automatically synced to extension via content script
3. User opens extension popup
4. Extension can now save pages with JWT authentication
5. If not logged in, extension shows warning

### Logout

1. User clicks logout button on dashboard
2. JWT removed from localStorage
3. Extension detects change and clears its stored JWT
4. User redirected to login page

---

## 🔐 Security Features

- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ JWT tokens verified on every protected request
- ✅ 30-day token expiration
- ✅ All sensitive endpoints protected with `requireAuth` middleware
- ✅ No passwords stored in plain text
- ✅ No Google OAuth dependencies

---

## 📂 Files Modified/Created

### Backend

- ✅ `src/models/user.js` - Updated with password hashing
- ✅ `src/controllers/auth.controller.js` - New register/login endpoints
- ✅ `src/routes/auth.routes.js` - New auth routes
- ✅ `src/routes/save.routes.js` - Added JWT protection
- ✅ `src/routes/upload.routes.js` - Added JWT protection
- ✅ `src/routes/feed.routes.js` - Added JWT protection
- ✅ `src/routes/search.routes.js` - Added JWT protection
- ✅ `package.json` - Added bcryptjs dependency

### Frontend

- ✅ `app/auth/login/page.tsx` - NEW
- ✅ `app/auth/register/page.tsx` - NEW
- ✅ `app/page.tsx` - Updated with JWT check & logout

### Extension

- ✅ `manifest.json` - Cleaned up, removed Google OAuth
- ✅ `popup.js` - Replaced Google Sign-In with JWT
- ✅ `background.js` - NEW: Token management
- ✅ `content.js` - NEW: Frontend-to-extension sync

---

## 🧪 Testing

### Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Test Protected Route

```bash
curl -X GET http://localhost:3000/api/feed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⚠️ Common Issues & Solutions

| Issue                          | Solution                                            |
| ------------------------------ | --------------------------------------------------- |
| "Unauthorized" error           | User not logged in - JWT token missing              |
| Extension says "Not logged in" | Reload extension after logging in on dashboard      |
| Login fails                    | Check MongoDB connection, ensure env vars are set   |
| Extension can't sync JWT       | Ensure content script is allowed for localhost:3001 |

---

## 🎯 Next Steps

1. Test the full flow:
   - Create account
   - Login
   - Save items from extension
   - Logout

2. Customize as needed:
   - Add email verification
   - Add password reset
   - Add email notifications
   - Add role-based access control

3. Deploy when ready:
   - Update API endpoints for production
   - Use HTTPS
   - Set secure JWT_SECRET in production env

---

**✅ JWT Authentication System Ready!**
