import { useState, useEffect } from 'react';
import { useAuth } from '@homeschool/shared';
import { useCourses }         from '../tools/academic-records/hooks/useCourses.js';
import { useEnrollments }     from '../tools/academic-records/hooks/useEnrollments.js';
import { useSchoolYears }     from '../tools/academic-records/hooks/useSchoolYears.js';
import { useAcademicSummary } from '../tools/academic-records/hooks/useAcademicSummary.js';
import RecordsMainView        from '../tools/academic-records/components/RecordsMainView.jsx';
import CourseCatalogSheet     from '../tools/academic-records/components/CourseCatalogSheet.jsx';
import AddEditCourseSheet     from '../tools/academic-records/components/AddEditCourseSheet.jsx';
import EnrollmentSheet        from '../tools/academic-records/components/EnrollmentSheet.jsx';
import AddEditEnrollmentSheet from '../tools/academic-records/components/AddEditEnrollmentSheet.jsx';
import SchoolYearSheet        from '../tools/academic-records/components/SchoolYearSheet.jsx';
import AddEditSchoolYearSheet from '../tools/academic-records/components/AddEditSchoolYearSheet.jsx';
import './AcademicRecordsTab.css';

// Phase 2 entry point. Tab-level wiring lives here:
//   - 4 data hooks (catalog, enrollments, school years, summary)
//   - 3 sheet flows (catalog, enrollments, school years) with stacked editors
//   - main view JSX is in RecordsMainView.jsx (kept under the 300-line limit)
export default function AcademicRecordsTab() {
  const { user } = useAuth();
  const uid = user?.uid;

  const { courses, loading, error, addCourse, updateCourse, removeCourse } = useCourses(uid);
  const {
    enrollments, loading: enrollmentsLoading, error: enrollmentsError,
    addEnrollment, updateEnrollment, removeEnrollment,
  } = useEnrollments(uid, courses);
  const {
    schoolYears, loading: schoolYearsLoading, error: schoolYearsError,
    addSchoolYear, updateSchoolYear, removeSchoolYear,
    addQuarter, updateQuarter, removeQuarter,
  } = useSchoolYears(uid);

  const [selectedStudent, setSelectedStudent]     = useState('Orion');
  const [selectedQuarterId, setSelectedQuarterId] = useState(null);
  const summary = useAcademicSummary(uid, selectedStudent, schoolYears, enrollments, courses);

  // Sync selectedQuarterId once the summary resolves the active quarter.
  useEffect(() => {
    if (summary.activeQuarterId && selectedQuarterId == null) setSelectedQuarterId(summary.activeQuarterId);
  }, [summary.activeQuarterId, selectedQuarterId]);

  // Sheet state — course catalog
  const [catalogSheetOpen, setCatalogSheetOpen] = useState(false);
  const [addEditSheetOpen, setAddEditSheetOpen] = useState(false);
  const [editingCourse, setEditingCourse]       = useState(null);

  // Sheet state — enrollments
  const [enrollmentSheetOpen, setEnrollmentSheetOpen]               = useState(false);
  const [addEditEnrollmentSheetOpen, setAddEditEnrollmentSheetOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment]                   = useState(null);
  const [enrollingStudent, setEnrollingStudent]                     = useState(null);

  // Sheet state — school years
  const [schoolYearSheetOpen, setSchoolYearSheetOpen]               = useState(false);
  const [addEditSchoolYearSheetOpen, setAddEditSchoolYearSheetOpen] = useState(false);
  const [schoolYearSheetMode, setSchoolYearSheetMode]               = useState('schoolYear');
  const [editingSchoolYear, setEditingSchoolYear]                   = useState(null);
  const [editingQuarter, setEditingQuarter]                         = useState(null);
  const [activeYearId, setActiveYearId]                             = useState(null);

  // ─── Course handlers ───
  function closeCatalog()       { setCatalogSheetOpen(false); setAddEditSheetOpen(false); setEditingCourse(null); }
  function handleEditCourse(c)  { setEditingCourse(c); setAddEditSheetOpen(true); }
  function handleAddCourse()    { setEditingCourse(null); setAddEditSheetOpen(true); }
  function closeAddEdit()       { setAddEditSheetOpen(false); setEditingCourse(null); }
  async function handleSaveCourse(data) {
    if (!uid) { console.warn('AcademicRecordsTab: uid missing on save — course will not persist'); return; }
    if (editingCourse) await updateCourse(editingCourse.id, data); else await addCourse(data);
    closeAddEdit();
  }
  async function handleDeleteCourse() {
    if (!editingCourse) return;
    await removeCourse(editingCourse.id); closeAddEdit();
  }

  // ─── Enrollment handlers ───
  function closeEnrollments()           { setEnrollmentSheetOpen(false); setAddEditEnrollmentSheetOpen(false); setEditingEnrollment(null); setEnrollingStudent(null); }
  function handleEditEnrollment(e)      { setEditingEnrollment(e); setEnrollingStudent(e.student); setAddEditEnrollmentSheetOpen(true); }
  function handleAddEnrollment(student) { setEnrollingStudent(student); setEditingEnrollment(null); setAddEditEnrollmentSheetOpen(true); }
  function closeAddEditEnrollment()     { setAddEditEnrollmentSheetOpen(false); setEditingEnrollment(null); setEnrollingStudent(null); }
  async function handleSaveEnrollment(data) {
    if (!uid) { console.warn('AcademicRecordsTab: uid missing on save — enrollment will not persist'); return; }
    if (editingEnrollment) await updateEnrollment(editingEnrollment.id, data); else await addEnrollment(data);
    closeAddEditEnrollment();
  }
  async function handleDeleteEnrollment() {
    if (!editingEnrollment) return;
    await removeEnrollment(editingEnrollment.id); closeAddEditEnrollment();
  }

  // ─── School Year + Quarter handlers ───
  function closeSchoolYearSheets() {
    setSchoolYearSheetOpen(false); setAddEditSchoolYearSheetOpen(false);
    setEditingSchoolYear(null); setEditingQuarter(null); setActiveYearId(null);
  }
  function closeAddEditSchoolYear() {
    setAddEditSchoolYearSheetOpen(false);
    setEditingSchoolYear(null); setEditingQuarter(null); setActiveYearId(null);
  }
  function handleAddSchoolYear()   { setEditingSchoolYear(null); setSchoolYearSheetMode('schoolYear'); setAddEditSchoolYearSheetOpen(true); }
  function handleEditSchoolYear(y) { setEditingSchoolYear(y);    setSchoolYearSheetMode('schoolYear'); setAddEditSchoolYearSheetOpen(true); }
  function handleAddQuarter(yearId) {
    setActiveYearId(yearId); setEditingQuarter(null);
    setSchoolYearSheetMode('quarter'); setAddEditSchoolYearSheetOpen(true);
  }
  function handleEditQuarter({ quarter, yearId }) {
    setActiveYearId(yearId); setEditingQuarter({ quarter, yearId });
    setSchoolYearSheetMode('quarter'); setAddEditSchoolYearSheetOpen(true);
  }
  async function handleSaveSchoolYearOrQuarter(data) {
    if (!uid) { console.warn('AcademicRecordsTab: uid missing on save — entry will not persist'); return; }
    if (schoolYearSheetMode === 'schoolYear') {
      if (editingSchoolYear) await updateSchoolYear(editingSchoolYear.id, data); else await addSchoolYear(data);
    } else {
      if (editingQuarter) await updateQuarter(activeYearId, editingQuarter.quarter.id, data); else await addQuarter(activeYearId, data);
    }
    closeAddEditSchoolYear();
  }
  async function handleDeleteSchoolYearOrQuarter() {
    if (schoolYearSheetMode === 'schoolYear' && editingSchoolYear) await removeSchoolYear(editingSchoolYear.id);
    else if (schoolYearSheetMode === 'quarter' && editingQuarter)  await removeQuarter(activeYearId, editingQuarter.quarter.id);
    closeAddEditSchoolYear();
  }
  const editingItem = schoolYearSheetMode === 'schoolYear'
    ? editingSchoolYear
    : (editingQuarter ? editingQuarter.quarter : null);

  return (
    <div className="ar-tab">

      <RecordsMainView
        selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent}
        selectedQuarterId={selectedQuarterId} setSelectedQuarterId={setSelectedQuarterId}
        summary={summary} courses={courses}
        onCatalogOpen={() => setCatalogSheetOpen(true)}
        onEnrollmentsOpen={() => setEnrollmentSheetOpen(true)}
        onSchoolYearOpen={() => setSchoolYearSheetOpen(true)}
      />

      <CourseCatalogSheet
        open={catalogSheetOpen} onClose={closeCatalog}
        courses={courses} loading={loading} error={error}
        onEditCourse={handleEditCourse} onAddCourse={handleAddCourse}
      />
      <AddEditCourseSheet
        open={addEditSheetOpen} onClose={closeAddEdit}
        onSave={handleSaveCourse} onDelete={handleDeleteCourse}
        course={editingCourse} enrollments={enrollments}
      />
      <EnrollmentSheet
        open={enrollmentSheetOpen} onClose={closeEnrollments}
        enrollments={enrollments} courses={courses}
        loading={enrollmentsLoading} error={enrollmentsError}
        onEditEnrollment={handleEditEnrollment} onAddEnrollment={handleAddEnrollment}
      />
      <AddEditEnrollmentSheet
        open={addEditEnrollmentSheetOpen} onClose={closeAddEditEnrollment}
        onSave={handleSaveEnrollment} onDelete={handleDeleteEnrollment}
        student={enrollingStudent} courses={courses} enrollment={editingEnrollment}
      />
      <SchoolYearSheet
        open={schoolYearSheetOpen} onClose={closeSchoolYearSheets}
        schoolYears={schoolYears}
        loading={schoolYearsLoading} error={schoolYearsError}
        onEditSchoolYear={handleEditSchoolYear} onAddSchoolYear={handleAddSchoolYear}
        onEditQuarter={handleEditQuarter} onAddQuarter={handleAddQuarter}
      />
      <AddEditSchoolYearSheet
        open={addEditSchoolYearSheetOpen} onClose={closeAddEditSchoolYear}
        onSave={handleSaveSchoolYearOrQuarter} onDelete={handleDeleteSchoolYearOrQuarter}
        mode={schoolYearSheetMode} yearId={activeYearId} item={editingItem}
      />

    </div>
  );
}
