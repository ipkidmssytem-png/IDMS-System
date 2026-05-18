# IDMS User Guide

> **Integrated Document Management System**  
> POLIS DIRAJA MALAYSIA · IPK PERAK

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Library](#3-library)
4. [Upload Document](#4-upload-document)
5. [Chat / Messaging](#5-chat--messaging)
6. [Admin Panel](#6-admin-panel--admin-only)
7. [Generate Report](#7-generate-report--admin-only)
8. [Account & Password](#8-account--password)

---

## 1. Getting Started

### Registering an Account

1. Open the IDMS application and click **Daftar Akaun**.
2. Fill in the registration form:
   - **Nombor Badan** — your assigned police badge number (alphanumeric, minimum 3 characters)
   - **Nama Pertama** — your first name
   - **Nama Akhir** — your last name
   - **Email** — your email address (used for password recovery only)
   - **Kata Laluan** — create a strong password
   - **Sahkan Kata Laluan** — re-enter your password
3. Click **Daftar**.

> **Note:** Your Nombor Badan is your unique login ID. Keep it safe.

### Logging In

1. Enter your **Nombor Badan** and **Kata Laluan**.
2. Click **Log Masuk**.

### Forgot Password

1. On the login page, click **Lupa Kata Laluan?**
2. Enter the email address you registered with.
3. Check your inbox for a password reset link.

---

## 2. Dashboard

The Dashboard gives you a real-time overview of all documents in the system.

### Stat Cards

| Card | What it shows |
|---|---|
| **Pending Files** | Documents not yet viewed. Click to see them in the Library. |
| **Viewed Files** | Documents that have been opened. Click to see the list. |
| **Processed Files** | Documents marked as done. Click to see the list. |
| **Total Documents** | All documents in the system. Click to see all. |

### Charts

- **Monthly Document Overview** — bar chart showing document uploads per month, broken down by type. Use the **Year** dropdown to switch between years.
- **Document Distribution** — pie chart showing the percentage breakdown by document type.

### Recent Activity

Shows the latest actions (uploaded, viewed, processed) across all documents.

### Reference Numbers

A quick-access list of all document reference numbers. Click any item that has a file attached to open it.

---

## 3. Library

The Library is where all documents are stored and managed.

### Searching & Filtering

- **Search bar** — search by title, reference number, type, department, or status.
- **Type filter** — filter by All Types, Memo, Surat, Utusan, or Email.
- **Department filter** — filter by department.
- **Date range** — filter documents uploaded between two dates.
- **Sort** — sort by Latest First, Oldest First, Title A–Z, or Title Z–A.
- **Department pills** — quick filter tabs at the top of the table. The red badge shows how many pending documents exist in that department.
- **Column headers** — click Title, Type, Department, Date, or Status to sort by that column.

### Document Status

| Status | Meaning |
|---|---|
| **Pending** | Newly uploaded, not yet viewed |
| **Viewed** | Opened by at least one officer |
| **Processed** | Marked as handled/completed |

### Actions (all users)

- **View** — opens the document (marks it as Viewed automatically).
- **Download** — downloads the file.
- **Mark as Done (✓)** — marks the document as Processed. Only visible on non-processed documents.

### Actions (admin only)

- **Edit (pencil icon)** — edit the reference number, title, type, and departments.
- **Delete (trash icon)** — permanently deletes the document after confirmation.

### Sync Emails

Click **Sync Emails** to pull unread emails from the connected Gmail account into the Library.

---

## 4. Upload Document

1. Click **Upload Data** in the sidebar.
2. Fill in the document details:
   - Reference Number
   - Title
   - Type (Memo, Surat, Utusan, Email)
   - Department(s)
   - Attach file
3. Submit the form. The document will appear in the Library immediately.

---

## 5. Chat / Messaging

### Starting a Conversation

1. Click **Chat** in the sidebar.
2. Click **+ New Conversation**.
3. Search for an officer by name or Nombor Badan.
4. Click their name to start the conversation.

### Sending Messages

- Type your message in the input box and press **Enter** or click the send button.
- Click the **emoji button** to add emojis.
- Click the **paperclip button** to attach a document from the Library.

### Deleting a Message

1. Hover over your sent message — a **⋮** (three-dots) button will appear.
2. Click **⋮** → **Delete**.
3. Confirm the deletion. The message will show **"🚫 This message was deleted"** for both parties.

> You can only delete your own messages.

### Other Options (⋮ in the chat header)

- **Edit Messages** — enables edit mode. Click the pencil icon on any of your text messages to edit it.
- **Clear Chat** — hides all messages from your view (the other person still sees them).
- **Block / Unblock User** — prevents the other user from sending you messages.

### Online Status

- **Green dot** = Online
- **Grey dot** = Offline (last seen time shown)
- Typing indicator appears when the other person is typing.

---

## 6. Admin Panel *(Admin only)*

The Admin Panel lets administrators manage all user accounts.

### Accessing the Admin Panel

Click **Admin** (shield icon) in the sidebar. This link is only visible to users with the Admin role.

### Managing Users

The panel displays all registered users with their:
- Full name
- Nombor Badan
- Email
- Role
- Registration date

### Changing a User's Role

1. Find the user in the table.
2. Use the **Role dropdown** in their row to switch between `user` and `admin`.
3. The change is saved immediately.

> You cannot change your own role.

### Deleting a User

1. Click the **Delete** button on the user's row.
2. Confirm the deletion.

> Deleting a user removes their IDMS profile. Their Firebase Auth account must be disabled separately in the Firebase console if needed.

---

## 7. Generate Report *(Admin only)*

The Report Generator creates a detailed PDF document of the system's document metrics.

### Generating a Report

1. From the **Dashboard**, click **Generate Report** (top right, next to the search bar).
2. Apply your desired filters:
   - **Date Range** — set a From and To date, or leave blank for all dates.
   - **Department** — filter by a specific department or All.
   - **Document Type** — filter by Memo, Surat, Utusan, Email, or All.
   - **Status** — filter by Pending, Viewed, Processed, or All.
3. The preview shows how many documents match your filters.
4. Click **Generate PDF** to download the report.

### Report Contents

The generated PDF includes:

- **Header** — system name, IPK PERAK, report title, generation date and time
- **Filters Applied** — summary of the filters used
- **Summary Metrics** — total, pending, viewed, processed counts
- **By Type** — document count and percentage for each type
- **By Department** — document count per department
- **Document List** — full table with Ref No., Title, Type, Department, Date, and Status
- **Page numbers** and confidentiality footer on every page

The file is saved as: `IDMS_Report_YYYYMMDD_HHMM.pdf`

---

## 8. Account & Password

### Changing Your Password

1. Log out of IDMS.
2. On the login page, click **Lupa Kata Laluan?**
3. Enter your registered email address.
4. Follow the reset link sent to your email.

### Password Requirements

Passwords must be strong — typically a mix of uppercase, lowercase, numbers, and symbols.

---

*For technical support, contact Unit Teknologi Maklumat, IPK Perak.*
