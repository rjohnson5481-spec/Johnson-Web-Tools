import { useState } from 'react';
import { useAuth } from '@homeschool/shared';
import { useCourses } from '../tools/academic-records/hooks/useCourses.js';
import CourseCatalogSheet from '../tools/academic-records/components/CourseCatalogSheet.jsx';
import AddEditCourseSheet from '../tools/academic-records/components/AddEditCourseSheet.jsx';
import './AcademicRecordsTab.css';

// Phase 2 entry point. Only the Course Catalog flow is wired this session;
// other quick actions are placeholders. The two sheets stack — catalog at
// z-index 300, AddEditCourseSheet at 310 — so editing a course visually
// returns to the catalog when the editor is dismissed.
export default function AcademicRecordsTab() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { addCourse, updateCourse, removeCourse } = useCourses(uid);

  const [catalogSheetOpen, setCatalogSheetOpen] = useState(false);
  const [addEditSheetOpen, setAddEditSheetOpen] = useState(false);
  const [editingCourse, setEditingCourse]       = useState(null);

  function openCatalog()   { setCatalogSheetOpen(true); }
  function closeCatalog()  {
    // Closing catalog dismisses both — editor doesn't make sense without it.
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
    // Catalog stays open behind.
    setAddEditSheetOpen(false);
    setEditingCourse(null);
  }

  async function handleSaveCourse(data) {
    // Permanent guard: if uid is unresolved, fail loudly rather than letting
    // the hook's throw bubble up as an opaque "useCourses: uid is required".
    if (!uid) {
      console.warn('AcademicRecordsTab: uid missing on save — course will not persist');
      return;
    }
    if (editingCourse) {
      await updateCourse(editingCourse.id, data);
    } else {
      await addCourse(data);
    }
    closeAddEdit();
  }

  async function handleDeleteCourse() {
    if (!editingCourse) return;
    await removeCourse(editingCourse.id);
    // Editor closes; catalog reloads via useCourses' reload-after-write.
    closeAddEdit();
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

          <button className="ar-action ar-action--disabled" disabled>
            <span className="ar-action-icon" aria-hidden="true">👤</span>
            <span className="ar-action-label">Manage Enrollments</span>
            <span className="ar-action-soon">Soon</span>
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
        uid={uid}
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

    </div>
  );
}
