import { useState } from 'react';
import { useAuth } from '@homeschool/shared';
import SignIn              from './components/SignIn';
import BottomNav           from './components/BottomNav';
import HomeTab             from './tabs/HomeTab';
import PlannerTab          from './tabs/PlannerTab';
import RewardsTab          from './tabs/RewardsTab';
import AcademicRecordsTab  from './tabs/AcademicRecordsTab';
import { useSettings }     from './tools/planner/hooks/useSettings.js';
import { useDarkMode }     from './hooks/useDarkMode.js';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  // Planner student is lifted here so the desktop sidebar can show a
  // student selector when the planner tab is active. Mobile planner
  // header still uses these same props — behavior is unchanged.
  const [plannerStudent, setPlannerStudent] = useState('Orion');
  const { students, subjectsByStudent } = useSettings(user?.uid, plannerStudent);
  // Dark-mode toggle is exposed through the desktop sidebar so every
  // tab (including Home, which has no visible header on desktop) can
  // flip modes. The hook writes to `localStorage.color-mode` and the
  // <html data-mode> attribute, so it stays in sync with every other
  // tool's useDarkMode subscriber.
  const { mode: colorMode, toggle: toggleDarkMode } = useDarkMode();

  if (loading) return null;
  if (!user)   return <SignIn />;

  return (
    <div className="app-shell">
      <div className="shell-content">
        {activeTab === 'home'     && <HomeTab onTabChange={setActiveTab} />}
        {activeTab === 'planner'  && (
          <PlannerTab
            student={plannerStudent}
            setStudent={setPlannerStudent}
            students={students}
            subjectsByStudent={subjectsByStudent}
          />
        )}
        {activeTab === 'rewards'  && <RewardsTab />}
        {activeTab === 'academic' && <AcademicRecordsTab />}
      </div>
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        students={students}
        activeStudent={plannerStudent}
        onStudentChange={setPlannerStudent}
        colorMode={colorMode}
        onToggleDarkMode={toggleDarkMode}
      />
    </div>
  );
}
