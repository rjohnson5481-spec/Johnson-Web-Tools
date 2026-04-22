import { doc, setDoc } from 'firebase/firestore';
import { db } from '@johnson-web-tools/shared';

const studentsDocPath = (uid) => `users/${uid}/settings/students`;

export function saveStudents(uid, names) {
  return setDoc(doc(db, studentsDocPath(uid)), { names }, { merge: true });
}
