# IDMS — Integrated Document Management System
## Full Setup, Usage & Deployment Guide

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Clone & Install](#4-clone--install)
5. [Environment Variables](#5-environment-variables)
6. [Firebase Project Setup](#6-firebase-project-setup)
7. [Firestore Security Rules](#7-firestore-security-rules)
8. [Google Apps Script Setup](#8-google-apps-script-setup)
9. [Set the First Super Admin](#9-set-the-first-super-admin)
10. [Run Locally](#10-run-locally)
11. [How to Use the App](#11-how-to-use-the-app)
12. [Making Changes](#12-making-changes)
13. [Deploy to Firebase Hosting](#13-deploy-to-firebase-hosting)

---

## 1. Project Overview

IDMS is a web-based document management system built for **IPK Perak (PDRM)**. It allows staff to upload, organise, search and track official documents (Memo, Surat, Utusan, Email). It includes a real-time chat system, a notification bell, PDF report generation and role-based access control.

**Departments supported:** ADMIN TSM, IT, SAIFER, KOMUNIKASI

**Document types:** MEMO, SURAT, UTUSAN, EMAIL

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Routing | React Router v7 |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| File Storage | Google Drive (via Apps Script) |
| Email Sync | Gmail API (via Apps Script) |
| Hosting | Firebase Hosting |

---

## 3. Prerequisites

Install the following before starting:

- **Node.js** v18 or later — https://nodejs.org
- **Git** — https://git-scm.com
- **Firebase CLI** — install globally after Node.js is ready:

```bash
npm install -g firebase-tools
```

- A **Google account** that owns or has editor access to the Firebase project
- A **Google account** for the Apps Script (can be the same account)

---

## 4. Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/IDMS-System.git

# Go into the project folder
cd IDMS-System

# Install all dependencies
npm install
```

---

## 5. Environment Variables

Create a file named `.env.local` in the root of the project. This file is never committed to Git.

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

You will get the Firebase values from **Step 6** and the Apps Script URL from **Step 8**.

> **Important:** Every time you change `.env.local`, you must restart the dev server (`npm run dev`) for the new values to take effect.

---

## 6. Firebase Project Setup

### 6.1 Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Enter a project name (e.g., `idms-system`)
4. Disable Google Analytics if not needed → **Create project**

### 6.2 Register a Web App

1. Inside your project, click the **Web** icon (`</>`)
2. Enter an app nickname (e.g., `IDMS Web`)
3. Check **Also set up Firebase Hosting**
4. Click **Register app**
5. Copy the `firebaseConfig` object shown — you will use these values in `.env.local`

### 6.3 Enable Authentication

1. In the Firebase Console, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password**
4. Optionally enable **Google** sign-in if needed
5. Click **Save**

### 6.4 Enable Firestore Database

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a region (e.g., `asia-southeast1` for Malaysia)
5. Click **Enable**

### 6.5 Apply Firestore Security Rules

After creating Firestore, go to the **Rules** tab and replace all content with the following:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdminOrAbove() {
      let role = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
      return request.auth != null && (role == 'admin' || role == 'superadmin');
    }

    match /usernames/{uname} {
      allow get: if uname.matches('^[a-z0-9_]{3,}$');
      allow list: if false;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.uid
        && request.resource.data.keys().hasOnly(['uid', 'email'])
        && request.resource.data.email is string;
      allow update: if false;
      allow delete: if isAdminOrAbove();
    }

    match /documents/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if isAdminOrAbove();
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null &&
        (request.auth.uid == userId || isAdminOrAbove());
      allow delete: if isAdminOrAbove();
    }

    match /chats/{chatId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

Click **Publish**.

### 6.6 Update src/firebase.js

Open `src/firebase.js` and replace the `firebaseConfig` values with your own project values from Step 6.2:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 6.7 Link Firebase CLI to Your Project

```bash
# Login to Firebase
firebase login

# Link this project folder to your Firebase project
firebase use --add
```

When prompted, select your Firebase project and give it the alias `default`.

---

## 7. Firestore Security Rules

The rules file is located at `firestore.rules` in the root of the project.

### Roles and what they control

| Role | Firestore write access |
|---|---|
| `user` | Can create documents (upload), update own profile, read everything |
| `admin` | Can update and delete documents, manage users |
| `superadmin` | Same as admin — full access |

### Deploying updated rules

Whenever you change `firestore.rules`, deploy only the rules without touching hosting:

```bash
firebase deploy --only firestore:rules
```

---

## 8. Google Apps Script Setup

The app uses a Google Apps Script web app to handle two things:
- **File uploads** — receives the PDF as base64 and saves it to Google Drive
- **Email sync** — fetches unread Gmail messages and saves email PDFs to Drive

### 8.1 Open the Script

The Apps Script is already written and hosted. Open it using this link (requires access to the Google account that owns it):

> https://script.google.com/home/projects/128VW4C78VhJcAQW0dly3rVqjwGKx5qdnV6nGc2sZASe-_S5rFu1N08nP/edit

### 8.2 Deploy the Script

1. Click **Deploy → New deployment**
2. Click the gear icon next to **Type** and select **Web app**
3. Set the fields:
   - **Description:** `IDMS v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. If prompted, click **Authorize access** and allow the required permissions (Gmail, Drive)
6. Copy the **Web app URL** that ends in `/exec`

### 8.3 Update .env.local

Paste the copied URL into `.env.local`:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart the dev server after saving.

### 8.4 Re-deploying After Script Changes

If you edit the Apps Script code, you must create a **new deployment** — editing an existing deployment does not update the live URL behavior.

1. Click **Deploy → Manage deployments**
2. Click **New deployment** (do not edit the existing one)
3. Copy the new URL and update `.env.local`

---

## 9. Set the First Super Admin

When the system starts fresh, all users default to the `user` role. To access the Admin Panel, at least one account must be manually set to `superadmin`.

1. Sign up for an account normally through the app
2. Go to **Firebase Console → Firestore Database → users collection**
3. Find your user document (the document ID is your Firebase Auth UID)
4. Click the `role` field and change the value to `superadmin`
5. Log out and log back in to the app
6. You now have full access including the **Admin Panel**

From the Admin Panel, you can assign roles to all other users without touching Firebase Console again.

---

## 10. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> Make sure `.env.local` is set up and the Apps Script is deployed before running. If you change `.env.local`, restart the dev server.

---

## 11. How to Use the App

### 11.1 Roles

| Role | Description |
|---|---|
| `superadmin` | Full access — all features including Admin Panel and user management |
| `admin` | Can upload, edit, delete documents and mark as done |
| `user` | Can view, download and mark documents as done |

### 11.2 Signing Up

1. Go to the **Sign Up** page
2. Enter your **Nombor Badan** (police number) as username — must be unique
3. Fill in first name, last name, email and password
4. A `superadmin` or `admin` can then assign the correct role via the Admin Panel

### 11.3 Dashboard

- Displays total documents, viewed count, processed count
- Bar chart showing monthly document activity by type
- Pie chart breakdown by document type
- Admin and superadmin can generate a **PDF report** from here

### 11.4 Library

The Library shows all documents in a searchable, filterable table.

**Columns:** Reference No, Title, Uploaded By (Nombor Badan), Type, Department, Date, Status, Action

**Filters:**
- Search by title, reference number, type, department
- Filter by department pill buttons
- Filter by type dropdown
- Filter by date range

**Actions by role:**

| Button | user | admin | superadmin |
|---|---|---|---|
| View | ✅ | ✅ | ✅ |
| Download | ✅ | ✅ | ✅ |
| Mark as Done | ✅ | ✅ | ✅ |
| Edit | ❌ | ✅ | ✅ |
| Delete | ❌ | ✅ | ✅ |

**Sync Emails button** — fetches unread emails from the connected Gmail account via Apps Script and creates document entries automatically.

### 11.5 Upload Page

> Only accessible to `admin` and `superadmin`.

1. Enter **Reference Number** (Ref. No.)
2. Enter **Document Title**
3. Select **Type** — Memo, Surat or Utusan
4. Drag and drop or browse for a **PDF file** (max 10 MB)
5. Select one or more **Departments**
6. Click **Upload Document**

The PDF is saved to Google Drive and metadata is saved to Firestore. The uploader's Nombor Badan is recorded automatically.

### 11.6 Chat

- Real-time 1:1 messaging between staff
- Shows online/offline presence
- Supports emoji picker and file attachments from the Library
- Users can edit their own messages, clear chat history, and block contacts

### 11.7 Admin Panel

> Only accessible to `superadmin`.

- Lists all registered users with their name, Nombor Badan, email, role and join date
- Change any user's role using the dropdown (user / admin / superadmin)
- Delete user profiles

---

## 12. Making Changes

### 12.1 Code Changes

Edit files in `src/`. The dev server (`npm run dev`) hot-reloads automatically. After changes are confirmed working, build and deploy (see Section 13).

### 12.2 Adding a New Department

Departments are defined in two places. Update both:

**`src/pages/UploadPage.jsx`**
```js
const DEPARTMENT_OPTIONS = ["ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI", "NEW_DEPT"];
```

**Apps Script** — add the new department to `DEPT_KEYWORDS`:
```js
const DEPT_KEYWORDS = {
  ...
  "NEW_DEPT": ["keyword1", "keyword2"],
};
```

Then re-deploy the Apps Script (new deployment, not editing existing).

### 12.3 Changing Firestore Security Rules

1. Edit `firestore.rules` in the project root
2. Deploy only the rules:

```bash
firebase deploy --only firestore:rules
```

### 12.4 Changing the Apps Script

1. Open the script at https://script.google.com
2. Make your edits
3. Click **Deploy → New deployment** (never edit the existing deployment)
4. Copy the new URL
5. Update `VITE_APPS_SCRIPT_URL` in `.env.local`
6. Rebuild and redeploy the app (see Section 13)

### 12.5 Updating Environment Variables for Production

Vite bakes environment variables into the build at build time. If you change `.env.local`, you must rebuild:

```bash
npm run build
firebase deploy --only hosting
```

---

## 13. Deploy to Firebase Hosting

### 13.1 One-time Setup

If this is the first time deploying, make sure the Firebase CLI is logged in and the project is linked:

```bash
firebase login
firebase use --add   # select your project, alias: default
```

### 13.2 Build the App

```bash
npm run build
```

This creates a `dist/` folder with the production build.

### 13.3 Deploy

```bash
firebase deploy --only hosting
```

Your app will be live at:
```
https://YOUR_PROJECT_ID.web.app
```

### 13.4 Deploy Everything at Once

To deploy hosting, Firestore rules and storage rules together:

```bash
firebase deploy
```

### 13.5 Full Deployment Checklist

Before every deployment, go through this list:

- [ ] `.env.local` has the correct `VITE_APPS_SCRIPT_URL` (not a broken or old URL)
- [ ] Apps Script is deployed and accessible (test the URL in a browser)
- [ ] `firestore.rules` is up to date
- [ ] `npm run build` completed without errors
- [ ] At least one `superadmin` account exists in Firestore

---

## Firestore Collections Reference

### `users`
| Field | Type | Description |
|---|---|---|
| `username` | string | Nombor Badan — unique login identifier |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `email` | string | Email address (lowercase) |
| `role` | string | `user`, `admin`, or `superadmin` |
| `createdAt` | Timestamp | Account creation time |

### `documents`
| Field | Type | Description |
|---|---|---|
| `refNo` | string | Reference number |
| `title` | string | Document title |
| `type` | string | `MEMO`, `SURAT`, `UTUSAN`, or `EMAIL` |
| `departments` | array | List of department names |
| `department` | string | Comma-separated departments (legacy) |
| `fileUrl` | string | Google Drive view URL |
| `fileId` | string | Google Drive file ID |
| `uploadedBy` | string | Nombor Badan of the uploader |
| `status` | string | `pending`, `viewed`, or `processed` |
| `createdAt` | Timestamp | Upload time |
| `viewedBy` | array | UIDs of users who viewed the document |

### `chats`
| Field | Type | Description |
|---|---|---|
| `participants` | array | UIDs of both users |
| `lastMessage` | string | Preview of the last message |
| `unreadCounts` | map | `{ uid: count }` per user |
| `blocked` | map | `{ uid: true/false }` per user |

---

## Common Issues

**Upload failed (HTTP 404)**
The Apps Script deployment URL is no longer valid. Re-deploy the script and update `VITE_APPS_SCRIPT_URL` in `.env.local`, then rebuild the app.

**Admin Panel not accessible**
No `superadmin` exists yet. Manually set `role: "superadmin"` on a user document in Firebase Console (see Section 9).

**Changes not reflected after deployment**
Environment variables are baked in at build time. Always run `npm run build` after changing `.env.local` before deploying.

**Password reset email goes to spam**
Firebase uses a shared email domain by default. For production, configure a custom SMTP domain in Firebase Console under Authentication → Templates → Custom domain.

**User can still see upload page briefly**
This is resolved — the page shows nothing while the role is loading, then redirects non-admin users to the dashboard.
