import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

export function useRole() {
  const [role, setRole] = useState(null);
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
        setLoading(false);
        return;
      }
      unsubFirestore = onSnapshot(doc(db, "users", user.uid), (snap) => {
        setRole(snap.exists() ? (snap.data().role || "user") : "user");
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  return { role, loading, isAdmin: role === "admin" };
}
