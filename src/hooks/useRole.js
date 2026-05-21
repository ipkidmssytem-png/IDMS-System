import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

export function useRole() {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFirestore = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }
      if (!user) {
        setRole(null);
        setUsername("");
        setLoading(false);
        return;
      }
      unsubFirestore = onSnapshot(doc(db, "users", user.uid), (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setRole(data.role || "user");
        setUsername(data.username || "");
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";

  return { role, loading, isAdmin, isSuperAdmin, username };
}
