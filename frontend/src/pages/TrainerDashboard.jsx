import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { BookOpen, AlertTriangle, CheckCircle, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrainerDashboard = ({ user }) => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/attendance/stats?filter=week`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStats(res.data));
  }, []);

  const totalAssigned = stats.reduce((acc, curr) => acc + curr.total_lessons, 0);
  const totalAttended = stats.reduce((acc, curr) => acc + curr.attended_lessons, 0);
  const totalMissed   = stats.reduce((acc, curr) => acc + curr.missed_lessons, 0);
  const totalMakeup   = stats.reduce((acc, curr) => acc + curr.makeup_lessons, 0);

  const chartData = stats.map(s => ({
    name: s.subject_name,
    Attended: s.attended_lessons,
    Missed: s.missed_lessons,
    'Make-ups': s.makeup_lessons,
  }));

  return (
    <div>
      <div className="grid-cards">
        <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
          <div className="card-icon"><BookOpen size={20} /></div>
          <div className="card-title">Total Lessons per Week</div>
          <div className="card-value">{totalAssigned}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
          <div className="card-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <CheckCircle size={20} />
          </div>
          <div className="card-title">Attended Lessons</div>
          <div className="card-value">{totalAttended}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--accent-error)' }}>
          <div className="card-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="card-title">Missed Lessons</div>
          <div className="card-value">{totalMissed}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="card-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            🔁
          </div>
          <div className="card-title">Make-up Lessons</div>
          <div className="card-value" style={{ color: '#d97706' }}>{totalMakeup}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <PieChartIcon size={20} className="card-title" />
            <h3 className="card-title" style={{ margin: 0 }}>Attendance by Subject</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--box-shadow)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Attended"  fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Missed"    fill="var(--accent-error)"  radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Make-ups" fill="#f59e0b"              radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Total Lessons</th>
              <th>Attended</th>
              <th>Missed</th>
              <th>Make-ups</th>
              <th>Overall %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.subject_name}</td>
                <td>{row.total_lessons}</td>
                <td>{row.attended_lessons}</td>
                <td style={{ color: 'var(--accent-error)', fontWeight: 600 }}>{row.missed_lessons}</td>
                <td>
                  {row.makeup_lessons > 0 ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      backgroundColor: '#fef3c7', color: '#92400e',
                      padding: '0.2rem 0.6rem', borderRadius: '9999px',
                      fontSize: '0.82rem', fontWeight: 700,
                    }}>
                      🔁 {row.makeup_lessons}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{row.percentage}%</span>
                    <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${row.percentage}%`, backgroundColor: row.percentage >= 90 ? '#10b981' : row.percentage >= 70 ? '#f59e0b' : '#ef4444' }}></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${row.percentage >= 90 ? 'badge-success' : row.percentage >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                    {row.remarks}
                  </span>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainerDashboard;
