import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Layout from "../components/Layout";

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4H16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M19 6L18 20C18 21.1 17.1 22 16 22H8C6.9 22 6 21.1 6 20L5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setUsers(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            role: d.data().role || "user",
          }))
        );
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRoleChange = async (userId, newRole) => {
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showToast("Role updated.");
    } catch {
      showToast("Failed to update role.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async (user) => {
    setSaving((prev) => ({ ...prev, [user.id]: true }));
    try {
      await deleteDoc(doc(db, "users", user.id));
      if (user.username) {
        await deleteDoc(doc(db, "usernames", user.username.toLowerCase()));
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";
      showToast(`${displayName} removed.`);
    } catch {
      showToast("Failed to delete user.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, [user.id]: false }));
      setConfirmDelete(null);
    }
  };

  return (
    <Layout>
      <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
            User Management
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
            Manage roles and access for all IDMS users.
          </p>
        </div>

        {loading ? (
          <div style={{ color: "#94a3b8", padding: "60px 0", textAlign: "center" }}>
            Loading users...
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={th}>Name</th>
                  <th style={th}>Nombor Badan</th>
                  <th style={th}>Email</th>
                  <th style={th}>Role</th>
                  <th style={th}>Joined</th>
                  <th style={{ ...th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isYou = u.id === currentUid;
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={td}>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—"}
                        </span>
                        {isYou && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#2f80ed", fontWeight: 600 }}>
                            (You)
                          </span>
                        )}
                      </td>
                      <td style={{ ...td, color: "#475569", fontSize: 13 }}>{u.username || "—"}</td>
                      <td style={{ ...td, color: "#64748b" }}>{u.email || "—"}</td>
                      <td style={td}>
                        <select
                          value={u.role}
                          disabled={saving[u.id] || isYou}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          title={isYou ? "You cannot change your own role" : "Change role"}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            fontSize: 13,
                            cursor: isYou ? "not-allowed" : "pointer",
                            background: isYou ? "#f8fafc" : "#fff",
                            color: u.role === "admin" ? "#2f80ed" : "#475569",
                            fontWeight: 600,
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td style={{ ...td, color: "#94a3b8", fontSize: 13 }}>
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {!isYou && (
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={saving[u.id]}
                            title="Delete user"
                            style={{
                              background: "none",
                              border: "1px solid #fca5a5",
                              borderRadius: 6,
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "5px 10px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 13,
                            }}
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <div
                style={{ padding: "50px 0", textAlign: "center", color: "#94a3b8" }}
              >
                No users found.
              </div>
            )}
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 12, color: "#cbd5e1" }}>
          Note: Deleting a user removes their IDMS profile. Their Firebase Auth account must be
          disabled separately in the Firebase console if needed.
        </p>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15,23,42,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 32,
              maxWidth: 380,
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "#1e293b" }}>
              Delete {[confirmDelete.firstName, confirmDelete.lastName].filter(Boolean).join(" ") || confirmDelete.username}?
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
              This will remove their IDMS profile. They will no longer be able to use the
              system.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#475569",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: "#ef4444",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 1100,
            background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
            color: toast.type === "error" ? "#b91c1c" : "#15803d",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}

const th = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 600,
  color: "#475569",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const td = {
  padding: "12px 16px",
  color: "#1e293b",
};
