# IDMS — Integrated Document Management System

> **POLIS DIRAJA MALAYSIA · IPK PERAK**  
> Unit Teknologi Maklumat

A secure, web-based document management system built for internal use at IPK Perak. IDMS enables officers to upload, track, search, and manage official documents with real-time collaboration through a built-in messaging system.

---

## Features

### Document Management
- Upload and store official documents (Memo, Surat, Utusan, Email)
- Track document status — Pending → Viewed → Processed
- Filter and search by type, department, date range, and status
- Auto-sync unread emails from Gmail via Google Apps Script

### Dashboard
- Real-time metrics — total, pending, viewed, processed counts
- Monthly document bar chart and document type pie chart
- Recent activity feed and reference number list
- **Admin only:** Generate PDF reports with custom filters

### Role-Based Access Control

| Feature | Admin | User |
|---|:---:|:---:|
| View documents | ✅ | ✅ |
| Upload documents | ✅ | ✅ |
| Mark as Processed | ✅ | ✅ |
| Edit documents | ✅ | ❌ |
| Delete documents | ✅ | ❌ |
| Manage users (roles, delete) | ✅ | ❌ |
| Generate PDF reports | ✅ | ❌ |
| Admin panel | ✅ | ❌ |

### Messaging (Chat)
- Real-time direct messaging between officers
- Online/offline presence and typing indicators
- Share library documents directly in chat
- Message deletion with confirmation

### Authentication
- Login with **Nombor Badan** (police badge number) + password
- Password recovery via registered email
- Admin manages user roles from the Admin panel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| File Storage | Firebase Storage |
| Cloud Functions | Firebase Functions |
| PDF Generation | jsPDF + jspdf-autotable |
| Email Sync | Google Apps Script |

---

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx          # App shell — sidebar, header, notifications
│   ├── ProtectedRoute.jsx  # Auth guard for authenticated routes
│   └── AdminRoute.jsx      # Role guard for admin-only routes
├── hooks/
│   └── useRole.js          # Realtime role hook (reads from Firestore)
├── pages/
│   ├── Login.jsx           # Nombor Badan + password login
│   ├── Signup.jsx          # Registration with Nombor Badan, name, email
│   ├── Dashboard.jsx       # Metrics, charts, activity feed
│   ├── Library.jsx         # Document list with search, filter, edit, delete
│   ├── UploadPage.jsx      # Document upload form
│   ├── Chat.jsx            # Real-time messaging
│   ├── AdminPanel.jsx      # User management (admin only)
│   └── ReportModal.jsx     # PDF report generator (admin only)
└── firebase.js             # Firebase app initialisation
firestore.rules             # Firestore security rules
storage.rules               # Storage security rules
```

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users/{uid}` | User profiles — Nombor Badan, firstName, lastName, email, role |
| `usernames/{nomborBadan}` | Login lookup — maps Nombor Badan → uid + email |
| `documents/{docId}` | All uploaded documents |
| `chats/{chatId}` | Chat sessions |
| `chats/{chatId}/messages/{msgId}` | Individual messages |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore, Auth, Storage, and Functions enabled

### Installation

```bash
git clone https://github.com/<org>/IDMS-System.git
cd IDMS-System
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_APPS_SCRIPT_URL=
```

### Run Development Server

```bash
npm run dev
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Build for Production

```bash
npm run build
```

---

## First-Time Admin Setup

1. Register an account via the Signup page using your Nombor Badan.
2. In the **Firebase Console → Firestore → `users` collection**, find your user document.
3. Add the field `role` with value `"admin"`.
4. Log in — the **Admin** link will appear in the sidebar.
5. From the Admin panel, assign admin roles to other users as needed.

---

## License

Internal use only — Unit Teknologi Maklumat, IPK Perak, PDRM.
