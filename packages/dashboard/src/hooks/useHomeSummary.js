// Provides live Firestore data for the HomeTab morning summary.
// Subscribes to: student list, today's subjects for the active student,
// and point balances for Orion and Malachi.
import { useState, useEffect } from 'react';
import { db } from '@homeschool/shared';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { getMondayOf, toWeekId, getTodayDayIndex } from '../tools/planner/constants/days.js';

export function useHomeSummary(uid) {
  const [students, setStudents]         = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [subjects, setSubjects]         = useState({});
  const [points, setPoints]             = useState({ Orion: null, Malachi: null });

  const weekId   = toWeekId(getMondayOf(new Date()));
  const dayIndex = getTodayDayIndex();

  // Subscribe to student names list
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, `users/${uid}/settings/students`);
    return onSnapshot(ref, snap => {
      const names = snap.data()?.names ?? [];
      setStudents(names);
      setActiveStudent(prev => prev ?? names[0] ?? null);
    });
  }, [uid]);

  // Subscribe to today's subjects for the active student
  useEffect(() => {
    if (!uid || !activeStudent) return;
    const path = `users/${uid}/weeks/${weekId}/students/${activeStudent}/days/${dayIndex}/subjects`;
    return onSnapshot(collection(db, path), snap => {
      const data = {};
      snap.docs.forEach(d => { data[d.id] = d.data(); });
      setSubjects(data);
    });
  }, [uid, activeStudent, weekId, dayIndex]);

  // Subscribe to Orion and Malachi's point balances
  useEffect(() => {
    if (!uid) return;
    const unsubs = ['Orion', 'Malachi'].map(name => {
      const ref = doc(db, `users/${uid}/rewardTracker/${name}`);
      return onSnapshot(ref, snap => {
        const pts = snap.data()?.points ?? 0;
        setPoints(prev => ({ ...prev, [name]: pts }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, [uid]);

  return { students, activeStudent, setActiveStudent, subjects, dayIndex, weekId, points };
}
