const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening db:', err.message);
    process.exit(1);
  }
  
  const salt = bcrypt.genSaltSync(10);
  const hashedPwd = bcrypt.hashSync('password123', salt);
  
  db.get("SELECT * FROM users WHERE email = 'admin@test.com'", [], (err, row) => {
    if (err) console.error(err.message);
    if (!row) {
      db.run("INSERT INTO users (name, email, password, role, class_name) VALUES (?, ?, ?, ?, ?)", 
        ['System Admin', 'admin@test.com', hashedPwd, 'admin', null], function(err) {
        if (err) {
            console.error('Insert failed', err.message);
            // If class_name doesn't exist yet because db wasn't deleted, alter table first
            if (err.message.includes('has no column named class_name')) {
                 db.run("ALTER TABLE users ADD COLUMN class_name TEXT", () => {
                     db.run("ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT 1", () => {
                         db.run("INSERT INTO users (name, email, password, role, class_name) VALUES (?, ?, ?, ?, ?)", 
                         ['System Admin', 'admin@test.com', hashedPwd, 'admin', null], () => {
                             console.log("Altered table and seeded admin");
                             
                             // Add the other tables/columns that might be missing
                             db.run("ALTER TABLE attendance_records ADD COLUMN time_taught TEXT", () => {});
                             db.run("ALTER TABLE attendance_records ADD COLUMN makeup_time TEXT", () => {});
                             db.run("ALTER TABLE attendance_records ADD COLUMN remarks TEXT", () => {});
                         });
                     });
                 });
            }
        } else {
            console.log('Seeded admin row directly.');
        }
      });
    } else {
      console.log('Admin already exists.');
    }
  });
});
