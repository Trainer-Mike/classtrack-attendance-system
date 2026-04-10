import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { Users, FileText, Send, Download, Calendar, Layers, FileOutput } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HodDashboard = ({ user }) => {
  const [stats, setStats] = useState([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('week'); // 'week' or 'term'
  const [selectedWeek, setSelectedWeek] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchStats();
  }, [filter, selectedWeek]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/attendance/stats?filter=${filter}&week=${selectedWeek}`, { headers });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleForward = async (row) => {
    try {
      await axios.post(`${API_URL}/reports`, {
        trainer_id: row.trainer_id || row.id, 
        subject_id: row.subject_id, 
        week_number: row.max_week,
        total_lessons: row.total_lessons,
        attended_lessons: row.attended_lessons,
        missed_lessons: row.missed_lessons,
        makeup_lessons: row.makeup_lessons,
        attendance_percentage: row.percentage,
        remarks: row.remarks
      }, { headers });
      setMessage(`Report for ${row.trainer_name} forwarded to Deputy Principal.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to forward report.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDownloadReport = () => {
    if (stats.length === 0) {
        setMessage('No data to download.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }

    // Department summary rows at top of CSV
    const totalExpected = stats.reduce((sum, s) => sum + s.total_lessons, 0);
    const totalAttended = stats.reduce((sum, s) => sum + s.attended_lessons, 0);
    const totalMissed   = stats.reduce((sum, s) => sum + s.missed_lessons, 0);
    const totalMakeup   = stats.reduce((sum, s) => sum + s.makeup_lessons, 0);
    const overallPct    = totalExpected > 0 ? ((totalAttended / totalExpected) * 100).toFixed(1) : 0;

    const summaryRows = [
      [`"DEPARTMENT ${filter.toUpperCase()} ATTENDANCE REPORT"`],
      [`"Overall Department Attendance: ${overallPct}% | Expected: ${totalExpected} | Attended: ${totalAttended} | Missed: ${totalMissed} | Makeup: ${totalMakeup}"`],
      [],
    ];

    const header = ['Trainer', 'Subject', `Expected Lessons (${filter})`, 'Attended', 'Missed', 'Makeup', 'Attendance %', 'Remarks'];
    const rows = stats.map(s => [
       `"${s.trainer_name}"`, `"${s.subject_name}"`, s.total_lessons, s.attended_lessons, s.missed_lessons, s.makeup_lessons, `"${s.percentage}%"`, `"${s.remarks}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [...summaryRows.map(r => r.join(',')), header.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `department_attendance_${filter}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (stats.length === 0) {
        setMessage('No data to download.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }

    const doc = new jsPDF('landscape'); // Landscape gives more room for the table
    
    // Header Text
    doc.setFontSize(16);
    doc.setTextColor(11, 31, 59); // Matches the new dark theme
    doc.text(`ClassTrack Department Attendance Report — ${filter.toUpperCase()}`, 14, 20);
    
    const totalExpected = stats.reduce((sum, s) => sum + s.total_lessons, 0);
    const totalAttended = stats.reduce((sum, s) => sum + s.attended_lessons, 0);
    const totalMissed   = stats.reduce((sum, s) => sum + s.missed_lessons, 0);
    const totalMakeup   = stats.reduce((sum, s) => sum + s.makeup_lessons, 0);
    const overallPct    = totalExpected > 0 ? ((totalAttended / totalExpected) * 100).toFixed(1) : 0;

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Overall Attendance: ${overallPct}%   |   Expected: ${totalExpected}   |   Attended: ${totalAttended}   |   Missed: ${totalMissed}   |   Makeup: ${totalMakeup}`, 14, 28);
    
    const tableColumn = ["Trainer", "Subject", `Expected (${filter})`, "Attended", "Missed", "Makeup", "Attend %", "Remarks"];
    const tableRows = [];

    stats.forEach(s => {
      tableRows.push([
        s.trainer_name,
        s.subject_name,
        s.total_lessons,
        s.attended_lessons,
        s.missed_lessons,
        s.makeup_lessons,
        `${s.percentage}%`,
        s.remarks
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] }, // matches var(--primary-color)
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: function (data) {
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleDateString()} via ClassTrack Attendance System`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`department_attendance_${filter}_report.pdf`);
  };

  // --- Computed department-wide aggregates ---
  const totalExpected = stats.reduce((sum, s) => sum + s.total_lessons, 0);
  const totalAttended = stats.reduce((sum, s) => sum + s.attended_lessons, 0);
  const totalMissed   = stats.reduce((sum, s) => sum + s.missed_lessons, 0);
  const totalMakeup   = stats.reduce((sum, s) => sum + s.makeup_lessons, 0);
  const overallPct    = totalExpected > 0 ? ((totalAttended / totalExpected) * 100).toFixed(1) : 0;
  const overallColor  = overallPct >= 90 ? '#10b981' : overallPct >= 70 ? '#f59e0b' : '#ef4444';
  const overallLabel  = overallPct >= 90 ? 'Excellent' : overallPct >= 70 ? 'Satisfactory' : 'Needs Improvement';
  const uniqueTrainers = new Set(stats.map(s => s.trainer_name)).size;

  return (
    <div>
      {/* Filter Toggle */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'flex-start', alignItems: 'center' }}>
          <button 
              className={`btn ${filter === 'week' ? 'btn-primary' : 'btn-outline'}`} 
              onClick={() => { setFilter('week'); setSelectedWeek(''); }}
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
              <Calendar size={16} /> Weekly Analysis
          </button>
          
          {filter === 'week' && (
            <select 
              className="form-control" 
              style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.5rem', margin: 0 }}
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              <option value="">Auto (Last 7 Days)</option>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Week {i+1}</option>
              ))}
            </select>
          )}

          <button 
              className={`btn ${filter === 'term' ? 'btn-primary' : 'btn-outline'}`} 
              onClick={() => setFilter('term')}
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
              <Layers size={16} /> Termly Summary
          </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid-cards">
        <div className="card">
          <div className="card-icon"><Users size={20} /></div>
          <div className="card-title">Trainers Monitored</div>
          <div className="card-value">{uniqueTrainers}</div>
        </div>
        <div className="card">
          <div className="card-icon"><FileText size={20} /></div>
          <div className="card-title">Total {filter === 'week' ? 'Weekly' : 'Termly'} Expected</div>
          <div className="card-value">{totalExpected}</div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>✔</div>
          <div className="card-title">Total Attended</div>
          <div className="card-value" style={{ color: '#10b981' }}>{totalAttended}</div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>✘</div>
          <div className="card-title">Total Missed</div>
          <div className="card-value" style={{ color: '#ef4444' }}>{totalMissed}</div>
        </div>
      </div>

      {/* ===== Department Overall Attendance Panel ===== */}
      {stats.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${overallColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Overall Department Attendance — {filter === 'week' ? 'This Week' : 'This Term'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: overallColor, lineHeight: 1 }}>
                  {overallPct}%
                </span>
                <span style={{
                  padding: '0.2rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: overallPct >= 90 ? '#d1fae5' : overallPct >= 70 ? '#fef3c7' : '#fee2e2',
                  color: overallPct >= 90 ? '#065f46' : overallPct >= 70 ? '#92400e' : '#991b1b',
                }}>
                  {overallLabel}
                </span>
              </div>
              {/* Progress Bar */}
              <div style={{ marginTop: '0.85rem', width: '320px', maxWidth: '100%', backgroundColor: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${overallPct}%`,
                  backgroundColor: overallColor,
                  borderRadius: '5px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* Right: Breakdown Pills */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Expected', value: totalExpected, bg: '#f1f5f9', text: '#334155' },
                { label: 'Attended', value: totalAttended, bg: '#d1fae5', text: '#065f46' },
                { label: 'Missed',   value: totalMissed,   bg: '#fee2e2', text: '#991b1b' },
                { label: 'Makeup',   value: totalMakeup,   bg: '#fef3c7', text: '#92400e' },
              ].map(item => (
                <div key={item.label} style={{
                  textAlign: 'center',
                  backgroundColor: item.bg,
                  color: item.text,
                  borderRadius: '10px',
                  padding: '0.6rem 1.1rem',
                  minWidth: '72px',
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{item.value}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message Banner */}
      {message && (
        <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* Detailed Report Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="card-title" style={{ margin: 0, textTransform: 'capitalize' }}>Trainer-Level Breakdown — {filter === 'week' ? 'This Week' : 'This Term'}</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }} onClick={handleDownloadReport}>
                <Download size={16} /> CSV
            </button>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }} onClick={handleDownloadPDF}>
                <FileOutput size={16} /> PDF Report
            </button>
          </div>
        </div>
        
        <div className="table-container" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Subject</th>
                <th>Expected<br/><span style={{fontSize: '0.75rem'}}>({filter})</span></th>
                <th>Attended</th>
                <th>Missed</th>
                <th>Makeup</th>
                <th>Attendance %</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.trainer_name}</td>
                  <td>{row.subject_name}</td>
                  <td style={{ fontWeight: 600 }}>{row.total_lessons}</td>
                  <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{row.attended_lessons}</td>
                  <td style={{ color: 'var(--accent-error)', fontWeight: 600 }}>{row.missed_lessons}</td>
                  <td style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>{row.makeup_lessons}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontWeight: 700, color: row.percentage >= 90 ? '#10b981' : row.percentage >= 70 ? '#f59e0b' : '#ef4444' }}>
                        {row.percentage}%
                      </span>
                      <div style={{ width: '60px', backgroundColor: '#e2e8f0', height: '5px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${row.percentage}%`, backgroundColor: row.percentage >= 90 ? '#10b981' : row.percentage >= 70 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${row.percentage >= 90 ? 'badge-success' : row.percentage >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                      {row.remarks}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleForward(row)}
                      className="btn btn-primary" 
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'auto' }}
                    >
                      <Send size={14} /> Forward
                    </button>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No data available for this {filter}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HodDashboard;
