const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

/* =========================================================
   FILE-BACKED "DATABASE"
   Reads/writes a JSON file on disk. Fine for a single small
   institute on a local network. If this ever needs to support
   many concurrent users or grow large, swap readDb/writeDb for
   a real database (SQLite/Postgres) — every route below would
   stay the same, only these two functions would change.
   ========================================================= */
function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}
function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/* =========================================================
   STUDENTS
   ========================================================= */
app.get('/api/students', (req, res) => {
  const db = readDb();
  res.json(db.students);
});

app.post('/api/students', (req, res) => {
  const db = readDb();
  const { name, email, phone, birthdate, grade } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (db.students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'A student with this email already exists.' });
  }

  const student = {
    id: db.nextStudentId++,
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    birthdate: birthdate || '',
    grade: grade || 'Waiting List',
    completed: false,
  };
  db.students.push(student);
  writeDb(db);
  res.status(201).json(student);
});

app.put('/api/students/:id', (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const student = db.students.find(s => s.id === id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const { name, email, phone, birthdate, grade, completed } = req.body;

  if (email !== undefined) {
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
    if (db.students.some(s => s.email.toLowerCase() === email.toLowerCase() && s.id !== id)) {
      return res.status(409).json({ error: 'Another student already uses this email.' });
    }
  }
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (name !== undefined) student.name = name.trim();
  if (email !== undefined) student.email = email.trim();
  if (phone !== undefined) student.phone = phone.trim();
  if (birthdate !== undefined) student.birthdate = birthdate;
  if (grade !== undefined) student.grade = grade;
  if (completed !== undefined) student.completed = !!completed;

  writeDb(db);
  res.json(student);
});

app.delete('/api/students/:id', (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const before = db.students.length;
  db.students = db.students.filter(s => s.id !== id);
  db.grades = db.grades.filter(g => g.studentId !== id);
  delete db.attendance[id];
  writeDb(db);
  res.json({ deleted: before !== db.students.length });
});

app.post('/api/students/bulk', (req, res) => {
  const db = readDb();
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  let added = 0, skipped = 0;

  rows.forEach(r => {
    if (!r.name || !isValidEmail(r.email)) { skipped++; return; }
    if (db.students.some(s => s.email.toLowerCase() === r.email.toLowerCase())) { skipped++; return; }
    db.students.push({
      id: db.nextStudentId++,
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      birthdate: r.birthdate || '',
      grade: r.grade || 'Waiting List',
      completed: false,
    });
    added++;
  });

  writeDb(db);
  res.json({ added, skipped });
});

/* =========================================================
   STAFF
   ========================================================= */
app.get('/api/staff', (req, res) => {
  const db = readDb();
  res.json(db.staff);
});

app.post('/api/staff', (req, res) => {
  const db = readDb();
  const { name, email, role, assignedClass, phone } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (db.staff.some(s => s.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'A staff member with this email already exists.' });
  }

  const member = {
    id: db.nextStaffId++,
    name: name.trim(),
    email: email.trim(),
    role: role || 'Teacher',
    assignedClass: assignedClass || '',
    phone: (phone || '').trim(),
  };
  db.staff.push(member);
  writeDb(db);
  res.status(201).json(member);
});

app.put('/api/staff/:id', (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const member = db.staff.find(s => s.id === id);
  if (!member) return res.status(404).json({ error: 'Staff member not found.' });

  const { name, email, role, assignedClass, phone } = req.body;

  if (email !== undefined) {
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
    if (db.staff.some(s => s.email.toLowerCase() === email.toLowerCase() && s.id !== id)) {
      return res.status(409).json({ error: 'Another staff member already uses this email.' });
    }
  }
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (name !== undefined) member.name = name.trim();
  if (email !== undefined) member.email = email.trim();
  if (role !== undefined) member.role = role;
  if (assignedClass !== undefined) member.assignedClass = assignedClass;
  if (phone !== undefined) member.phone = phone.trim();

  writeDb(db);
  res.json(member);
});

app.delete('/api/staff/:id', (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const before = db.staff.length;
  db.staff = db.staff.filter(s => s.id !== id);
  writeDb(db);
  res.json({ deleted: before !== db.staff.length });
});

app.post('/api/staff/bulk', (req, res) => {
  const db = readDb();
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  let added = 0, skipped = 0;

  rows.forEach(r => {
    if (!r.name || !isValidEmail(r.email)) { skipped++; return; }
    if (db.staff.some(s => s.email.toLowerCase() === r.email.toLowerCase())) { skipped++; return; }
    db.staff.push({
      id: db.nextStaffId++,
      name: r.name,
      email: r.email,
      role: r.role || 'Teacher',
      assignedClass: r.assignedClass || '',
      phone: r.phone || '',
    });
    added++;
  });

  writeDb(db);
  res.json({ added, skipped });
});

/* =========================================================
   GRADES
   ========================================================= */
app.get('/api/grades', (req, res) => {
  const db = readDb();
  res.json(db.grades);
});

app.put('/api/grades', (req, res) => {
  const db = readDb();
  const { studentId, subject, score } = req.body;
  if (studentId === undefined || !subject) {
    return res.status(400).json({ error: 'studentId and subject are required.' });
  }
  const clamped = Math.max(0, Math.min(100, Math.round(Number(score))));
  let g = db.grades.find(g => g.studentId === studentId && g.subject === subject);
  if (g) g.score = clamped;
  else db.grades.push({ studentId, subject, score: clamped });
  writeDb(db);
  res.json({ studentId, subject, score: clamped });
});

/* =========================================================
   ATTENDANCE
   ========================================================= */
app.get('/api/attendance', (req, res) => {
  const db = readDb();
  res.json({ attendance: db.attendance, days: last7Days() });
});

app.put('/api/attendance/cycle', (req, res) => {
  const db = readDb();
  const { studentId, date } = req.body;
  if (studentId === undefined || !date) {
    return res.status(400).json({ error: 'studentId and date are required.' });
  }
  if (!db.attendance[studentId]) db.attendance[studentId] = {};
  const cur = db.attendance[studentId][date] || 'unmarked';
  const next = cur === 'unmarked' ? 'present' : cur === 'present' ? 'absent' : 'unmarked';
  if (next === 'unmarked') delete db.attendance[studentId][date];
  else db.attendance[studentId][date] = next;
  writeDb(db);
  res.json({ studentId, date, status: next });
});

/* =========================================================
   STATIC FRONTEND
   Serves the dashboard itself, so the browser and API share
   one origin (no CORS headaches, one URL to remember).
   ========================================================= */
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`King Sejong Institute dashboard running at http://localhost:${PORT}`);
});
