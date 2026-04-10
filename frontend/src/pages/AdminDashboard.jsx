import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { Settings, Users, BookA, RefreshCw, Edit, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [editingUser, setEditingUser] = useState(null);
    const [editingSubject, setEditingSubject] = useState(null);
    const [subjectForm, setSubjectForm] = useState({ name: '', total_lessons_per_week: '' });
    
    // Modal state
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', action: null });

    // Form inputs for user
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'trainer', class_name: '', active: true });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'subjects') fetchSubjects();
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/users`, { headers });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/subjects`, { headers });
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const showModal = (title, message, action) => {
        setModal({ isOpen: true, title, message, action });
    };

    const confirmModal = () => {
        if (modal.action) modal.action();
        setModal({ isOpen: false, title: '', message: '', action: null });
    };

    const cancelModal = () => {
        setModal({ isOpen: false, title: '', message: '', action: null });
    };

    const handleUserFormChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const showMessage = (msg, type = 'success', duration = 4000) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), duration);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await axios.put(`${API_URL}/admin/users/${editingUser.id}`, formData, { headers });
                showMessage('✅ User updated successfully');
            } else {
                await axios.post(`${API_URL}/admin/users`, formData, { headers });
                showMessage('✅ User created successfully');
            }
            setFormData({ name: '', email: '', password: '', role: 'trainer', class_name: '', active: true });
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            showMessage('❌ Error saving user. Please check the details and try again.', 'error');
        }
    };

    const handleEditUser = (user) => {
        showModal('Edit Profile', `Are you sure you want to load ${user.name}'s profile to edit? Any unsaved form data will be replaced.`, () => {
            setEditingUser(user);
            setFormData({ name: user.name, email: user.email, password: '', role: user.role, class_name: user.class_name || '', active: user.active });
            try {
                document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
            } catch(e) { window.scrollTo(0, 0); }
        });
    };

    const handleDeleteUser = async (id) => {
        showModal('Delete User', 'Are you sure you want to delete this user? This action cannot be undone.', async () => {
            try {
                await axios.delete(`${API_URL}/admin/users/${id}`, { headers });
                showMessage('🗑️ User deleted successfully.', 'warning');
                fetchUsers();
            } catch (err) {
                showMessage('❌ Error deleting user.', 'error');
            }
        });
    };

    const handleSaveSubject = async (e) => {
        e.preventDefault();
        try {
            if (editingSubject) {
                await axios.put(`${API_URL}/admin/subjects/${editingSubject.id}`, subjectForm, { headers });
                showMessage('✅ Subject updated successfully.');
            } else {
                await axios.post(`${API_URL}/admin/subjects`, subjectForm, { headers });
                showMessage('✅ Subject created successfully.');
            }
            setEditingSubject(null);
            setSubjectForm({ name: '', total_lessons_per_week: '' });
            fetchSubjects();
        } catch (err) {
            showMessage('❌ Error saving subject.', 'error');
        }
    };

    const handleEditSubject = (s) => {
        showModal('Edit Subject', `Load "${s.name}" into the form for editing?`, () => {
            setEditingSubject(s);
            setSubjectForm({ name: s.name, total_lessons_per_week: s.total_lessons_per_week });
            try { document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
        });
    };

    const handleDeleteSubject = (id, name) => {
        showModal('Delete Subject', `Are you sure you want to delete "${name}"? This cannot be undone.`, async () => {
            try {
                await axios.delete(`${API_URL}/admin/subjects/${id}`, { headers });
                showMessage('🗑️ Subject deleted.', 'warning');
                fetchSubjects();
            } catch (err) {
                showMessage('❌ Error deleting subject.', 'error');
            }
        });
    };

    const handleResetTerm = async () => {
        showModal('Reset Full Term', 'Are you sure you want to permanently delete ALL attendance records for a new 12-week term? This action CANNOT be reversed.', async () => {
            try {
                const res = await axios.post(`${API_URL}/admin/reset-term`, {}, { headers });
                showMessage(`🔄 ${res.data.message || 'Full term reset. All records cleared.'}`, 'warning');
            } catch (err) {
                showMessage('❌ Error resetting term.', 'error');
            }
        });
    };

    const handleResetWeek = async () => {
        showModal('Reset Weekly Analysis', 'This will remove all attendance records from the past 7 days only. Earlier term records are preserved. Continue?', async () => {
            try {
                const res = await axios.post(`${API_URL}/admin/reset-week`, {}, { headers });
                showMessage(`🔄 ${res.data.message || 'Weekly analysis reset successfully.'}`, 'warning');
            } catch (err) {
                showMessage('❌ Error resetting weekly analysis.', 'error');
            }
        });
    };

    return (
        <div>
            {modal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{modal.title}</h3>
                        <p>{modal.message}</p>
                        <div className="modal-actions">
                            <button className="btn btn-outline" style={{width: 'auto', border: '1px solid #cbd5e1', padding: '0.5rem 1rem'}} onClick={cancelModal}>Cancel</button>
                            <button className="btn btn-primary" style={{
                                width: 'auto', padding: '0.5rem 1rem',
                                backgroundColor: modal.title.includes('Delete') || modal.title.includes('Full Term')
                                    ? 'var(--accent-error)'
                                    : modal.title.includes('Weekly')
                                    ? '#f59e0b'
                                    : 'var(--primary-color)'
                            }} onClick={confirmModal}>Confirm Action</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')}>
                        <Users size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Manage Users
                    </button>
                    <button className={`btn ${activeTab === 'subjects' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('subjects')}>
                        <BookA size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Manage Subjects
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                        onClick={handleResetWeek}
                        title="Clears attendance records from the past 7 days only"
                    >
                        <RefreshCw size={15} /> Reset Weekly
                    </button>
                    <button
                        className="btn"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                        onClick={handleResetTerm}
                        title="Permanently clears ALL records for a fresh 12-week term"
                    >
                        <RefreshCw size={15} /> Reset Full Term
                    </button>
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '0.9rem 1.25rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: messageType === 'error' ? '#fee2e2' : messageType === 'warning' ? '#fef3c7' : '#d1fae5',
                    color: messageType === 'error' ? '#991b1b' : messageType === 'warning' ? '#92400e' : '#065f46',
                    border: `1px solid ${messageType === 'error' ? '#fca5a5' : messageType === 'warning' ? '#fcd34d' : '#6ee7b7'}`,
                }}>{message}</div>
            )}

            {activeTab === 'users' && (
                <div className="card">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={20} /> System Settings - {editingUser ? 'Edit User' : 'Add User'}</h2>
                    <form onSubmit={handleSaveUser} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleUserFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" className="form-control" required value={formData.email} onChange={handleUserFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Password {editingUser && '(Leave blank to keep)'}</label>
                            <input type="password" name="password" className="form-control" placeholder={editingUser ? '' : 'Default: password123'} value={formData.password} onChange={handleUserFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select name="role" className="form-control" required value={formData.role} onChange={handleUserFormChange}>
                                <option value="trainer">Trainer/Teacher</option>
                                <option value="student">Class Representative</option>
                                <option value="hod">Head of Department</option>
                                <option value="hos">Head of Section</option>
                                <option value="dp">Deputy Principal Academics</option>
                                <option value="admin">System Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Class Name (If Class Rep)</label>
                            <input type="text" name="class_name" className="form-control" placeholder="e.g. IT Class 1" value={formData.class_name} onChange={handleUserFormChange} />
                        </div>
                        {editingUser && (
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" name="active" checked={formData.active} onChange={handleUserFormChange} /> Active Account
                                </label>
                            </div>
                        )}
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', gridColumn: '1 / -1' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>{editingUser ? 'Save Changes' : 'Add User'}</button>
                            {editingUser && <button type="button" className="btn btn-outline" style={{width: 'auto'}} onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'trainer', class_name: '', active: true }); }}>Cancel Edit</button>}
                        </div>
                    </form>

                    <h3>Existing Users</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Class Name</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{u.role === 'student' ? 'class rep' : u.role}</td>
                                        <td>{u.class_name || '-'}</td>
                                        <td>{u.active ? 'Active' : 'Inactive'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    title="Edit this user"
                                                    style={{ padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                                                    onClick={() => handleEditUser(u)}
                                                >
                                                    <Edit size={13} /> Edit
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    title="Delete this user"
                                                    style={{ padding: '0.3rem 0.7rem', borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                                                    onClick={() => handleDeleteUser(u.id)}
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'subjects' && (
                <div className="card">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookA size={20} /> {editingSubject ? 'Edit Subject / Unit' : 'Add Subject / Unit'}
                    </h2>

                    <form onSubmit={handleSaveSubject} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label>Unit Name</label>
                            <input
                                type="text"
                                className="form-control"
                                required
                                value={subjectForm.name}
                                onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                placeholder="e.g. Mathematics"
                            />
                        </div>
                        <div className="form-group">
                            <label>Lessons Per Week</label>
                            <input
                                type="number"
                                className="form-control"
                                required
                                min="1"
                                placeholder="e.g. 5"
                                value={subjectForm.total_lessons_per_week}
                                onChange={e => setSubjectForm({ ...subjectForm, total_lessons_per_week: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editingSubject ? 'Save Changes' : 'Add Unit'}
                            </button>
                            {editingSubject && (
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                                    setEditingSubject(null);
                                    setSubjectForm({ name: '', total_lessons_per_week: '' });
                                }}>Cancel</button>
                            )}
                        </div>
                    </form>

                    <h3>Existing Units</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Unit Name</th>
                                    <th>Lessons / Week</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.id}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.total_lessons_per_week}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    title="Edit this unit"
                                                    style={{ padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                                                    onClick={() => handleEditSubject(s)}
                                                >
                                                    <Edit size={13} /> Edit
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    title="Delete this unit"
                                                    style={{ padding: '0.3rem 0.7rem', borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                                                    onClick={() => handleDeleteSubject(s.id, s.name)}
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {subjects.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem' }}>No units found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
