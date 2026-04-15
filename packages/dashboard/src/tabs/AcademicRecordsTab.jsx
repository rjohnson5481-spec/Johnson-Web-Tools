import { useState } from 'react';
import { useAuth } from '@homeschool/shared';
import { useCourses } from '../tools/academic-records/hooks/useCourses.js';
import { useEnrollments } from '../tools/academic-records/hooks/useEnrollments.js';
import CourseCatalogSheet     from '../tools/academic-records/components/CourseCatalogSheet.jsx';
import AddEditCourseSheet     from '../tools/academic-records/components/AddEditCourseSheet.jsx';
import EnrollmentSheet        from '../tools/academic-records/components/EnrollmentSheet.jsx';
import AddEditEnrollmentSheet from '../tools/academic-records/components/AddEditEnrollmentSheet.jsx';
import './AcademicRecordsTab.css';

// Phase 2 entry point. Two flows wired this session:
//   - Course Catalog (z-index 300 list / 310 editor)
//   - Enrollments    (z-index 300 list / 310 editor — same level; never both
//                     list sheets open at once)
// Other quick actions are still placeholders.
export default function AcademicRecordsTab() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Course catalog state
  const { courses, loading, error, addCourse, updateCourse, removeCourse } = useCourses(uid);

  // Enrollment state — pass courses so the hook can look up names for the
  // optional planner-sync write to /users/{uid}/subjectPresets/{student}.
  const {
    enrollments,
    loading: enrollmentsLoading,
    error:   enrollmentsError,
    addEnrollment, updateEnrollment, removeEnrollment,
  } = useEnrollments(uid, courses);

  // Course catalog sheet state
  const [catalogSheetOpen, setCatalogSheetOpen] = useState(false);
  const [addEditSheetOpen, setAddEditSheetOpen] = useState(false);
  const [editingCourse, setEditingCourse]       = useState(null);

  // Enrollment sheet state
  const [enrollmentSheetOpen, setEnrollmentSheetOpen]               = useState(false);
  const [addEditEnrollmentSheetOpen, setAddEditEnrollmentSheetOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment]                   = useState(null);
  const [enrollingStudent, setEnrollingStudent]                     = useState(null);

  // ─── Course catalog handlers ───
  function openCatalog()  { setCatalogSheetOpen(true); }
  function closeCatalog() {
    setCatalogSheetOpen(false);
    setAddEditSheetOpen(false);
    setEditingCourse(null);
  }

  function handleEditCourse(course) {
    setEditingCourse(course);
    setAddEditSheetOpen(true);
  }
  function handleAddCourse() {
    setEditingCourse(null);
    setAddEditSheetOpen(true);
  }
  function closeAddEdit() {
    setAddEditSheetOpen(false);
    setEditingCourse(null);
  }

  async function handleSaveCourse(data) {
    if (!uid) {
      console.warn('AcademicRecordsTab: uid missing on save — course will not persist');
      return;
    }
    if (editingCourse) await updateCourse(editingCourse.id, data);
    else               await addCourse(data);
    closeAddEdit();
  }

  async function handleDeleteCourse() {
    if (!editingCourse) return;
    await removeCourse(editingCourse.id);
    closeAddEdit();
  }

  // ─── Enrollment handlers ───
  function openEnrollments()  { setEnrollmentSheetOpen(true); }
  function closeEnrollments() {
    setEnrollmentSheetOpen(false);
    setAddEditEnrollmentSheetOpen(false);
    setEditingEnrollment(null);
    setEnrollingStudent(null);
  }

  function handleEditEnrollment(enrollment) {
    setEditingEnrollment(enrollment);
    setEnrollingStudent(enrollment.student);
    setAddEditEnrollmentSheetOpen(true);
  }
  function handleAddEnrollment(student) {
    setEnrollingStudent(student);
    setEditingEnrollment(null);
    setAddEditEnrollmentSheetOpen(true);
  }
  function closeAddEditEnrollment() {
    setAddEditEnrollmentSheetOpen(false);
    setEditingEnrollment(null);
    setEnrollingStudent(null);
  }

  async function handleSaveEnrollment(data) {
    if (!uid) {
      console.warn('AcademicRecordsTab: uid missing on save — enrollment will not persist');
      return;
    }
    if (editingEnrollment) await updateEnrollment(editingEnrollment.id, data);
    else                   await addEnrollment(data);
    closeAddEditEnrollment();
  }

  async function handleDeleteEnrollment() {
    if (!editingEnrollment) return;
    await removeEnrollment(editingEnrollment.id);
    closeAddEditEnrollment();
  }

  return (
    <div className="ar-tab">

      <header className="ar-header">
        <h1 className="ar-title">Academic Records</h1>
        <p className="ar-subtitle">2025–2026</p>
      </header>

      <section className="ar-section">
        <p className="ar-section-label"><span>Quick Actions</span></p>

        <div className="ar-actions">
          <button className="ar-action" onClick={openCatalog}>
            <span className="ar-action-icon" aria-hidden="true">📚</span>
            <span className="ar-action-label">Manage Course Catalog</span>
            <span className="ar-action-chevron" aria-hidden="true">›</span>
          </button>

          <button className="ar-action" onClick={openEnrollments}>
            <span className="ar-action-icon" aria-hidden="true">👤</span>
            <span className="ar-action-label">Manage Enrollments</span>
            <span className="ar-action-chevron" aria-hidden="true">›</span>
          </button>

          <button className="ar-action ar-action--disabled" disabled>
            <span className="ar-action-icon" aria-hidden="true">📥</span>
            <span className="ar-action-label">Import Curriculum Data</span>
            <span className="ar-action-soon">Soon</span>
          </button>

          <button className="ar-action ar-action--disabled" disabled>
            <span className="ar-action-icon" aria-hidden="true">🗓️</span>
            <span className="ar-action-label">Manage School Year &amp; Quarters</span>
            <span className="ar-action-soon">Soon</span>
          </button>

          <button className="ar-action ar-action--disabled" disabled>
            <span className="ar-action-icon" aria-hidden="true">📄</span>
            <span className="ar-action-label">Generate Report Card</span>
            <span className="ar-action-soon">Soon</span>
          </button>
        </div>
      </section>

      <CourseCatalogSheet
        open={catalogSheetOpen}
        onClose={closeCatalog}
        courses={courses}
        loading={loading}
        error={error}
        onEditCourse={handleEditCourse}
        onAddCourse={handleAddCourse}
      />

      <AddEditCourseSheet
        open={addEditSheetOpen}
        onClose={closeAddEdit}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
        course={editingCourse}
      />

      <EnrollmentSheet
        open={enrollmentSheetOpen}
        onClose={closeEnrollments}
        enrollments={enrollments}
        courses={courses}
        loading={enrollmentsLoading}
        error={enrollmentsError}
        onEditEnrollment={handleEditEnrollment}
        onAddEnrollment={handleAddEnrollment}
      />

      <AddEditEnrollmentSheet
        open={addEditEnrollmentSheetOpen}
        onClose={closeAddEditEnrollment}
        onSave={handleSaveEnrollment}
        onDelete={handleDeleteEnrollment}
        student={enrollingStudent}
        courses={courses}
        enrollment={editingEnrollment}
      />

    </div>
  );
}
