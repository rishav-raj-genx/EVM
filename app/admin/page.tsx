"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("");
  const [date, setDate] = useState("");

  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [newCandidate, setNewCandidate] = useState("");

  // 🔁 Fetch elections in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "elections"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setElections(list);
    });
    return () => unsub();
  }, []);

  // 🔁 Fetch candidates in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "candidates"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setCandidates(list);
    });
    return () => unsub();
  }, []);

  // ➕ Create election
  const createElection = async () => {
    if (!title || !className || !date) {
      alert("Fill all fields");
      return;
    }

    await addDoc(collection(db, "elections"), {
      title,
      class: className,
      date,
      status: "upcoming",
      createdAt: serverTimestamp(),
      resultsPublished: false,
    });

    setTitle("");
    setClassName("");
    setDate("");
    alert("Election created");
  };

  // 🗑 Delete election
  const deleteElection = async (id: string) => {
    if (!confirm("Delete this election?")) return;
    await deleteDoc(doc(db, "elections", id));
  };

  // ➕ Add candidate to election
  const addCandidate = async (electionId: string) => {
    if (!newCandidate) {
      alert("Enter candidate name");
      return;
    }

    await addDoc(collection(db, "candidates"), {
      electionId,
      name: newCandidate,
      createdAt: serverTimestamp(),
    });

    setNewCandidate("");
    alert("Candidate added");
  };

  // 🗑 Delete candidate
  const deleteCandidate = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    await deleteDoc(doc(db, "candidates", id));
  };

  // 📢 Publish / Unpublish results
  const togglePublishResults = async (electionId: string, current: boolean) => {
    await updateDoc(doc(db, "elections", electionId), {
      resultsPublished: !current,
    });
  };

  // 🚪 Logout
  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>

      <h2>Create Election</h2>

      <input
        placeholder="Election Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <br />

      <input
        placeholder="Class (e.g. CSE-A)"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
      />
      <br />

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <br />

      <button onClick={createElection}>Create Election</button>

      <hr />

      <h2>All Elections</h2>

      {elections.length === 0 && <p>No elections found.</p>}

      <ul>
        {elections.map((e) => (
          <li key={e.id} style={{ marginBottom: 20 }}>
            <strong>{e.title}</strong> — {e.class} — {e.date} — {e.status}

            <br /><br />

            <input
              placeholder="Candidate name"
              value={newCandidate}
              onChange={(ev) => setNewCandidate(ev.target.value)}
            />
            <button onClick={() => addCandidate(e.id)}>Add Candidate</button>

            <ul>
              {candidates
                .filter((c) => c.electionId === e.id)
                .map((c) => (
                  <li key={c.id}>
                    {c.name}{" "}
                    <button onClick={() => deleteCandidate(c.id)}>Delete</button>
                  </li>
                ))}
            </ul>

            <br />

            <button onClick={() => deleteElection(e.id)}>Delete Election</button>{" "}
            <button onClick={() => togglePublishResults(e.id, !!e.resultsPublished)}>
              {e.resultsPublished ? "Unpublish Results" : "Publish Results"}
            </button>
          </li>
        ))}
      </ul>

      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
}