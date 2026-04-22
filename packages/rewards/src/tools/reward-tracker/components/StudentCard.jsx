import './StudentCard.css';

const AVATARS = { Orion: '😎', Malachi: '🐼' };

// 15 pts = $1.00 — floor to penny (not dollar)
function cashValue(pts) {
  return (Math.floor(pts / 15 * 100) / 100).toFixed(2);
}

// Next multiple of 15 strictly above current pts
function nextDollar(pts) {
  return Math.floor(pts / 15) * 15 + 15;
}

// Props: student, balance (number), onAward, onDeduct, onSpend, onLog
export default function StudentCard({ student, balance, onAward, onDeduct, onSpend, onLog }) {
  return (
    <div className="sc-card">
      <div className="sc-gold-bar" />

      <div className="sc-identity">
        <div className="sc-avatar">{AVATARS[student]}</div>
        <div className="sc-name-block">
          <h2 className="sc-name">{student}</h2>
          <p className="sc-cash">${cashValue(balance)} cash value</p>
        </div>
      </div>

      <div className="sc-points-block">
        <span className="sc-points">{balance}</span>
        <p className="sc-points-label">
          points · next $1 at {nextDollar(balance)} pts
        </p>
      </div>

      <div className="sc-actions">
        <button className="sc-btn sc-btn--award"  onClick={onAward}>Award</button>
        <button className="sc-btn sc-btn--deduct" onClick={onDeduct}>Deduct</button>
        <button className="sc-btn sc-btn--spend"  onClick={onSpend}>Spend</button>
        <button className="sc-btn sc-btn--log"    onClick={onLog}>Log</button>
      </div>
    </div>
  );
}
