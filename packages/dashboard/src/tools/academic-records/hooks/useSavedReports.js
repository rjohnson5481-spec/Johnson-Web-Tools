import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@homeschool/shared';
import {
  getSavedReports as fbGetSavedReports,
  saveSavedReport as fbSaveSavedReport,
  deleteSavedReport as fbDeleteSavedReport,
  uploadReportPDF as fbUploadPDF,
  deleteReportPDF as fbDeletePDF,
} from '../firebase/academicRecords.js';
import { savedReportDoc } from '../constants/academics.js';

export function useSavedReports(uid) {
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const reload = useCallback(async () => {
    if (!uid) { setSavedReports([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setSavedReports(await fbGetSavedReports(uid)); }
    catch (err) { setError(err?.message ?? 'Failed to load saved reports'); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { reload(); }, [reload]);

  const saveReport = useCallback(async (data, pdfBytes) => {
    if (!uid) throw new Error('useSavedReports: uid is required');
    try {
      const id = await fbSaveSavedReport(uid, data);
      if (pdfBytes) {
        const storageUrl = await fbUploadPDF(uid, id, pdfBytes);
        await setDoc(doc(db, savedReportDoc(uid, id)), { storageUrl }, { merge: true });
      }
      await reload();
      return id;
    } catch (err) { setError(err?.message ?? 'Failed to save report'); throw err; }
  }, [uid, reload]);

  const removeReport = useCallback(async (reportId) => {
    if (!uid) throw new Error('useSavedReports: uid is required');
    try {
      await fbDeletePDF(uid, reportId);
      await fbDeleteSavedReport(uid, reportId);
      await reload();
    } catch (err) { setError(err?.message ?? 'Failed to delete report'); throw err; }
  }, [uid, reload]);

  return { savedReports, loading, error, saveReport, removeReport };
}
