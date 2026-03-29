import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../assets/css/style.css'; // Assuming style.css is used

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [registerNo, setRegisterNo] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [hostelFloor, setHostelFloor] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email || !password || !role) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'user', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: role,
        registerNo: registerNo || '',
        ...(role === 'student' && { parentEmail, parentPhone }),
        ...((role === 'class_advisor' || role === 'student') && { department, section }),
        ...(role === 'warden' && { hostelName, hostelFloor }),
        isApproved: false, // New users are pending approval
        createdAt: new Date().toISOString()
      });

      setSuccessMsg(`Registration successful! Your account is pending approval by the authority.`);
      
      // Auto-redirect to login after short delay
      setTimeout(() => {
        auth.signOut(); // Ensure they are logged out
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('❌ Registration error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrorMsg('An account with this email already exists.');
          break;
        case 'auth/weak-password':
          setErrorMsg('Password should be at least 6 characters.');
          break;
        case 'auth/invalid-email':
          setErrorMsg('Invalid email format!');
          break;
        default:
          setErrorMsg('Registration failed: ' + error.message);
      }
    }
  };

  return (
    <div className="login-container">
      <header className="navbar">
        <div className="logo">
          <img src="/logo.png" alt="Logo" />
        </div>
        <div className="brand">Online Outpass Management - CIT</div>
      </header>

      <main className="hero">
        <div className="hero-card">
          <h1>Registration</h1>
          <p>Create a new account to apply for outpasses or manage approvals.</p>

          <div className="login-grid" style={{ marginTop: '18px' }}>
            <div className="form" style={{ maxWidth: '520px', margin: '22px auto' }}>
              <h2>Sign Up</h2>
              <form id="registerForm" onSubmit={handleRegister}>
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <label htmlFor="email">Email ID</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <label htmlFor="role">Role</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }}>
                  <option value="student">Student</option>
                  <option value="class_advisor">Class Advisor</option>
                  <option value="hod">HOD</option>
                  <option value="warden">Warden</option>
                  <option value="security">Security</option>
                </select>

                {role === 'student' && (
                  <>
                    <label htmlFor="registerNo">Registration Number</label>
                    <input
                      id="registerNo"
                      type="text"
                      value={registerNo}
                      onChange={(e) => setRegisterNo(e.target.value)}
                      required
                      placeholder="e.g. 25CSK032"
                    />
                  </>
                )}

                {(role === 'class_advisor' || role === 'student') && (
                  <>
                    <label htmlFor="department">Department</label>
                    <input id="department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required placeholder="e.g. CSE" />

                    <label htmlFor="section">Section</label>
                    <input id="section" type="text" value={section} onChange={(e) => setSection(e.target.value)} required placeholder="e.g. K" />
                  </>
                )}

                {role === 'warden' && (
                  <>
                    <label htmlFor="hostelName">Assigned Hostel</label>
                    <input id="hostelName" type="text" value={hostelName} onChange={(e) => setHostelName(e.target.value)} required placeholder="e.g. Pothigai" />

                    <label htmlFor="hostelFloor">Assigned Floor</label>
                    <input id="hostelFloor" type="text" value={hostelFloor} onChange={(e) => setHostelFloor(e.target.value)} required placeholder="e.g. 1st Floor" />
                  </>
                )}

                {role === 'student' && (
                  <>
                    <label htmlFor="parentEmail">Parent's Email</label>
                    <input
                      id="parentEmail"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                    />

                    <label htmlFor="parentPhone">Parent's Mobile No</label>
                    <input
                      id="parentPhone"
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      required
                    />
                  </>
                )}

                <button className="btn" type="submit">Register</button>
                {errorMsg && <p id="errorMsg" style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                {successMsg && <p id="successMsg" style={{ color: 'green', marginTop: '10px' }}>{successMsg}</p>}
                
                <p style={{ marginTop: '15px' }}>
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        © 2026 College Outpass System · Built by END2END
      </footer>
    </div>
  );
};

export default Register;
