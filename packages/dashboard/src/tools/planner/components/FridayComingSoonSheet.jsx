import './FridayComingSoonSheet.css';

// Pre-confirm modal shown when a sick day is triggered and the current
// student has any non-allday lesson on Friday. Confirming here deletes
// Friday's lessons and then runs the normal sick day cascade; cancelling
// writes nothing to Firestore. Proper Friday handling ships with the
// month view.
//
// Props:
//   onConfirm — gold primary, deletes Friday + runs cascade
//   onDismiss — ghost Cancel, also the backdrop tap handler
export default function FridayComingSoonSheet({ onConfirm, onDismiss }) {
  return (
    <div className="fcs-overlay" onClick={onDismiss}>
      <div className="fcs-sheet" onClick={e => e.stopPropagation()}>
        <div className="fcs-handle" />

        <div className="fcs-header">
          <span className="fcs-title">Coming Soon</span>
        </div>

        <div className="fcs-body">
          <p className="fcs-msg">
            Friday's lessons will be deleted when this sick day is applied.
            A month view and improved sick day cascading is coming soon.
          </p>
        </div>

        <div className="fcs-footer">
          <button className="fcs-cancel" onClick={onDismiss}>Cancel</button>
          <button className="fcs-confirm" onClick={onConfirm}>Confirm Sick Day</button>
        </div>
      </div>
    </div>
  );
}
