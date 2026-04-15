import { useState } from 'react';
import { getTodayDayIndex } from '../constants/days.js';

// Holds all local UI state for the planner.
// No Firebase, no business logic — only what the user currently sees.
// Any new sheet or panel added to the planner gets its state here.
// NOTE: the active student lives in the shell (App.jsx) so the desktop
// sidebar can show a student selector — see PlannerTab props.
export function usePlannerUI() {
  const [day, setDay]                           = useState(getTodayDayIndex);
  const [editTarget, setEditTarget]             = useState(null); // { subject, day }
  const [showUpload, setShowUpload]             = useState(false);
  const [showAddSubject, setShowAddSubject]     = useState(false);
  const [showMonthPicker, setShowMonthPicker]   = useState(false);
  const [showSickDay, setShowSickDay]           = useState(false);
  const [showUndoSickDay, setShowUndoSickDay]   = useState(false);
  const [showSettings, setShowSettings]         = useState(false);

  return {
    day,           setDay,
    editTarget,    setEditTarget,
    showUpload,    setShowUpload,
    showAddSubject, setShowAddSubject,
    showMonthPicker, setShowMonthPicker,
    showSickDay,    setShowSickDay,
    showUndoSickDay, setShowUndoSickDay,
    showSettings,   setShowSettings,
  };
}
