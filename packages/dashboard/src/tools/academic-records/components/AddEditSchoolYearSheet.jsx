import { useState, useEffect } from 'react';
import './AddEditSchoolYearSheet.css';

// Stacked bottom sheet for adding/editing a school year OR a quarter.
// Stacks ABOVE SchoolYearSheet (overlay z-index 310 vs list 300).
//
// One sheet handles both modes — the form fields are identical (label +
// startDate + endDate); only labels and helper copy change. Mode is
// dictated by the `mode` prop and the parent owns the wiring.
//
// Props:
//   open        — boolean
//   onClose     — () => void
//   onSave      — (data) => void with { label, startDate, endDate }
//   onDelete    — () => void, called after inline confirm in Edit mode
//   mode        — 'schoolYear' | 'quarter' | 'break'
//   yearId      — string | null (required when mode is 'quarter', purely
//                 informational here — caller uses it to route the save)
//   item        — null in Add mode; { label, startDate, endDate } in Edit

const TITLES = {
  schoolYear: { add: 'Add School Year', edit: 'Edit School Year' },
  quarter:    { add: 'Add Quarter',     edit: 'Edit Quarter'     },
  break:      { add: 'Add Break',       edit: 'Edit Break'       },
};

const LABELS = {
  schoolYear: { field: 'School year', placeholder: 'e.g. 2025–2026'    },
  quarter:    { field: 'Quarter',     placeholder: 'e.g. Q1'           },
  break:      { field: 'Break name',  placeholder: 'e.g. Christmas Break' },
};

export default function AddEditSchoolYearSheet({
  open, onClose, onSave, onDelete, mode = 'schoolYear', item,
}) {
  const isEdit = item != null;

  const [label, setLabel]                 = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed every time the sheet opens, mode flips, or the target item changes.
  useEffect(() => {
    if (!open) return;
    setLabel(item?.label ?? '');
    setStartDate(item?.startDate ?? '');
    setEndDate(item?.endDate ?? '');
    setConfirmDelete(false);
  }, [open, mode, item]);

  if (!open) return null;

  const trimmedLabel = label.trim();
  const canSave      = trimmedLabel.length > 0;
  const titles       = TITLES[mode] ?? TITLES.schoolYear;
  const labels       = LABELS[mode] ?? LABELS.schoolYear;
  const removeNoun   = mode === 'quarter' ? 'quarter' : mode === 'break' ? 'break' : 'school year';

  function handleSave() {
    if (!canSave) return;
    onSave({ label: trimmedLabel, startDate, endDate });
  }

  return (
    <div className="asy-sheet-overlay" onClick={onClose}>
      <div className="asy-sheet" onClick={e => e.stopPropagation()}>

        <div className="asy-sheet-handle" aria-hidden="true" />

        <header className="asy-sheet-header">
          <h2 className="asy-sheet-title">{isEdit ? titles.edit : titles.add}</h2>
          <button className="asy-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="asy-sheet-body">

          <label className="asy-field">
            <span className="asy-label">{labels.field}</span>
            <input
              className="asy-input"
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={labels.placeholder}
              autoFocus
            />
          </label>

          <label className="asy-field">
            <span className="asy-label">Start date</span>
            <input
              className="asy-input"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </label>

          <label className="asy-field">
            <span className="asy-label">End date</span>
            <input
              className="asy-input"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </label>

          {isEdit && !confirmDelete && (
            <button className="asy-delete-btn" onClick={() => setConfirmDelete(true)}>
              Remove {removeNoun === 'quarter' ? 'Quarter' : removeNoun === 'break' ? 'Break' : 'School Year'}
            </button>
          )}
          {isEdit && confirmDelete && (
            <div className="asy-confirm">
              <p className="asy-confirm-msg">
                Remove this {removeNoun}? This cannot be undone.
              </p>
              <div className="asy-confirm-actions">
                <button className="asy-confirm-cancel" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button className="asy-confirm-yes" onClick={onDelete}>
                  Confirm
                </button>
              </div>
            </div>
          )}

        </div>

        <footer className="asy-sheet-footer">
          <button className="asy-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="asy-save-btn" onClick={handleSave} disabled={!canSave}>
            Save
          </button>
        </footer>

      </div>
    </div>
  );
}
