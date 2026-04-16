// Provides live Firestore data for the HomeTab morning summary.
// Subscribes to: student list, today's subjects for the active student,
// point balances for Orion and Malachi, and attendance for both students.
import { useState, useEffect } from 'react';
import { db } from '@homeschool/shared';
import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { getMondayOf, toWeekId, getTodayDayIndex } from '../tools/planner/constants/days.js';

const REQUIRED_DAYS = 175;

function todayIso() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function parseLocal(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return (y && m && d) ? new Date(y, m - 1, d) : null;
}

function countWeekdays(startStr, endStr) {
  const s = parseLocal(startStr), e = parseLocal(endStr);
  if (!s || !e || s > e) return 0;
  let n = 0; const c = new Date(s);
  while (c <= e) { const d = c.getDay(); if (d >= 1 && d <= 5) n++; c.setDate(c.getDate() + 1); }
  return n;
}

export function useHomeSummary(uid) {
  const [students, setStudents]         = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [subjects, setSubjects]         = useState({});
  const [points, setPoints]             = useState({ Orion: null, Malachi: null });
  const [attendance, setAttendance]     = useState({});

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

  // One-shot: fetch attendance for both students
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const today = todayIso();
        const yearsSnap = await getDocs(collection(db, `users/${uid}/schoolYears`));
        const years = yearsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const active = years.find(y => y.startDate && y.endDate && y.startDate <= today && today <= y.endDate)
          ?? (years.length ? years.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '')).pop() : null);
        if (!active) { setAttendance({}); return; }
        const end = (active.endDate && today > active.endDate) ? active.endDate : today;
        const schoolDays = countWeekdays(active.startDate, end);
        const breaksSnap = await getDocs(collection(db, `users/${uid}/schoolYears/${active.id}/breaks`));
        let breakDays = 0;
        breaksSnap.docs.forEach(d => {
          const b = d.data();
          if (!b.startDate || !b.endDate) return;
          const bS = b.startDate < active.startDate ? active.startDate : b.startDate;
          const bE = b.endDate > end ? end : b.endDate;
          if (bS <= bE) breakDays += countWeekdays(bS, bE);
        });
        const sickSnap = await getDocs(collection(db, `users/${uid}/sickDays`));
        const sickDates = sickSnap.docs.map(d => d.id);
        const result = {};
        for (const name of ['Orion', 'Malachi']) {
          const sick = sickDates.filter(d => d >= active.startDate && d <= end).length;
          const attended = Math.max(0, schoolDays - breakDays - sick);
          result[name] = { attended, required: REQUIRED_DAYS };
        }
        setAttendance(result);
      } catch (err) {
        console.warn('useHomeSummary: attendance fetch failed', err);
      }
    })();
  }, [uid]);

  return { students, activeStudent, setActiveStudent, subjects, dayIndex, weekId, points, attendance };
}
