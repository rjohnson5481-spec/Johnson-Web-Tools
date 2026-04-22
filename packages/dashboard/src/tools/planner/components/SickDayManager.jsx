import SickDaySheet from './SickDaySheet.jsx';
import UndoSickSheet from './UndoSickSheet.jsx';
import FridayComingSoonSheet from './FridayComingSoonSheet.jsx';
import { DAY_NAMES } from '../constants/days.js';

// Renders the three sick-day-flow sheets: SickDaySheet (day picker / subject
// picker), UndoSickSheet (confirm undo), and FridayComingSoonSheet (pre-confirm
// Friday overflow interstitial). Pure rendering — no state, no Firestore, no
// effects. Every prop flows through from PlannerLayout (useSickDay +
// usePlannerUI) so the split keeps PlannerLayout under the 250-line target.
export default function SickDayManager({
  subjects, dayData, day, weekDates, loadWeekDataFrom,
  showSickDay, setShowSickDay,
  showUndoSickDay, setShowUndoSickDay,
  showFridayComingSoon,
  handleSickDayConfirm, handleUndoSickDay,
  handleFridayComingSoonConfirm, handleFridayComingSoonDismiss,
}) {
  return (
    <>
      {showSickDay && (
        <SickDaySheet
          subjects={subjects} dayData={dayData} dayName={DAY_NAMES[day]} day={day}
          weekDates={weekDates} loadWeekDataFrom={loadWeekDataFrom}
          onConfirm={handleSickDayConfirm} onClose={() => setShowSickDay(false)}
        />
      )}

      {showUndoSickDay && (
        <UndoSickSheet
          day={day} onConfirm={handleUndoSickDay}
          onClose={() => setShowUndoSickDay(false)}
        />
      )}

      {showFridayComingSoon && (
        <FridayComingSoonSheet
          onConfirm={handleFridayComingSoonConfirm}
          onDismiss={handleFridayComingSoonDismiss}
        />
      )}
    </>
  );
}
