const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_attendance_key_123';

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Wrong email or password' });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, role: user.role, name: user.name, email: user.email } });
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Get Trainers (For Student Dropdown)
app.get('/api/data/trainers', authenticate, (req, res) => {
  db.all("SELECT id, name FROM users WHERE role = 'trainer'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Trainer Subjects (For Student Dropdown)
app.get('/api/data/subjects/:trainerId', authenticate, (req, res) => {
  const { trainerId } = req.params;
  const sql = `
    SELECT subjects.id, subjects.name, subjects.total_lessons_per_week 
    FROM subjects 
    JOIN trainer_subjects ON subjects.id = trainer_subjects.subject_id 
    WHERE trainer_subjects.trainer_id = ?`;
  db.all(sql, [trainerId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get ALL Subjects (For Class Rep)
app.get('/api/data/all-subjects', authenticate, (req, res) => {
  db.all("SELECT id, name FROM subjects", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Current Active Week
app.get('/api/attendance/current-week', authenticate, (req, res) => {
  db.get("SELECT MAX(week_number) as max_week FROM attendance_records", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ current_week: row.max_week || 1 });
  });
});

// Student Log Attendance
app.post('/api/attendance', authenticate, (req, res) => {
  const { trainer_id, subject_id, date, week_number, attended, make_up_done, time_taught, makeup_time, remarks } = req.body;
  const student_id = req.user.id;
  
  const checkSql = `SELECT id FROM attendance_records WHERE trainer_id = ? AND subject_id = ? AND time_taught = ? AND date = ?`;

  db.get(checkSql, [trainer_id, subject_id, time_taught, date], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: 'A record for this specific unit, trainer, and time slot has already been logged on this date! Duplicate entries are strictly prohibited.' });
    }

    const sql = 'INSERT INTO attendance_records (student_id, trainer_id, subject_id, date, week_number, attended, make_up_done, time_taught, makeup_time, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [student_id, trainer_id, subject_id, date, week_number, attended ? 1 : 0, make_up_done ? 1 : 0, time_taught, makeup_time, remarks], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Attendance recorded successfully' });
    });
  });
});

// Admin routes
// Get all users (Admin)
app.get('/api/admin/users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.all("SELECT id, name, email, role, class_name, active FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create User (Admin)
app.post('/api/admin/users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, email, password, role, class_name } = req.body;
  const hash = bcrypt.hashSync(password || 'password123', 10);
  db.run("INSERT INTO users (name, email, password, role, class_name) VALUES (?, ?, ?, ?, ?)", [name, email, hash, role, class_name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User created', id: this.lastID });
  });
});

// Update User (Admin)
app.put('/api/admin/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, email, role, class_name, active } = req.body;
  db.run("UPDATE users SET name = ?, email = ?, role = ?, class_name = ?, active = ? WHERE id = ?", [name, email, role, class_name, active ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User updated' });
  });
});

// Delete User (Admin)
app.delete('/api/admin/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted' });
  });
});

// Manage Subjects (Admin)
app.post('/api/admin/subjects', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, total_lessons_per_week } = req.body;
  db.run("INSERT INTO subjects (name, total_lessons_per_week) VALUES (?, ?)", [name, total_lessons_per_week], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Subject created', id: this.lastID });
  });
});

// Get all subjects
app.get('/api/admin/subjects', authenticate, (req, res) => {
  db.all("SELECT * FROM subjects", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update Subject (Admin)
app.put('/api/admin/subjects/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, total_lessons_per_week } = req.body;
  db.run("UPDATE subjects SET name = ?, total_lessons_per_week = ? WHERE id = ?",
    [name, total_lessons_per_week, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Subject updated' });
    }
  );
});

// Delete Subject (Admin)
app.delete('/api/admin/subjects/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.run("DELETE FROM subjects WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Subject deleted' });
  });
});


// Reset Term (Admin)
app.post('/api/admin/reset-term', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.run("DELETE FROM attendance_records", function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run("DELETE FROM reports", function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Term successfully reset. All records cleared.' });
    });
  });
});

