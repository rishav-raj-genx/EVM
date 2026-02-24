"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Election = {
  id: string;
  title: string;
  class: string;
  date: string;
  status: string;
};

type Candidate = {
  id: string;
  name: string;
  electionId: string;
};

export default function ResultsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [electionStatus, setElectionStatus] = useState<string>("");

  // Fetch elections
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "elections"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setElections(list);
    });
    return () => unsub();
  }, []);

  // Fetch candidates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "candidates"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCandidates(list);
    });
    return () => unsub();
  }, []);

  // Fetch votes live for selected election
  useEffect(() => {
    if (!selectedElectionId) return;

    const q = query(
      collection(db, "votes"),
      where("electionId", "==", selectedElectionId)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const counts: Record<string, number> = {};

      snap.forEach((d) => {
        const data = d.data();
        const cid = data.candidateId;
        counts[cid] = (counts[cid] || 0) + 1;
      });

      setVoteCounts(counts);

      // Fetch election status (lock results)
      const electionRef = doc(db, "elections", selectedElectionId);
      const electionSnap = await getDoc(electionRef);
      if (electionSnap.exists()) {
        setElectionStatus(electionSnap.data().status);
      }
    });

    return () => unsub();
  }, [selectedElectionId]);

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  // Unique classes from elections
  const classes = Array.from(new Set(elections.map((e) => e.class)));

  // Elections for selected class
  const classElections = elections.filter((e) => e.class === selectedClass);

  const filteredCandidates = candidates.filter(
    (c) => c.electionId === selectedElectionId
  );

  // Total votes
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  // Find winner
  let winnerId: string | null = null;
  let maxVotes = -1;
  for (const cid in voteCounts) {
    if (voteCounts[cid] > maxVotes) {
      maxVotes = voteCounts[cid];
      winnerId = cid;
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>📊 Results (Per Class)</h1>

      {/* Select Class */}
      <select
        value={selectedClass}
        onChange={(e) => {
          setSelectedClass(e.target.value);
          setSelectedElectionId("");
          setVoteCounts({});
        }}
      >
        <option value="">Select Class</option>
        {classes.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <br /><br />

      {/* Select Election */}
      {selectedClass && (
        <select
          value={selectedElectionId}
          onChange={(e) => setSelectedElectionId(e.target.value)}
        >
          <option value="">Select Election</option>
          {classElections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} — {e.date}
            </option>
          ))}
        </select>
      )}

      <hr />

      {!selectedElectionId && <p>Please select a class and election.</p>}

{selectedElectionId &&
  (electionStatus !== "ended" ||
    !elections.find(e => e.id === selectedElectionId)?.resultsPublished) && (
    <p style={{ color: "orange" }}>
      🔒 Results are not published yet.
    </p>
)}

{selectedElectionId &&
  electionStatus === "ended" &&
  elections.find(e => e.id === selectedElectionId)?.resultsPublished && (
    <div>
      <h2>Results</h2>
      <p>Total Votes: <strong>{totalVotes}</strong></p>

      {filteredCandidates.map((c) => {
        const count = voteCounts[c.id] || 0;
        const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

        return (
          <div key={c.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>
                {c.name} {winnerId === c.id && "🏆"}
              </strong>
              <span>
                {count} votes ({percent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: 20,
                backgroundColor: "#333",
                borderRadius: 10,
                overflow: "hidden",
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  backgroundColor: winnerId === c.id ? "#22c55e" : "#3b82f6",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
)}
      

      <hr />
      <button onClick={logout}>Logout</button>
    </div>
  );
}