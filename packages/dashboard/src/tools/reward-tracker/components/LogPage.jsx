import { useState, useEffect } from 'react';
import { subscribeLog } from '../firebase/rewardTracker.js';
import RewardHeader from './RewardHeader.jsx';
import './LogPage.css';

const AVATARS = { Orion: '😎', Malachi: '🐼' };
const TYPE_ICON = { award: '🏆', deduct: '➖', spend: '🎁' };

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Props: uid (string), student (string), balance (number), onBack (fn), mode, onToggleDark
export default function LogPage({ uid, student, balance, onBack, mode, onToggleDark }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    return subscribeLog(uid, student, setEntries);
  }, [uid, student]);

  return (
    <div className="log-page">
      <RewardHeader onBack={onBack} mode={mode} onToggleDark={onToggleDark} />

      <div className="log-body">
        <div className="log-student-bar">
          <span className="log-avatar">{AVATARS[student]}</span>
          <div className="log-student-info">
            <span className="log-student-name">{student}</span>
            <span className="log-student-balance">{balance} pts</span>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="log-empty">
            <p className="log-empty-icon">📋</p>
            <p className="log-empty-text">No activity yet</p>
          </div>
        ) : (
          <ul className="log-list">
            {entries.map(entry => (
              <li key={entry.id} className="log-entry">
                <span className="log-entry-icon">{TYPE_ICON[entry.type]}</span>
                <div className="log-entry-body">
                  {entry.note ? (
                    <p className="log-entry-note">{entry.note}</p>
                  ) : (
                    <p className="log-entry-note log-entry-note--empty">
                      {entry.type === 'award' ? 'Award' : entry.type === 'spend' ? 'Reward' : 'Deduction'}
                    </p>
                  )}
                  <p className="log-entry-date">{formatDate(entry.createdAt)}</p>
                </div>
                <span className={`log-entry-pts log-entry-pts--${entry.type}`}>
                  {entry.type === 'award' ? '+' : '−'}{entry.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
