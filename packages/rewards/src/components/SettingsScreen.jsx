import { useState } from 'react';
import { signOut } from '@johnson-web-tools/shared';
import { saveStudents } from '../firebase/settings.js';
import './SettingsScreen.css';

export default function SettingsScreen({ uid, students, onClose }) {
  const [newName, setNewName] = useState('');

  async function addStudent() {
    const name = newName.trim();
    if (!name || students.includes(name)) return;
    await saveStudents(uid, [...students, name]);
    setNewName('');
  }

  async function removeStudent(name) {
    await saveStudents(uid, students.filter(s => s !== name));
  }

  function handleInputKey(e) {
    if (e.key === 'Enter') addStudent();
  }

  return (
    <div className="ss-page">
      <header className="ss-header">
        <button className="ss-back-btn" onClick={onClose} aria-label="Back">←</button>
        <h1 className="ss-title">Settings</h1>
        <div className="ss-back-spacer" />
      </header>

      <div className="ss-body">
        <section className="ss-section">
          <h2 className="ss-section-label">Students</h2>
          <div className="ss-card">
            {students.length === 0 ? (
              <p className="ss-empty">No students yet</p>
            ) : (
              <ul className="ss-list">
                {students.map(name => (
                  <li key={name} className="ss-row">
                    <span className="ss-row-name">{name}</span>
                    <button
                      className="ss-delete-btn"
                      onClick={() => removeStudent(name)}
                      aria-label={`Delete ${name}`}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="ss-add-row">
              <input
                className="ss-input"
                type="text"
                placeholder="Student name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleInputKey}
              />
              <button className="ss-add-btn" onClick={addStudent}>Add</button>
            </div>
          </div>
        </section>

        <div className="ss-signout-wrap">
          <button className="ss-signout-btn" onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
