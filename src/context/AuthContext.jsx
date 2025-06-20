import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase user
  const [role, setRole] = useState(null);       // Role: admin, manager, viewer
  const [loading, setLoading] = useState(true); // Global loading state

  useEffect(() => {
   const auth = getAuth();
   const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
     setLoading(true);
     if (firebaseUser) {
       setUser(firebaseUser);
 
       const docRef = doc(db, 'users', firebaseUser.uid);
       const docSnap = await getDoc(docRef);
       if (docSnap.exists()) {
         const userData = docSnap.data();
         console.log('🔥 user data from Firestore:', userData);
         if (userData.approved) {
           setRole(userData.role); // ✅ Should be "admin"
         } else {
           setRole(null); // ❌ Not approved
         }
       } else {
         console.log('❌ User document not found');
         setRole(null);
       }
     } else {
       setUser(null);
       setRole(null);
     }
     setLoading(false);
   });
 
   return () => unsub();
 }, []);

  const signOut = () => {
    firebaseSignOut(getAuth());
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}