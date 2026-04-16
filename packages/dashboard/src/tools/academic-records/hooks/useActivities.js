import { useState, useEffect, useCallback } from 'react';
import {
  getActivities as fbGet,
  addActivity as fbAdd,
  saveActivity as fbSave,
  deleteActivity as fbDelete,
} from '../firebase/academicRecordsActivities.js';

export function useActivities(uid) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const reload = useCallback(async () => {
    if (!uid) { setActivities([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setActivities(await fbGet(uid)); }
    catch (err) { setError(err?.message ?? 'Failed to load activities'); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { reload(); }, [reload]);

  const addActivity = useCallback(async (data) => {
    if (!uid) throw new Error('useActivities: uid is required');
    try { const id = await fbAdd(uid, data); await reload(); return id; }
    catch (err) { setError(err?.message ?? 'Failed to add activity'); throw err; }
  }, [uid, reload]);

  const updateActivity = useCallback(async (activityId, data) => {
    if (!uid) throw new Error('useActivities: uid is required');
    try { await fbSave(uid, activityId, data); await reload(); }
    catch (err) { setError(err?.message ?? 'Failed to update activity'); throw err; }
  }, [uid, reload]);

  const removeActivity = useCallback(async (activityId) => {
    if (!uid) throw new Error('useActivities: uid is required');
    try { await fbDelete(uid, activityId); await reload(); }
    catch (err) { setError(err?.message ?? 'Failed to delete activity'); throw err; }
  }, [uid, reload]);

  return { activities, loading, error, addActivity, updateActivity, removeActivity };
}
