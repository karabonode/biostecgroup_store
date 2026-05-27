# Firebase Setup Instructions

## Project Details
- **Project Name:** BiostecGroup
- **Project ID:** `biostecgroup`
- **Project Number:** `187724885076`

## 1. Enable Authentication Methods

You MUST enable the following sign-in methods in Firebase Console:

### For Admin Login (Email/Password):
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **BiostecGroup** (biostecgroup)
3. Go to **Build** → **Authentication** → **Sign-in method**
4. Click **Email/Password**
5. Toggle **Enable** to ON
6. Click **Save**

### For Regular Users (Google Sign-In):
1. In the same **Sign-in method** page
2. Click **Google**
3. Toggle **Enable** to ON
4. Set a **Support email** (your email)
5. Click **Save**

## 2. Enable Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** or **Start in test mode**
4. Select your location (e.g., `eur3` for Europe)
5. Click **Enable**

## 3. Admin Login Credentials

- **Username:** `admin`
- **Password:** `Biostecgroup@4922`
- **Email (in Firebase):** `admin@biostecgroup.com`

The admin account will be automatically created when you first log in.

## 4. Troubleshooting

### "auth/user-not-found" error
This is normal on first login. The app will automatically create the admin user.

### "auth/configuration-not-found" error
This means Email/Password authentication is not enabled. Follow step 1 above.

### "permission-denied" error
Your Firestore security rules are blocking access. Update the rules to allow read/write or use test mode.

## 5. Security Note

For production, consider:
1. Using Firebase Admin SDK on a backend server for admin operations
2. Implementing proper role-based access control (RBAC)
3. Using Firebase Custom Claims for admin privileges
4. Not hardcoding credentials in the frontend (use environment variables)
