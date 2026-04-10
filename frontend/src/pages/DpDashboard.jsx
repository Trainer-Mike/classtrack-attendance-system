import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { ShieldCheck, Inbox } from 'lucide-react';

const DpDashboard = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports`, { headers });
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/approve`, {}, { headers });
      setMessage('Report approved successfully.');
      setTimeout(() => setMessage(''), 3000);
      fetchReports();
    } catch (err) {
      setMessage('Failed to approve report.');
    }
  };

  return (
    <div>
      <div className="grid-cards">
        <div className="card">
          <div className="card-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <Inbox size={20} />
          </div>
          <div className="card-title">Pending Approvals</div>
          <div className="card-value">{reports.filter(r => r.status === 'forwarded_to_dp').length}</div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="card-title">Approved Reports</div>
          <div className="card-value">{reports.filter(r => r.status === 'approved').length}</div>
        </div>
      </div>

      {message && (
        <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Forwarded Reports</h2>
        </div>
        
        <div className="table-container" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Trainer ID</th>
                <th>Subject ID</th>
                <th>Remarks</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td style={{ fontWeight: 600 }}>ID: {row.trainer_id}</td>
                  <td>ID: {row.subject_id}</td>
                  <td>
                    <span className="badge badge-warning">
                      {row.remarks}
                    </span>
                  </td>
                  <td>
                    {row.status === 'approved' ? (
                      <span className="badge badge-success">Approved</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>Pending</span>
                    )}
                  </td>
                  <td>
                    {row.status !== 'approved' && (
                      <button 
                        onClick={() => handleApprove(row.id)}
                        className="btn btn-primary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No pending reports.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DpDashboard;
