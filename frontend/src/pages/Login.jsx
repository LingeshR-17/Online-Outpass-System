import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../assets/css/style.css';

const Login = () => {
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role) {
      if (role === 'student') navigate('/student');
      else if (role === 'class_advisor') navigate('/teacher');
      else if (role === 'hod') navigate('/hod');
      else if (role === 'warden') navigate('/warden');
      else if (role === 'security') navigate('/security');
    }
  }, [navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please fill in both fields.');
      return;
    }

    try {
      // Login user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Logged in Auth UID:', user.uid);

      let userData = null;

      // Collection name should be "user", not "users"
      const userRef = doc(db, 'user', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log('✅ Found Firestore document using UID as ID');
        userData = userSnap.data();
      } else {
        console.warn("⚠️ No document found by ID. Trying 'uid' field lookup...");
        const q = query(collection(db, 'user'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userData = querySnapshot.docs[0].data();
          console.log('✅ Found Firestore document using UID field:', userData);
        }
      }

      if (userData) {
        if (userData.isApproved === false) {
          setErrorMsg('Your account is pending approval by the authority.');
          await auth.signOut();
          return;
        }

        const role = (userData.role || '').trim().toLowerCase();
        const name = userData.name || 'User';

        // Store session info
        localStorage.setItem('name', name);
        localStorage.setItem('email', email);
        localStorage.setItem('role', role);
        localStorage.setItem('isMainHod', userData.isMainHod ? 'true' : 'false');
        if (userData.parentEmail) localStorage.setItem('parentEmail', userData.parentEmail);
        if (userData.parentPhone) localStorage.setItem('parentPhone', userData.parentPhone);
        if (userData.department) localStorage.setItem('department', userData.department);
        if (userData.section) localStorage.setItem('section', userData.section);
        if (userData.hostelName) localStorage.setItem('hostelName', userData.hostelName);
        if (userData.hostelFloor) localStorage.setItem('hostelFloor', userData.hostelFloor);
        if (userData.registerNo) localStorage.setItem('registerNo', userData.registerNo);

        setSuccessMsg(`Welcome, ${name}! Redirecting...`);
        console.log('👤 Firestore user data:', userData);

        // Role-based redirect
        setTimeout(() => {
          if (role === 'student') navigate('/student');
          else if (role === 'class_advisor') navigate('/teacher');
          else if (role === 'hod') navigate('/hod');
          else if (role === 'warden') navigate('/warden');
          else if (role === 'security') navigate('/security');
          else {
            console.error('❌ Invalid or missing role:', role);
            setErrorMsg('Invalid role in database. Contact admin.');
            auth.signOut();
          }
        }, 1000);
      } else {
        console.error('❌ User record not found in Firestore for UID:', user.uid);
        setErrorMsg('Account data missing in database. Contact admin.');
        await auth.signOut();
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      switch (error.code) {
        case 'auth/wrong-password':
          setErrorMsg('Incorrect password!');
          break;
        case 'auth/user-not-found':
          setErrorMsg('No account found with this email!');
          break;
        case 'auth/invalid-email':
          setErrorMsg('Invalid email format!');
          break;
        case 'auth/invalid-credential':
          setErrorMsg('Invalid credentials provided!');
          break;
        default:
          setErrorMsg('Login failed: ' + error.message);
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
          <h1>College Outpass Management</h1>
          <p>Apply for outpasses, get approvals digitally and let security verify using QR codes — all in one place.</p>

          <div className="login-grid" style={{ marginTop: '18px' }}>
            <div className="form" style={{ maxWidth: '520px', margin: '22px auto' }}>
              <h2>Login To Outpass System</h2>
              <form id="loginForm" onSubmit={handleLogin}>
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

                <button className="btn" type="submit">Login</button>
                {errorMsg && <p id="errorMsg" style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                {successMsg && <p id="successMsg" style={{ color: 'green', marginTop: '10px' }}>{successMsg}</p>}
                <p style={{ marginTop: '15px' }}>
                  Don't have an account? <Link to="/register">Register here</Link>
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

export default Login;
