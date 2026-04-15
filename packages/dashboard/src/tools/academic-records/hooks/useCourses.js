import { useState, useEffect, useCallback } from 'react';
import {
  getCourses as fbGetCourses,
  addCourse as fbAddCourse,
  saveCourse as fbSaveCourse,
  deleteCourse as fbDeleteCourse,
} from '../firebase/academicRecords.js';

// Manages the school-wide course catalog for one user.
// Loads on mount; reload after every mutation so the list stays in sync.
// All Firestore I/O delegated to firebase/academicRecords.js — this hook
// only owns local state + orchestration.
//
// Returns:
//   courses        — Array<{ id, name, curriculum, gradingType }>, sorted by name
//   loading        — true during the initial load and any reload after a write
//   error          — string of the last failure, or null
//   addCourse      — async (data) => newId
//   updateCourse   — async (courseId, data) => void
//   removeCourse   — async (courseId) => void
export function useCourses(uid) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const reload = useCallback(async () => {
    if (!uid) {
      setCourses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fbGetCourses(uid);
      setCourses(rows);
    } catch (err) {
      setError(err?.message ?? 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { reload(); }, [reload]);

  const addCourse = useCallback(async (data) => {
    if (!uid) throw new Error('useCourses: uid is required');
    try {
      const id = await fbAddCourse(uid, data);
      await reload();
      return id;
    } catch (err) {
      setError(err?.message ?? 'Failed to add course');
      throw err;
    }
  }, [uid, reload]);

  const updateCourse = useCallback(async (courseId, data) => {
    if (!uid) throw new Error('useCourses: uid is required');
    try {
      await fbSaveCourse(uid, courseId, data);
      await reload();
    } catch (err) {
      setError(err?.message ?? 'Failed to update course');
      throw err;
    }
  }, [uid, reload]);

  const removeCourse = useCallback(async (courseId) => {
    if (!uid) return;
    try {
      await fbDeleteCourse(uid, courseId);
      await reload();
    } catch (err) {
      setError(err?.message ?? 'Failed to delete course');
      throw err;
    }
  }, [uid, reload]);

  return { courses, loading, error, addCourse, updateCourse, removeCourse };
}
