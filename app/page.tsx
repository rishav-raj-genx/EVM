// "use client";

// import { useEffect, useState } from "react";
// import { auth, db } from "@/lib/firebase";
// import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore";

// type Role = "admin" | "voter";

// export default function Home() {
//   const [loading, setLoading] = useState(true);
//   const [role, setRole] = useState<Role | null>(null);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         setLoading(false);
//         setRole(null);
//         return;
//       }

//       const userRef = doc(db, "users", user.uid);
//       const snap = await getDoc(userRef);

//       if (snap.exists()) {
//         const data = snap.data();
//         setRole(data.role as Role);
//       } else {
//         setRole("voter");
//       }

//       setLoading(false);
//     });

//     return () => unsub();
//   }, []);

//   const signIn = async () => {
//     try {
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(auth, provider);
//       const user = result.user;

//       if (!user.email || !user.email.endsWith("@msot-hiet.org")) {
//         await signOut(auth);
//         setError("Only college email (@msot-hiet.org) is allowed.");
//         return;
//       }

//       const userRef = doc(db, "users", user.uid);
//       const snap = await getDoc(userRef);

//       if (!snap.exists()) {
//         await setDoc(userRef, {
//           name: user.displayName || "",
//           email: user.email,
//           role: "voter",
//           class: "",
//           dob: "",
//           classLastChangedAt: serverTimestamp(),
//           createdAt: serverTimestamp(),
//         });
//       }
//     } catch (err) {
//       console.error(err);
//       setError("Login failed");
//     }
//   };

//   if (loading) {
//     return <p style={{ padding: 40 }}>Loading...</p>;
//   }

//   if (!role) {
//     return (
//       <main style={{ padding: 40 }}>
//         <h1>EVM Mirai</h1>
//         <button onClick={signIn}>Sign in with Google</button>
//         {error && <p style={{ color: "red" }}>{error}</p>}
//       </main>
//     );
//   }

//   if (role === "admin") {
//     return <AdminDashboard />;
//   }

//   return <VoterDashboard />;
// }


// function AdminDashboard() {
//   const [title, setTitle] = useState("");
//   const [className, setClassName] = useState("");
//   const [date, setDate] = useState("");
//   const [elections, setElections] = useState<any[]>([]);

//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, "elections"), (snapshot) => {
//       const list: any[] = [];
//       snapshot.forEach((doc) => {
//         list.push({ id: doc.id, ...doc.data() });
//       });
//       setElections(list);
//     });

//     return () => unsub();
//   }, []);

//   const createElection = async () => {
//     if (!title || !className || !date) {
//       alert("Fill all fields");
//       return;
//     }

//     await addDoc(collection(db, "elections"), {
//       title,
//       class: className,
//       date,
//       status: "upcoming",
//       createdAt: serverTimestamp(),
//     });

//     setTitle("");
//     setClassName("");
//     setDate("");
//   };

//   const startElection = async (id: string) => {
//     await updateDoc(doc(db, "elections", id), { status: "live" });
//   };

//   const endElection = async (id: string) => {
//     await updateDoc(doc(db, "elections", id), { status: "ended" });
//   };

//   const deleteElection = async (id: string) => {
//     if (!confirm("Delete this election?")) return;
//     await deleteDoc(doc(db, "elections", id));
//   };

//   return (
//     <div style={{ padding: 40 }}>
//       <h2>Admin Dashboard</h2>

//       <h3>Create Election</h3>
//       <input
//         placeholder="Election Title"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//       />
//       <br />
//       <input
//         placeholder="Class (e.g. CSE-A)"
//         value={className}
//         onChange={(e) => setClassName(e.target.value)}
//       />
//       <br />
//       <input
//         type="date"
//         value={date}
//         onChange={(e) => setDate(e.target.value)}
//       />
//       <br />
//       <button onClick={createElection}>Create Election</button>

//       <hr />

//       <h3>All Elections</h3>

//       {elections.map((e) => (
//         <div key={e.id} style={{ border: "1px solid #444", padding: 10, marginBottom: 10 }}>
//           <p><b>{e.title}</b></p>
//           <p>Class: {e.class}</p>
//           <p>Date: {e.date}</p>
//           <p>Status: {e.status}</p>

//           {e.status === "upcoming" && (
//             <button onClick={() => startElection(e.id)}>Start</button>
//           )}
//           {e.status === "live" && (
//             <button onClick={() => endElection(e.id)}>End</button>
//           )}

//           <button onClick={() => deleteElection(e.id)}>Delete</button>
//         </div>
//       ))}

//       <hr />
//       <button onClick={() => signOut(auth)}>Logout</button>
//     </div>
//   );
// }

// function VoterDashboard() {
//   return (
//     <div style={{ padding: 40 }}>
//       <h2>Voter Dashboard</h2>
//       <p>You are logged in as voter.</p>
//       <button onClick={() => signOut(auth)}>Logout</button>
//     </div>
//   );
// }


"use client";

import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // First time user
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          role: "voter", // default
          class: "",
          dob: "",
          classLastChangedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      const data = (await getDoc(userRef)).data();

      if (data?.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/voter";
      }
    });

    return () => unsub();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>EVM Mirai</h1>
      <button onClick={signIn}>Sign in with Google</button>
    </div>
  );
}