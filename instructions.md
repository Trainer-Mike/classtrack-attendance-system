Build a Full-Stack Teacher Class Attendance System (Education SaaS)

Create a full-stack web application called “Teacher Class Attendance System” designed for academic institutions to monitor and report trainer lesson attendance.
The system should be modern, responsive, secure, and production-ready, with role-based access control.
________________________________________
👥 USER ROLES
1. Student
•	Confirms whether a lesson was attended or not 
•	Confirms whether a missed lesson has been made up 
•	Each action must automatically capture: 
o	Timestamp (date + time) 
o	Subject 
o	Trainer name 
________________________________________
2. Trainer
•	Views assigned subjects 
•	Views attendance records submitted by students 
•	Tracks: 
o	Total lessons per week 
o	Actual lessons attended 
o	Lessons missed 
o	Make-up lessons done 
________________________________________
3. Head of Department (HOD)
•	Has a dashboard showing: 
o	All trainers 
o	Attendance summaries 
o	Reports per trainer and per subject 
•	Can: 
o	Filter reports by date, trainer, subject 
o	Generate printable reports (PDF) 
o	Forward reports to Deputy Principal Academics 
________________________________________
4. Deputy Principal Academics
•	Views forwarded reports 
•	Can approve or comment on reports 
________________________________________
📊 CORE FEATURES
Attendance Tracking
Capture the following for each trainer:
•	Trainer Name 
•	Subject Taught 
•	Total Lessons Per Week 
•	Actual Lessons Attended 
•	Total Lessons Missed 
•	Number of Make-up Lessons Done 
________________________________________
Automatic Calculations
System should compute:
•	Attendance Percentage
= (Actual Lessons Attended / Total Lessons Per Week) × 100 
•	Missed Lessons Percentage
= (Lessons Missed / Total Lessons Per Week) × 100 
________________________________________
Student Confirmation Workflow
•	Student selects: 
o	Subject 
o	Trainer 
•	Marks: 
o	Lesson attended (Yes/No) 
•	If No: 
o	Option to later confirm make-up lesson 
•	Each submission must include: 
o	Timestamp 
o	Student ID 
________________________________________
Reporting Module
Generate structured reports with:
•	Trainer Name 
•	Subject 
•	Weekly Summary: 
o	Total Lessons 
o	Attended Lessons 
o	Missed Lessons 
o	Make-up Lessons 
o	Attendance % 
o	Missed % 
•	Remarks Section: 
o	Auto-generated (e.g., “Good attendance”, “Needs improvement”) 
o	Editable by HOD 
________________________________________
Dashboard Features
•	Charts (bar/line) for attendance trends 
•	KPI cards: 
o	Attendance % 
o	Missed % 
•	Real-time updates 
________________________________________
🧠 SMART FEATURES (AI-ENHANCED)
•	Auto-generate remarks based on attendance: 
o	90% → Excellent
o	70–90% → Satisfactory 
o	<70% → Needs Improvement 
•	Detect inconsistencies (e.g., too many missed lessons) 
________________________________________
🗄️ DATABASE DESIGN
Create relational tables:
•	Users (id, name, role, email, password) 
•	Trainers 
•	Students 
•	Subjects 
•	Lessons 
•	AttendanceRecords 
o	student_id 
o	trainer_id 
o	subject_id 
o	attended (boolean) 
o	timestamp 
•	MakeUpLessons 
o	linked to missed lessons 
o	timestamp 
•	Reports 
________________________________________
🔐 AUTHENTICATION & SECURITY
•	JWT-based authentication 
•	Role-based authorization (Student, Trainer, HOD, Deputy Principal) 
•	Input validation and secure APIs 
________________________________________
🎨 FRONTEND REQUIREMENTS
•	Use React (or Next.js) 
•	Clean dashboard UI (SaaS style) 
•	Pages: 
o	Login/Register 
o	Student Attendance Page 
o	Trainer Dashboard 
o	HOD Dashboard 
o	Reports Page 
________________________________________
⚙️ BACKEND REQUIREMENTS
•	Node.js + Express 
•	REST API endpoints: 
o	/attendance 
o	/reports 
o	/users 

________________________________________
📄 REPORT EXPORT
•	Generate downloadable: 
o	PDF reports 
o	Printable format 
________________________________________
📦 OUTPUT REQUIRED
Generate:
1.	Full working codebase (frontend + backend) 
2.	Database schema 
3.	API documentation 
4.	Sample test data 
5.	Screens (UI pages) 
6.	Deployment instructions 
7.	GitHub-ready project structure 
________________________________________
🎯 DESIGN STYLE
•	Professional academic system 
•	Clean UI (blue/indigo theme) 
•	Mobile responsive 
•	Dashboard with cards, tables, and charts
