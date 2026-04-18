import { DAY_SHORT, mondayWeekId } from '../constants/days.js';
import './ImportDiffPreview.css';

function formatDayDate(weekId, dayIndex) {
  const [y, mo, d] = weekId.split('-').map(Number);
  return new Date(y, mo - 1, d + dayIndex).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const BADGE = { new: 'idp-badge--new', changed: 'idp-badge--changed', unchanged: 'idp-badge--unchanged' };
const LABEL = { new: 'NEW', changed: 'CHANGED', unchanged: 'UNCHANGED' };

export default function ImportDiffPreview({ diff, student, weekId, onCancel, onConfirm }) {
  const safeWeekId = mondayWeekId(weekId);
  const newCount = diff.filter(d => d.status === 'new').length;
  const changedCount = diff.filter(d => d.status === 'changed').length;
  const unchangedCount = diff.filter(d => d.status === 'unchanged').length;

  const byDay = {};
  diff.forEach(d => { (byDay[d.dayIndex] ??= []).push(d); });
  const daysWithChanges = Object.entries(byDay).filter(([, items]) => items.some(i => i.status !== 'unchanged'));
  const hiddenUnchanged = unchangedCount - daysWithChanges.reduce((n, [, items]) => n + items.filter(i => i.status === 'unchanged').length, 0);

  return (
    <div className="idp-wrap">
      <p className="idp-title">Review Changes</p>
      <p className="idp-meta">{student} · Week of {formatDayDate(safeWeekId, 0)}</p>
      <div className="idp-list">
        {daysWithChanges.map(([di, items]) => (
          <div key={di} className="idp-day">
            <div className="idp-day-header">{DAY_SHORT[Number(di)]} · {formatDayDate(safeWeekId, Number(di))}</div>
            {items.map((item, i) => (
              <div key={i} className={`idp-row${item.status === 'unchanged' ? ' idp-row--muted' : ''}`}>
                <span className={`idp-badge ${BADGE[item.status]}`}>{LABEL[item.status]}</span>
                <span className="idp-subject">{item.subject}</span>
                {item.lesson && <span className="idp-lesson">{item.lesson}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {hiddenUnchanged > 0 && <p className="idp-hidden">{hiddenUnchanged} unchanged cell{hiddenUnchanged !== 1 ? 's' : ''} hidden</p>}
      <p className="idp-footer">{newCount} new · {changedCount} changed · {unchangedCount} unchanged</p>
      <div className="idp-actions">
        <button className="idp-cancel" onClick={onCancel}>Cancel</button>
        <button className="idp-confirm" onClick={onConfirm} disabled={newCount + changedCount === 0}>Confirm Import</button>
      </div>
    </div>
  );
}
