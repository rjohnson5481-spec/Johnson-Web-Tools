import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const W = 612, H = 792, M = 40;
const INK = rgb(0.133, 0.145, 0.180);
const GOLD = rgb(0.788, 0.659, 0.298);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.45, 0.45, 0.45);
const LTGRAY = rgb(0.94, 0.93, 0.91);

const GRADE_COLORS = {
  A: rgb(0.084, 0.396, 0.753), B: rgb(0.180, 0.490, 0.196),
  C: rgb(0.902, 0.318, 0), D: rgb(0.482, 0.122, 0.635), F: rgb(0.753, 0.224, 0.169),
  E: rgb(0.084, 0.396, 0.753), S: rgb(0.180, 0.490, 0.196),
  N: rgb(0.902, 0.318, 0), U: rgb(0.753, 0.224, 0.169),
};

function todayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function generateReportCardPDF(config) {
  const {
    student, gradeLevel, periodLabel, yearLabel, isAnnual,
    studentEnrollments, courseById, grades, quarters,
    attendanceDays, includeGrades, includeAttendance, includeNotes, includeSignature, notes,
  } = config;

  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const fontR = await doc.embedFont(StandardFonts.Helvetica);
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontI = await doc.embedFont(StandardFonts.HelveticaOblique);
  let y = H;

  // Header block
  page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: INK });
  y = H - 28;
  const title = 'IRON & LIGHT JOHNSON ACADEMY';
  page.drawText(title, { x: (W - fontB.widthOfTextAtSize(title, 14)) / 2, y, font: fontB, size: 14, color: WHITE });
  y -= 14;
  const tag = 'Faith · Knowledge · Strength';
  page.drawText(tag, { x: (W - fontR.widthOfTextAtSize(tag, 9)) / 2, y, font: fontR, size: 9, color: rgb(1, 1, 1) });
  const rc = 'Report Card';
  page.drawText(rc, { x: W - M - fontB.widthOfTextAtSize(rc, 11), y: H - 28, font: fontB, size: 11, color: GOLD });
  page.drawText(periodLabel, { x: W - M - fontR.widthOfTextAtSize(periodLabel, 9), y: H - 42, font: fontR, size: 9, color: GOLD });

  // Student bar
  y = H - 80;
  page.drawRectangle({ x: 0, y: y - 40, width: W, height: 40, color: LTGRAY });
  page.drawText(student, { x: M, y: y - 18, font: fontB, size: 13, color: INK });
  const sub = `Grade ${gradeLevel ?? '—'} · ${yearLabel}`;
  page.drawText(sub, { x: M, y: y - 32, font: fontR, size: 10, color: GRAY });
  const issued = `Issued: ${todayStr()}`;
  page.drawText(issued, { x: W - M - fontR.widthOfTextAtSize(issued, 10), y: y - 24, font: fontR, size: 10, color: GRAY });
  y -= 52;

  // Grades section
  if (includeGrades && studentEnrollments.length > 0) {
    page.drawText('ACADEMIC PERFORMANCE', { x: M, y, font: fontB, size: 8, color: GRAY });
    y -= 14;
    if (isAnnual) {
      const cols = ['Course', 'Curriculum', ...(quarters ?? []).map(q => q.label)];
      const colX = [M, M + 180, ...quarters.map((_, i) => M + 300 + i * 60)];
      cols.forEach((c, i) => page.drawText(c, { x: colX[i], y, font: fontB, size: 8, color: GRAY }));
      page.drawLine({ start: { x: M, y: y - 4 }, end: { x: W - M, y: y - 4 }, thickness: 0.5, color: LTGRAY });
      y -= 18;
      studentEnrollments.forEach((enr, ri) => {
        const c = courseById.get(enr.courseId);
        if (ri % 2 === 1) page.drawRectangle({ x: M - 4, y: y - 4, width: W - 2 * M + 8, height: 18, color: LTGRAY });
        page.drawText(c?.name ?? '—', { x: colX[0], y, font: fontR, size: 10, color: INK });
        page.drawText(c?.curriculum ?? '—', { x: colX[1], y, font: fontR, size: 10, color: GRAY });
        (quarters ?? []).forEach((q, qi) => {
          const g = (grades ?? []).find(gr => gr.enrollmentId === enr.id && gr.quarterId === q.id);
          const letter = g?.grade ?? '—';
          const clr = GRADE_COLORS[letter] ?? GRAY;
          page.drawText(letter, { x: colX[2 + qi], y, font: fontB, size: 10, color: clr });
        });
        y -= 18;
      });
    } else {
      const headers = ['Course', 'Curriculum', 'Scale', 'Grade'];
      const hx = [M, M + 180, M + 340, W - M - 50];
      headers.forEach((h, i) => page.drawText(h, { x: hx[i], y, font: fontB, size: 8, color: GRAY }));
      page.drawLine({ start: { x: M, y: y - 4 }, end: { x: W - M, y: y - 4 }, thickness: 0.5, color: LTGRAY });
      y -= 18;
      studentEnrollments.forEach((enr, ri) => {
        const c = courseById.get(enr.courseId);
        const g = (grades ?? []).find(gr => gr.enrollmentId === enr.id && gr.quarterId === config.selectedQuarterId);
        if (ri % 2 === 1) page.drawRectangle({ x: M - 4, y: y - 4, width: W - 2 * M + 8, height: 18, color: LTGRAY });
        page.drawText(c?.name ?? '—', { x: hx[0], y, font: fontR, size: 10, color: INK });
        page.drawText(c?.curriculum ?? '—', { x: hx[1], y, font: fontR, size: 10, color: GRAY });
        const scale = c?.gradingType === 'letter' ? 'Letter' : 'E/S/N/U';
        page.drawText(scale, { x: hx[2], y, font: fontR, size: 10, color: GRAY });
        const letter = g?.grade ?? '—';
        const display = g ? `${letter}${g.percent != null ? ` (${g.percent}%)` : ''}` : '—';
        page.drawText(display, { x: hx[3], y, font: fontB, size: 10, color: GRADE_COLORS[letter] ?? GRAY });
        y -= 18;
      });
    }
    y -= 12;
  }

  // Attendance
  if (includeAttendance) {
    page.drawText('ATTENDANCE', { x: M, y, font: fontB, size: 8, color: GRAY });
    y -= 18;
    const boxes = [
      { label: 'Scheduled', val: String(attendanceDays.schoolDays) },
      { label: 'Absent', val: String(attendanceDays.sick) },
      { label: 'Present', val: String(attendanceDays.attended) },
      { label: 'Rate', val: `${attendanceDays.required > 0 ? Math.min(100, Math.round(attendanceDays.attended / attendanceDays.required * 100)) : 0}%` },
    ];
    const bw = (W - 2 * M - 24) / 4;
    boxes.forEach((b, i) => {
      const bx = M + i * (bw + 8);
      page.drawRectangle({ x: bx, y: y - 36, width: bw, height: 36, borderColor: LTGRAY, borderWidth: 1, color: WHITE });
      page.drawText(b.val, { x: bx + (bw - fontB.widthOfTextAtSize(b.val, 16)) / 2, y: y - 16, font: fontB, size: 16, color: INK });
      page.drawText(b.label, { x: bx + (bw - fontR.widthOfTextAtSize(b.label, 8)) / 2, y: y - 30, font: fontR, size: 8, color: GRAY });
    });
    y -= 52;
  }

  // Notes
  if (includeNotes && notes?.trim()) {
    page.drawText('TEACHER NOTES', { x: M, y, font: fontB, size: 8, color: GRAY });
    y -= 14;
    const lines = notes.trim().split('\n');
    page.drawRectangle({ x: M, y: y - lines.length * 14 - 12, width: W - 2 * M, height: lines.length * 14 + 12, borderColor: LTGRAY, borderWidth: 1, color: WHITE });
    lines.forEach((line, i) => {
      page.drawText(line, { x: M + 8, y: y - 8 - i * 14, font: fontI, size: 10, color: GRAY });
    });
    y -= lines.length * 14 + 24;
  }

  // Signature
  if (includeSignature) {
    const sigY = Math.min(y - 20, 80);
    page.drawLine({ start: { x: M, y: sigY }, end: { x: W / 2 + 40, y: sigY }, thickness: 0.5, color: GRAY });
    page.drawText('Teacher / Administrator Signature', { x: M, y: sigY - 14, font: fontR, size: 8, color: GRAY });
  }

  // Footer
  const footer = 'Iron & Light Johnson Academy · homeschool.grasphislove.com';
  page.drawText(footer, { x: (W - fontR.widthOfTextAtSize(footer, 8)) / 2, y: 24, font: fontR, size: 8, color: GRAY });

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ReportCard_${student}_${periodLabel.replace(/\s+/g, '_')}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
