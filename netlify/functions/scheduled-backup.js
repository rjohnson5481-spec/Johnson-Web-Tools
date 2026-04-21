const { schedule } = require('@netlify/functions');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStore } = require('@netlify/blobs');

function getDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

async function readCol(db, path) {
  const snap = await db.collection(path).get();
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}

async function readDoc(db, path) {
  const snap = await db.doc(path).get();
  return snap.exists ? snap.data() : null;
}

async function discoverUids(db) {
  const uids = new Set();
  const groups = ['subjects', 'sickDays', 'courses', 'enrollments', 'grades',
    'schoolYears', 'activities', 'savedReports', 'reportNotes', 'subjectPresets'];
  for (const group of groups) {
    try {
      const snap = await db.collectionGroup(group).limit(500).get();
      snap.docs.forEach(d => {
        const parts = d.ref.path.split('/');
        if (parts[0] === 'users' && parts[1]) uids.add(parts[1]);
      });
    } catch { /* collection group may not exist */ }
  }
  return uids;
}

async function readUserData(db, uid) {
  const base = `users/${uid}`;
  const students = await readDoc(db, `${base}/settings/students`);
  const subjectPresets = await readCol(db, `${base}/subjectPresets`);
  const sickDays = await readCol(db, `${base}/sickDays`);
  const courses = await readCol(db, `${base}/courses`);
  const enrollments = await readCol(db, `${base}/enrollments`);
  const grades = await readCol(db, `${base}/grades`);
  const reportNotes = await readCol(db, `${base}/reportNotes`);
  const activities = await readCol(db, `${base}/activities`);
  const savedReports = await readCol(db, `${base}/savedReports`);

  const schoolYearsRaw = await readCol(db, `${base}/schoolYears`);
  const schoolYears = [];
  for (const y of schoolYearsRaw) {
    const quarters = await readCol(db, `${base}/schoolYears/${y._id}/quarters`);
    const breaks = await readCol(db, `${base}/schoolYears/${y._id}/breaks`);
    schoolYears.push({ ...y, quarters, breaks });
  }

  const rewardTracker = await readCol(db, `${base}/rewardTracker`);
  const rewardTrackerLog = [];
  for (const rt of rewardTracker) {
    const logs = await readCol(db, `${base}/rewardTracker/${rt._id}/log`);
    logs.forEach(l => rewardTrackerLog.push({ _student: rt._id, ...l }));
  }

  const weeks = [];
  const studentNames = students?.names ?? [];
  try {
    const subjectsSnap = await db.collectionGroup('subjects').get();
    for (const subDoc of subjectsSnap.docs) {
      const path = subDoc.ref.path;
      if (!path.startsWith(`users/${uid}/weeks/`)) continue;
      const parts = path.split('/');
      weeks.push({
        weekId: parts[3], student: parts[5], dayIndex: Number(parts[7]),
        subject: parts[9], ...subDoc.data(),
      });
    }
  } catch { /* no weeks data */ }

  return {
    exportedAt: new Date().toISOString(), version: '1', uid,
    data: { students, subjectPresets, weeks, sickDays, rewardTracker, rewardTrackerLog,
      schoolYears, courses, enrollments, grades, reportNotes, activities, savedReports },
  };
}

exports.handler = schedule('0 */6 * * *', async () => {
  try {
    const db = getDb();
    const uids = await discoverUids(db);
    console.log('Backup starting — Users:', uids.size);

    const users = [];
    for (const uid of uids) {
      const userData = await readUserData(db, uid);
      users.push(userData);
    }

    const backup = { backupAt: new Date().toISOString(), version: '1', users };
    const store = getStore({
      name: 'backups',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN,
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backup-${timestamp}.json`;
    await store.set(key, JSON.stringify(backup, null, 2));

    console.log('Backup complete:', key, 'Users:', uids.size);
    return { statusCode: 200 };
  } catch (err) {
    console.error('Backup failed:', err);
    return { statusCode: 500 };
  }
});
