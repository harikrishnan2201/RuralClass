import { Router, Request, Response } from 'express';
import { 
  generateStudentsWorkbook, 
  generateTimetableWorkbook, 
  generateBlankTemplate, 
  generatePrintableHtml 
} from '../services/exportService.js';
import { StudentsRepository, TopicsRepository, PlansRepository } from '../db/repositories.js';
import { localizeGrade, localizeTopicName } from '../../shared/contentLocalization.js';

export const exportRouter = Router();

/**
 * 1. Export Students to XLSX
 */
exportRouter.get('/students.xlsx', (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const students = StudentsRepository.getAll();
  const topics = TopicsRepository.getAll();

  const buffer = generateStudentsWorkbook(students, topics, lang);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="students_assessment.xlsx"');
  return res.send(buffer);
});

/**
 * 2. Printable HTML view for Students (Save as PDF)
 */
exportRouter.get('/students.html', (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const students = StudentsRepository.getAll();
  const topics = TopicsRepository.getAll();

  const thHeaders = [
    lang === 'ta' ? 'பதிவு எண்' : lang === 'hi' ? 'रोल नं' : 'Roll',
    lang === 'ta' ? 'மாணவர் பெயர்' : lang === 'hi' ? 'विद्यार्थी' : 'Student Name',
    lang === 'ta' ? 'வகுப்பு' : lang === 'hi' ? 'कक्षा' : 'Grade',
    lang === 'ta' ? 'சராசரி' : lang === 'hi' ? 'औसत' : 'Avg %',
    lang === 'ta' ? 'கவனிப்பு' : lang === 'hi' ? 'सहायता' : 'Status',
    ...topics.map(t => localizeTopicName(t.name, lang))
  ].map(h => `<th>${h}</th>`).join('');

  const trRows = students.map(s => {
    const topicTds = topics.map(t => `<td>${s.topicScores[t.id] !== undefined ? s.topicScores[t.id] + '%' : '-'}</td>`).join('');
    const statusBadge = s.needsCheckin 
      ? `<span class="badge badge-checkin">${lang === 'ta' ? 'உதவி தேவை' : lang === 'hi' ? 'सहायता' : 'Check-in'}</span>`
      : `<span class="badge badge-mentor">${lang === 'ta' ? 'வழிகாட்டி' : lang === 'hi' ? 'मेंटर' : 'Mentor'}</span>`;

    return `<tr>
      <td>${s.id}</td>
      <td><strong>${s.name}</strong></td>
      <td>${localizeGrade(s.grade, lang)}</td>
      <td>${s.averageScore}%</td>
      <td>${statusBadge}</td>
      ${topicTds}
    </tr>`;
  }).join('');

  const tableHtml = `<table><thead><tr>${thHeaders}</tr></thead><tbody>${trRows}</tbody></table>`;
  const title = lang === 'ta' ? 'மாணவர் மதிப்பீட்டுப் பட்டியல்' : lang === 'hi' ? 'छात्र मूल्यांकन रिकॉर्ड' : 'Student Assessment Records';
  const html = generatePrintableHtml(title, tableHtml, lang);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

/**
 * 3. Export Weekly Planner to XLSX
 */
exportRouter.get('/planner.xlsx', (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const plan = PlansRepository.getActive();
  if (!plan) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No active plan found' } });
  }

  const buffer = generateTimetableWorkbook(plan, lang);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="weekly_timetable.xlsx"');
  return res.send(buffer);
});

/**
 * 4. Printable HTML view for Weekly Planner (Save as PDF)
 */
exportRouter.get('/planner.html', (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const plan = PlansRepository.getActive();
  if (!plan) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No active plan found' } });
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayNames: Record<string, string> = {
    Monday: lang === 'ta' ? 'திங்கள்' : lang === 'hi' ? 'सोमवार' : 'Monday',
    Tuesday: lang === 'ta' ? 'செவ்வாய்' : lang === 'hi' ? 'मंगलवार' : 'Tuesday',
    Wednesday: lang === 'ta' ? 'புதன்' : lang === 'hi' ? 'बुधवार' : 'Wednesday',
    Thursday: lang === 'ta' ? 'வியாழன்' : lang === 'hi' ? 'गुरुवार' : 'Thursday',
    Friday: lang === 'ta' ? 'வெள்ளி' : lang === 'hi' ? 'शुक्रवार' : 'Friday',
  };

  const rowsHtml: string[] = [];
  for (const sess of (plan.sessions || [])) {
    rowsHtml.push(`<tr>
      <td><strong>${dayNames[sess.day] || sess.day}</strong></td>
      <td>${sess.startTime} (${sess.durationMinutes}m)</td>
      <td>${sess.sessionType}</td>
      <td><strong>${sess.title}</strong></td>
      <td>${(sess.gradesInvolved || []).map((g: string) => localizeGrade(g, lang)).join(', ')}</td>
      <td>${sess.sharedObjective || '-'}</td>
      <td>${sess.teachingNotes || '-'}</td>
    </tr>`);
  }

  const tableHtml = `<table>
    <thead>
      <tr>
        <th>${lang === 'ta' ? 'நாள்' : lang === 'hi' ? 'दिन' : 'Day'}</th>
        <th>${lang === 'ta' ? 'நேரம்' : lang === 'hi' ? 'समय' : 'Time'}</th>
        <th>${lang === 'ta' ? 'வகை' : lang === 'hi' ? 'प्रकार' : 'Type'}</th>
        <th>${lang === 'ta' ? 'தலைப்பு' : lang === 'hi' ? 'शीर्षक' : 'Title'}</th>
        <th>${lang === 'ta' ? 'வகுப்புகள்' : lang === 'hi' ? 'कक्षाएँ' : 'Grades'}</th>
        <th>${lang === 'ta' ? 'செயல்பாடு' : lang === 'hi' ? 'गतिविधि' : 'Activity'}</th>
        <th>${lang === 'ta' ? 'குறிப்பு' : lang === 'hi' ? 'सुझाव' : 'Notes'}</th>
      </tr>
    </thead>
    <tbody>${rowsHtml.join('')}</tbody>
  </table>`;

  const title = lang === 'ta' ? 'பல-வகுப்பு வாராந்திரக் கற்பித்தல் அட்டவணை' : lang === 'hi' ? 'बहु-कक्षा साप्ताहिक शिक्षण समय-सारणी' : 'Multi-Grade Weekly Teaching Plan';
  const html = generatePrintableHtml(title, tableHtml, lang);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

/**
 * 5. Downloadable Blank Templates in English, Tamil, and Hindi
 */
exportRouter.get('/templates/:type', (req: Request, res: Response) => {
  const type = req.params.type;
  const lang = (req.query.lang as 'en' | 'ta' | 'hi') || 'en';

  const buffer = generateBlankTemplate(type, lang);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_template_${lang}.xlsx"`);
  return res.send(buffer);
});