// Reset Weekly Analysis (Admin) - clears only records from the last 7 days
app.post('/api/admin/reset-week', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.run("DELETE FROM attendance_records WHERE timestamp >= datetime('now', '-7 days')", function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const deleted = this.changes;
    res.json({ message: `Weekly analysis reset. ${deleted} record(s) from the past 7 days have been cleared.` });
  });
});

// Trainer / HOD Analytics
app.get('/api/attendance/stats', authenticate, (req, res) => {
  const { filter, week } = req.query; // filter='week' or 'term'
  const isTrainer = req.user.role === 'trainer';
  
  let conditions = [];
  if (isTrainer) conditions.push(`ar.trainer_id = ${req.user.id}`);
  
  if (filter === 'week') {
    if (week && week !== 'null' && week !== 'undefined') {
      conditions.push(`ar.week_number = ${parseInt(week)}`);
    } else {
      conditions.push(`ar.timestamp >= datetime('now', '-7 days')`);
    }
  }

  let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";
  let multiplier = filter === 'week' ? 1 : 12;

  const sql = `
    SELECT 
      users.name as trainer_name,
      subjects.name as subject_name,
      IFNULL(MAX(ar.week_number), 1) as max_week,
      (subjects.total_lessons_per_week * ${multiplier}) as total_lessons,
      COUNT(ar.id) as total_recorded,
      IFNULL(SUM(CASE WHEN ar.attended = 1 OR ar.attended = '1' OR ar.attended = 'true' THEN 1 ELSE 0 END), 0) as attended_lessons,
      IFNULL(SUM(CASE WHEN ar.attended = 0 OR ar.attended = '0' OR ar.attended = 'false' THEN 1 ELSE 0 END), 0) as missed_lessons,
      IFNULL(SUM(CASE WHEN ar.make_up_done = 1 OR ar.make_up_done = '1' OR ar.make_up_done = 'true' THEN 1 ELSE 0 END), 0) as makeup_lessons
    FROM attendance_records ar
    JOIN users ON ar.trainer_id = users.id
    JOIN subjects ON ar.subject_id = subjects.id
    ${whereClause}
    GROUP BY ar.trainer_id, ar.subject_id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const formatted = rows.map(r => {
      // Automatic calculation of missed lessons based on allocated slots
      let calculatedMissed = r.total_lessons - r.attended_lessons;
      if (calculatedMissed < 0) calculatedMissed = 0; // Prevent negative if over-taught

      const percentage = (r.total_lessons > 0 ? (r.attended_lessons / r.total_lessons) * 100 : 0).toFixed(0);
      let remarks = 'Needs Improvement';
      if (percentage >= 90) remarks = 'Excellent';
      else if (percentage >= 70) remarks = 'Satisfactory';

      return { ...r, missed_lessons: calculatedMissed, percentage, remarks };
    });
    res.json(formatted);
  });
});

// HOD generates a report to forward to DP
app.post('/api/reports', authenticate, (req, res) => {
  const { trainer_id, subject_id, remarks, week_number, total_lessons, attended_lessons, missed_lessons, makeup_lessons, attendance_percentage } = req.body;
  const sql = `
    INSERT INTO reports 
    (trainer_id, subject_id, week_number, report_date, total_lessons, attended_lessons, missed_lessons, makeup_lessons, attendance_percentage, remarks, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'forwarded_to_dp')`;
  
  db.run(sql, [trainer_id, subject_id, week_number || 1, new Date().toISOString().split('T')[0], total_lessons, attended_lessons, missed_lessons, makeup_lessons, attendance_percentage, remarks], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Report Forwarded successfully', id: this.lastID });
  });
});

// Fetch reports HOD/DP
app.get('/api/reports', authenticate, (req, res) => {
  const sql = `
    SELECT r.*, u.name as trainer_name, s.name as subject_name 
    FROM reports r
    LEFT JOIN users u ON r.trainer_id = u.id
    LEFT JOIN subjects s ON r.subject_id = s.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// DP Approve
app.patch('/api/reports/:id/approve', authenticate, (req, res) => {
  const sql = "UPDATE reports SET status = 'approved' WHERE id = ?";
  db.run(sql, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Report approved' });
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend is running on http://localhost:${PORT}`));
