import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { CheckSquare } from 'lucide-react';

const StudentDashboard = () => {
  const [trainers, setTrainers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [timeTaught, setTimeTaught] = useState('');
  const [attended, setAttended] = useState(true);
  const [makeupDone, setMakeupDone] = useState(false);
  const [makeupTime, setMakeupTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Predefined time slots
  const TIME_SLOTS = [
    '7:30 AM – 9:30 AM',
    '9:30 AM – 11:30 AM',
    '11:30 AM – 1:30 PM',
    '2:00 PM – 4:00 PM',
    '4:00 PM – 6:00 PM',
  ];

  useEffect(() => {
    axios.get(`${API_URL}/data/trainers`, { headers }).then(res => {
      setTrainers(res.data);
    });
    axios.get(`${API_URL}/data/all-subjects`, { headers }).then(res => {
      setSubjects(res.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrainer || !selectedSubject) {
      setMessage('Please select a trainer and subject');
      return;
    }
    if (!timeTaught) {
      setMessage('Please select a time period');
      return;
    }

    try {
      await axios.post(`${API_URL}/attendance`, {
        trainer_id: selectedTrainer,
        subject_id: selectedSubject,
        time_taught: timeTaught,
        attended,
        make_up_done: makeupDone,
        makeup_time: makeupDone ? makeupTime : '',
        remarks
      }, { headers });
      setMessage('Attendance logged successfully!');
      setTimeout(() => setMessage(''), 4000);
      // Reset form
      setSelectedTrainer('');
      setSelectedSubject('');
      setTimeTaught('');
      setAttended(true);
      setMakeupDone(false);
      setMakeupTime('');
      setRemarks('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error logging attendance');
    }
  };

  return (
    <div>
      <div className="card" style={{ maxWidth: '620px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card-icon">
            <CheckSquare size={24} />
          </div>
          <h2 style={{ margin: 0 }}>Log Class Attendance (Class Rep)</h2>
        </div>

        {message && (
          <div style={{
            padding: '0.9rem 1rem',
            backgroundColor: message.includes('successfully') ? '#d1fae5' : '#fee2e2',
            color: message.includes('successfully') ? '#065f46' : '#991b1b',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontWeight: 500,
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Trainer */}
          <div className="form-group">
            <label>Select Trainer</label>
            <select
              className="form-control"
              value={selectedTrainer}
              onChange={e => setSelectedTrainer(e.target.value)}
              required
            >
              <option value="">-- Choose a Trainer --</option>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div className="form-group">
            <label>Select Unit / Subject</label>
            <select
              className="form-control"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              required
            >
              <option value="">-- Choose a Unit --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Time Period — dropdown */}
          <div className="form-group">
            <label>Lesson Time Period</label>
            <select
              className="form-control"
              value={timeTaught}
              onChange={e => setTimeTaught(e.target.value)}
              required
            >
              <option value="">-- Select Time Period --</option>
              {TIME_SLOTS.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {/* Did Trainer Attend? */}
          <div className="form-group">
            <label>Did the trainer teach this lesson?</label>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
              <label className="checkbox-container">
                <input
                  type="radio"
                  name="attended"
                  checked={attended}
                  onChange={() => { setAttended(true); }}
                />
                &nbsp;✅ Yes — Taught
              </label>
              <label className="checkbox-container">
                <input
                  type="radio"
                  name="attended"
                  checked={!attended}
                  onChange={() => { setAttended(false); }}
                />
                &nbsp;❌ No — Missed
              </label>
            </div>
          </div>

          {/* Make-up Section — always visible */}
          <div className="form-group" style={{
            backgroundColor: makeupDone ? '#fefce8' : 'var(--bg-page)',
            padding: '1rem',
            borderRadius: '8px',
            border: `1px solid ${makeupDone ? '#fcd34d' : 'var(--border-color)'}`,
            transition: 'all 0.2s',
          }}>
            <label className="checkbox-container" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={makeupDone}
                onChange={(e) => {
                  setMakeupDone(e.target.checked);
                  if (!e.target.checked) setMakeupTime('');
                }}
              />
              <span style={{ fontWeight: 600, color: makeupDone ? '#92400e' : 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                🔁 A make-up lesson was / has been conducted for this subject
              </span>
            </label>

            {makeupDone && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                  Make-up Lesson Time Period
                </label>
                <select
                  className="form-control"
                  value={makeupTime}
                  onChange={e => setMakeupTime(e.target.value)}
                  required={makeupDone}
                >
                  <option value="">-- Select Make-up Time Slot --</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="form-group">
            <label>Remarks <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>(optional)</span></label>
            <textarea
              className="form-control"
              rows="3"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any notes on the lesson, trainer conduct, or make-up lesson..."
            />
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
