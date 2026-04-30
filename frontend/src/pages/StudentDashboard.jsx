import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { CheckSquare, School } from 'lucide-react';

const StudentDashboard = ({ user }) => {
  const [trainers, setTrainers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [timeTaught, setTimeTaught] = useState('');
  const [attended, setAttended] = useState(true);
  const [makeupDone, setMakeupDone] = useState(false);
  const [makeupTime, setMakeupTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');
  const [minWeek, setMinWeek] = useState(1);

  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };
  const getEndOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const TIME_SLOTS = [
    '7:30 AM – 9:30 AM',
    '9:30 AM – 11:30 AM',
    '11:30 AM – 1:30 PM',
    '2:00 PM – 4:00 PM',
    '4:00 PM – 6:00 PM',
  ];

  useEffect(() => {
    axios.get(`${API_URL}/data/trainers`, { headers }).then(res => setTrainers(res.data));
    axios.get(`${API_URL}/data/all-subjects`, { headers }).then(res => setAllSubjects(res.data));
    axios.get(`${API_URL}/data/classes`, { headers }).then(res => {
      setClasses(res.data);
      // Auto-select class if the user already has one assigned
      if (user?.class_name) {
        const found = res.data.find(c => c.name === user.class_name);
        if (found) setSelectedClass(String(found.id));
      }
    });
    axios.get(`${API_URL}/attendance/current-week`, { headers }).then(res => {
      const activeWeek = res.data.current_week || 1;
      setMinWeek(activeWeek);
      setWeekNumber(activeWeek);
    }).catch(() => setMinWeek(1));
  }, []);

  // Subjects filtered by selected class
  const filteredSubjects = selectedClass
    ? allSubjects.filter(s => String(s.class_id) === String(selectedClass))
    : allSubjects;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) { setMessage('Please select your class first.'); return; }
    if (!selectedTrainer || !selectedSubject) { setMessage('Please select a trainer and subject'); return; }
    if (!timeTaught) { setMessage('Please select a time period'); return; }

    const confirmSubmit = window.confirm("Are you sure you want to submit this attendance record? Please verify the date and week number are correct.");
    if (!confirmSubmit) return;

    try {
      await axios.post(`${API_URL}/attendance`, {
        trainer_id: selectedTrainer,
        subject_id: selectedSubject,
        date: lessonDate,
        week_number: parseInt(weekNumber),
        time_taught: timeTaught,
        attended,
        make_up_done: makeupDone,
        makeup_time: makeupDone ? makeupTime : '',
        remarks
      }, { headers });
      setMessage('Attendance logged successfully!');
      setTimeout(() => setMessage(''), 4000);
      setSelectedTrainer('');
      setSelectedSubject('');
      setLessonDate(new Date().toISOString().split('T')[0]);
      setTimeTaught('');
      setAttended(true);
      setMakeupDone(false);
      setMakeupTime('');
      setRemarks('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error logging attendance');
    }
  };

  const selectedClassObj = classes.find(c => String(c.id) === String(selectedClass));

  return (
    <div>
      <div className="card" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card-icon"><CheckSquare size={24} /></div>
          <h2 style={{ margin: 0 }}>Log Class Attendance (Class Rep)</h2>
        </div>

        {message && (
          <div style={{
            padding: '0.9rem 1rem',
            backgroundColor: message.includes('successfully') ? '#d1fae5' : '#fee2e2',
            color: message.includes('successfully') ? '#065f46' : '#991b1b',
            borderRadius: '8px', marginBottom: '1rem', fontWeight: 500,
          }}>{message}</div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Class Selector */}
          <div className="form-group" style={{ background: 'var(--bg-page)', border: '2px solid var(--primary-color)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <School size={16} /> Select Your Class
            </label>
            <select
              className="form-control"
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); }}
              required
            >
              <option value="">-- Choose Your Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.term})</option>
              ))}
            </select>
            {selectedClassObj && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                📚 Showing units assigned to {selectedClassObj.name}
              </div>
            )}
          </div>

          {/* Trainer */}
          <div className="form-group">
            <label>Select Trainer</label>
            <select className="form-control" value={selectedTrainer} onChange={e => setSelectedTrainer(e.target.value)} required>
              <option value="">-- Choose a Trainer --</option>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Subject — filtered by class */}
          <div className="form-group">
            <label>Select Unit / Subject</label>
            <select className="form-control" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required>
              <option value="">-- Choose a Unit --</option>
              {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {selectedClass && filteredSubjects.length === 0 && (
              <p style={{ fontSize: '0.82rem', color: '#f59e0b', marginTop: '0.3rem' }}>
                No units assigned to this class yet. Ask admin to add units under Manage Subjects.
              </p>
            )}
          </div>

          {/* Date & Week */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Lesson Date <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>(Current Week Only)</span></label>
              <input type="date" className="form-control" value={lessonDate}
                onChange={e => setLessonDate(e.target.value)}
                min={getStartOfWeek()} max={getEndOfWeek()} required />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Week Number <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>(Locked)</span></label>
              <input type="number" className="form-control" min={minWeek} max={12} value={weekNumber}
                onChange={e => setWeekNumber(e.target.value)} required />
            </div>
          </div>

          {/* Time Period */}
          <div className="form-group">
            <label>Lesson Time Period</label>
            <select className="form-control" value={timeTaught} onChange={e => setTimeTaught(e.target.value)} required>
              <option value="">-- Select Time Period --</option>
              {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>

          {/* Did Trainer Attend? */}
          <div className="form-group">
            <label>Did the trainer teach this lesson?</label>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
              <label className="checkbox-container">
                <input type="radio" name="attended" checked={attended} onChange={() => setAttended(true)} />
                &nbsp;✅ Yes — Taught
              </label>
              <label className="checkbox-container">
                <input type="radio" name="attended" checked={!attended} onChange={() => setAttended(false)} />
                &nbsp;❌ No — Missed
              </label>
            </div>
          </div>

          {/* Make-up Section */}
          <div className="form-group" style={{
            backgroundColor: makeupDone ? '#fefce8' : 'var(--bg-page)',
            padding: '1rem', borderRadius: '8px',
            border: `1px solid ${makeupDone ? '#fcd34d' : 'var(--border-color)'}`,
            transition: 'all 0.2s',
          }}>
            <label className="checkbox-container" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={makeupDone}
                onChange={(e) => { setMakeupDone(e.target.checked); if (!e.target.checked) setMakeupTime(''); }} />
              <span style={{ fontWeight: 600, color: makeupDone ? '#92400e' : 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                🔁 A make-up lesson was / has been conducted for this subject
              </span>
            </label>
            {makeupDone && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>Make-up Lesson Time Period</label>
                <select className="form-control" value={makeupTime} onChange={e => setMakeupTime(e.target.value)} required={makeupDone}>
                  <option value="">-- Select Make-up Time Slot --</option>
                  {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="form-group">
            <label>Remarks <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>(optional)</span></label>
            <textarea className="form-control" rows="3" value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any notes on the lesson, trainer conduct, or make-up lesson..." />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Submit Attendance Record
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
