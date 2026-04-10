import { useState } from 'react';
import { getTodayDayIndex } from '../constants/days.js';

// Holds all local UI state for the planner.
// No Firebase, no business logic — only what the user currently sees.
// Any new sheet or panel added to the planner gets its state here.
export function usePlannerUI() {
  const [student, setStudent]               = useState('Orion');
  const [day, setDay]                       = useState(getTodayDayIndex);
  const [editTarget, setEditTarget]         = useState(null); // { subject, day }
  const [showUpload, setShowUpload]         = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);

  return {
    student,       setStudent,
    day,           setDay,
    editTarget,    setEditTarget,
    showUpload,    setShowUpload,
    showAddSubject, setShowAddSubject,
  };
}
