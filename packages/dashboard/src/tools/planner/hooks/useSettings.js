import { useState, useEffect } from 'react';
import {
  readSettingsStudents, writeSettingsStudents,
  readSettingsSubjects, writeSettingsSubjects,
} from '../firebase/settings.js';

// Manages settings state: student list and per-student default subjects.
// Loads students on mount; loads subjects for activeStudent on demand.
// plannerStudent: optional — pre-loads subjects for the current planner student.
export function useSettings(uid, plannerStudent) {
  const [students, setStudents]               = useState([]);
  const [activeStudent, setActiveStudent]     = useState(null);
  const [subjectsByStudent, setSubjectsByStudent] = useState({});

  // Load student list once on mount.
  useEffect(() => {
    if (!uid) return;
    readSettingsStudents(uid).then(names => {
      setStudents(names);
      if (names.length) setActiveStudent(names[0]);
    });
  }, [uid]);

  // Load subjects for activeStudent when it changes (lazy, cached).
  useEffect(() => {
    if (!uid || !activeStudent) return;
    if (subjectsByStudent[activeStudent] !== undefined) return;
    readSettingsSubjects(uid, activeStudent).then(subjects => {
      setSubjectsByStudent(prev => ({ ...prev, [activeStudent]: subjects }));
    });
  }, [uid, activeStudent]);

  // Pre-load subjects for the planner's current student (may differ from activeStudent tab).
  useEffect(() => {
    if (!uid || !plannerStudent) return;
    if (subjectsByStudent[plannerStudent] !== undefined) return;
    readSettingsSubjects(uid, plannerStudent).then(subjects => {
      setSubjectsByStudent(prev => ({ ...prev, [plannerStudent]: subjects }));
    });
  }, [uid, plannerStudent]);

  // Write student list and update local state.
  async function saveStudents(names) {
    setStudents(names);
    await writeSettingsStudents(uid, names);
  }

  // Write subject list for activeStudent and update local state.
  async function saveSubjects(subjects) {
    setSubjectsByStudent(prev => ({ ...prev, [activeStudent]: subjects }));
    await writeSettingsSubjects(uid, activeStudent, subjects);
  }

  return {
    students,
    activeStudent, setActiveStudent,
    activeSubjects: subjectsByStudent[activeStudent] ?? [],
    subjectsByStudent,
    saveStudents,
    saveSubjects,
  };
}
