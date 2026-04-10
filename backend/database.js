const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Create tables
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        class_name TEXT,
        active BOOLEAN DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        total_lessons_per_week INTEGER
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS trainer_subjects (
        trainer_id INTEGER,
        subject_id INTEGER,
        FOREIGN KEY (trainer_id) REFERENCES users(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        trainer_id INTEGER,
        subject_id INTEGER,
        date TEXT,
        week_number INTEGER,
        time_taught TEXT,
        attended BOOLEAN,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        make_up_done BOOLEAN DEFAULT 0,
        makeup_time TEXT,
        remarks TEXT,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (trainer_id) REFERENCES users(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER,
        subject_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        week_number INTEGER,
        report_date TEXT,
        total_lessons INTEGER,
        attended_lessons INTEGER,
        missed_lessons INTEGER,
        makeup_lessons INTEGER,
        attendance_percentage REAL,
        missed_percentage REAL,
        remarks TEXT,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER,
        approved_at DATETIME,
        FOREIGN KEY (trainer_id) REFERENCES users(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )`, () => {
        // Seed database
        db.get("SELECT count(*) as count FROM users", (err, row) => {
          if (row.count === 0) {
            console.log('Seeding initial data...');
            const salt = bcrypt.genSaltSync(10);
            const hashedPwd = bcrypt.hashSync('password123', salt);
            
            const stmt = db.prepare("INSERT INTO users (name, email, password, role, class_name) VALUES (?, ?, ?, ?, ?)");
            stmt.run('System Admin', 'admin@test.com', hashedPwd, 'admin', null);
            stmt.run('Alice Class Rep', 'student@test.com', hashedPwd, 'student', 'Class A');
            stmt.run('Bob Trainer', 'trainer@test.com', hashedPwd, 'trainer', null);
            stmt.run('Charlie HOD', 'hod@test.com', hashedPwd, 'hod', null);
            stmt.run('Dave DP', 'dp@test.com', hashedPwd, 'dp', null);
            stmt.run('Eve HOS', 'hos@test.com', hashedPwd, 'hos', null);
            stmt.finalize();

            const subjectStmt = db.prepare("INSERT INTO subjects (name, total_lessons_per_week) VALUES (?, ?)");
            subjectStmt.run('Mathematics', 5);
            subjectStmt.run('Science', 4);
            subjectStmt.finalize();

            // Link trainer to maths and science
            db.run("INSERT INTO trainer_subjects (trainer_id, subject_id) VALUES (2, 1)");
            db.run("INSERT INTO trainer_subjects (trainer_id, subject_id) VALUES (2, 2)", (err) => {
               if(err) console.error("Error linking trainer subjects:", err);
               else console.log("Seeding completed successfully! You can now use the application.");
            });
          }
        });
      });
    });
  }
});

module.exports = db;
