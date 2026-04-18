import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import HodDashboard from './pages/HodDashboard';
import DpDashboard from './pages/DpDashboard';
import AdminDashboard from './pages/AdminDashboard';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MainLayout = ({ user, handleLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-layout">

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Close button — mobile only */}
        <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
          <X size={20} />
        </button>

        <div className="sidebar-header">
          <BookOpen style={{ display: 'inline', marginRight: '0.5rem', marginBottom: '-5px' }} />
          ClassTrack
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active" onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            Dashboard
          </div>
          <div className="nav-item" onClick={closeSidebar}>
            <User size={20} />
            Profile
          </div>
        </nav>
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <div style={{ paddingBottom: '10px', fontSize: '0.8rem', color: '#64748b' }}>
            Logged in as <b>{user?.name}</b>
            <br />
            <span style={{ textTransform: 'capitalize', color: '#94a3b8' }}>({user?.role})</span>
          </div>
          <button onClick={handleLogout} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="topbar">
          {/* Hamburger — mobile only */}
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <h1>Dashboard</h1>
        </div>

        <div style={{ flex: 1 }}>
          {children}
        </div>

        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} ClassTrack Attendance System. Designed & Powered by TSNP Computing & Informatics Department.</p>
            <div className="footer-links">
              <a href="#">Help</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setUser(res.data.user);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          navigate('/');
        });
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);

    // Redirect based on role
    switch (userData.role) {
      case 'student': navigate('/student'); break;
      case 'trainer': navigate('/trainer'); break;
      case 'hod': navigate('/hod'); break;
      case 'hos': navigate('/hod'); break; // Route to HOD dashboard for now
      case 'dp': navigate('/dp'); break;
      case 'admin': navigate('/admin'); break;
      default: navigate('/'); break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  const ProtectedRoute = ({ role, component: Component }) => {
    if (!user) return <Navigate to="/" />;
    if (user.role !== role) {
      return <div>Unauthorized Access</div>;
    }
    return <MainLayout user={user} handleLogout={handleLogout}><Component user={user} /></MainLayout>;
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <Login onLogin={handleLogin} />} />
      <Route path="/student" element={<ProtectedRoute role="student" component={StudentDashboard} />} />
      <Route path="/trainer" element={<ProtectedRoute role="trainer" component={TrainerDashboard} />} />
      <Route path="/hod" element={<ProtectedRoute role="hod" component={HodDashboard} />} />
      <Route path="/hos" element={<ProtectedRoute role="hos" component={HodDashboard} />} />
      <Route path="/dp" element={<ProtectedRoute role="dp" component={DpDashboard} />} />
      <Route path="/admin" element={<ProtectedRoute role="admin" component={AdminDashboard} />} />
    </Routes>
  );
}

export default App;
