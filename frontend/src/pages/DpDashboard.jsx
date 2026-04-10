import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { ShieldCheck, Calendar, Layers, FileOutput, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DpDashboard = ({ user }) => {
  const [message, setMessage] = useState('');
  
  // Department Analysis States (copied from HOD)
  const [stats, setStats] = useState([]);
  const [filter, setFilter] = useState('week'); // 'week' or 'term'
  const [selectedWeek, setSelectedWeek] = useState('');
  const [term, setTerm] = useState('1');
  const [isApproved, setIsApproved] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchStats();
    setIsApproved(false); // Reset approval if filter changes
  }, [filter, selectedWeek]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/attendance/stats?filter=${filter}&week=${selectedWeek}`, { headers });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAll = async () => {
    try {
      await axios.patch(`${API_URL}/reports/approve-all`, {}, { headers });
      setMessage('Department report officially approved.');
      setIsApproved(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to approve report.');
    }
  };

  const handleDownloadOverviewPDF = () => {
    if (stats.length === 0) {
        setMessage('No data to download.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }

    const doc = new jsPDF('landscape');
    
    // Header Text
    doc.setFontSize(16);
    doc.setTextColor(11, 31, 59);
    doc.text(`Official Academic Department Attendance Report`, 14, 20);
    
    const totalExpected = stats.reduce((sum, s) => sum + s.total_lessons, 0);
    const totalAttended = stats.reduce((sum, s) => sum + s.attended_lessons, 0);
    const totalMissed   = stats.reduce((sum, s) => sum + s.missed_lessons, 0);
    const totalMakeup   = stats.reduce((sum, s) => sum + s.makeup_lessons, 0);
    const overallPct    = totalExpected > 0 ? ((totalAttended / totalExpected) * 100).toFixed(1) : 0;

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const year = new Date().getFullYear();
    const currentWeekVal = selectedWeek || (stats.length > 0 ? stats[0].max_week : 1) || 1;
    const periodStr = filter === 'week' ? `Week ${currentWeekVal}` : 'Termly';
    doc.text(`Year: ${year}   |   Term: ${term}   |   Period: ${periodStr}`, 14, 28);
    doc.text(`Overall Attendance: ${overallPct}%   |   Expected: ${totalExpected}   |   Attended: ${totalAttended}   |   Missed: ${totalMissed}   |   Makeup: ${totalMakeup}`, 14, 34);

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
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const finalY = doc.lastAutoTable.finalY + 25;

    // Signatories Section
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("_________________________", 20, finalY);
    doc.text("Checked by: HOD", 20, finalY + 6);
    doc.text("Date: ___________________", 20, finalY + 12);

    doc.text("_________________________", doc.internal.pageSize.width - 70, finalY);
    doc.text("Approved by: DP Academics", doc.internal.pageSize.width - 70, finalY + 6);
    doc.text("Date: " + new Date().toLocaleDateString(), doc.internal.pageSize.width - 70, finalY + 12);

    doc.save(`DP_Approved_Department_Report_T${term}_${periodStr}.pdf`);
  };

  return (
    <div>
      {message && (
        <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* DP Department Analysis View */}
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Department Analytics</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap' }}>
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

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.5rem', margin: 0 }}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              >
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!isApproved ? (
                   <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }} onClick={handleApproveAll}>
                      <Check size={16} /> Approve Department Report
                   </button>
                ) : (
                   <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', borderColor: '#10b981', color: '#10b981' }} onClick={handleDownloadOverviewPDF}>
                      <FileOutput size={16} /> Download Approved PDF
                   </button>
                )}
              </div>
            </div>
        </div>

        <div className="card">
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
                  </tr>
                ))}
                {stats.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No data available for this {filter}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default DpDashboard;
