import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const email = currentUser.email?.toLowerCase() || '';

      const defaultAdmins = ['jotamolinas@gmail.com', 'everacost@gmail.com', 'test@ahipega.com.py'];
      
      try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        const firestoreAdmins: string[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email) {
            firestoreAdmins.push(data.email.toLowerCase());
          }
        });

        const allowed = [...defaultAdmins, ...firestoreAdmins];
        if (allowed.includes(email)) {
          setIsAuthorized(true);
        } else {
          await signOut(auth);
          setIsAuthorized(false);
        }
      } catch (err) {
        if (defaultAdmins.includes(email)) {
          setIsAuthorized(true);
        } else {
          await signOut(auth);
          setIsAuthorized(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <span className="text-fuchsia-500 font-mono animate-pulse uppercase tracking-widest text-sm">Validando Permisos de Administrador...</span>
      </div>
    );
  }

  if (!user || isAuthorized === false) {
    return <Navigate to="/login?error=unauthorized" replace />;
  }

  return <>{children}</>;
}
