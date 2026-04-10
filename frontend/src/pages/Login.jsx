import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      <div className="auth-card" style={{ maxWidth: '400px', width: '90%', margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '50%' }}>
            <BookOpen size={40} color="var(--primary-color)" />
          </div>
        </div>
        <h2>ClassTrack Login</h2>
        {error && <div style={{ color: 'var(--accent-error)', marginBottom: '1rem', background: '#fee2e2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@test.com"
              required 
            />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Password</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '2.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary">Sign In</button>
        </form>
      </div>

      <footer style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#e2e8f0'
      }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} ClassTrack Attendance System. Designed & Powered by TSNP Computing & Informatics Department.</p>
      </footer>
    </div>
  );
};

export default Login;
