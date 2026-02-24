"use client";

import { useEffect, useState } from "react";
import {collection,onSnapshot,addDoc,query,where,getDocs,serverTimestamp,doc,setDoc,} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function VoterPage() {
  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  // Fetch active elections
  useEffect(() => {
    const q = query(
      collection(db, "elections"),
      where("status", "==", "active"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setElections(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fetch candidates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "candidates"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCandidates(list);
    });

    return () => unsub();
  }, []);

const vote = async (electionId: string, candidateId: string) => {
  if (!user) {
    alert("Not logged in");
    return;
  }

  try {
   const voteId = `${electionId}_${user.uid}`;
await setDoc(doc(db, "votes", voteId), {
  electionId,
  userId: user.uid,
  candidateId,
  createdAt: serverTimestamp(),
});

    alert("Vote submitted!");
  } catch (err: any) {
    console.error(err);
    alert("You have already voted in this election or voting is closed.");
  }
};

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Voter Panel</h1>

      {loading && <p>Loading elections...</p>}

      {!loading && elections.length === 0 && <p>No active elections.</p>}

      {elections.map((e) => (
        <div key={e.id} style={{ marginBottom: 30 }}>
          <h3>
            {e.title} — {e.class} — {e.date}
          </h3>

          <ul>
            {candidates
              .filter((c) => c.electionId === e.id)
              .map((c) => (
                <li key={c.id}>
                  {c.name}{" "}
                  <button onClick={() => vote(e.id, c.id)}>Vote</button>
                </li>
              ))}
          </ul>
        </div>
      ))}

      <hr />
      <button onClick={logout}>Logout</button>
    </div>
  );
}
