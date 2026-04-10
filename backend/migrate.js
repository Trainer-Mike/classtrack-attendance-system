const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      const alters = [
        "ALTER TABLE attendance_records ADD COLUMN date TEXT;",
        "ALTER TABLE attendance_records ADD COLUMN week_number INTEGER;",
        "ALTER TABLE reports ADD COLUMN week_number INTEGER;",
        "ALTER TABLE reports ADD COLUMN report_date TEXT;",
        "ALTER TABLE reports ADD COLUMN approved_by INTEGER;",
        "ALTER TABLE reports ADD COLUMN approved_at DATETIME;"
      ];

      alters.forEach(query => {
        db.run(query, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error:", err.message);
            } else {
                console.log("Migration executed successfully.");
            }
        });
      });
      
      setTimeout(() => {
          console.log("Closing DB...");
          db.close();
      }, 500);
    });
  }
});
