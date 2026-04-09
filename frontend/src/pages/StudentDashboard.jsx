import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import '../assets/css/login.css';
import '../assets/css/student-style.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [student, setStudent] = useState({
    name: localStorage.getItem('name') || "Student",
    classSec: `${localStorage.getItem('department') || ''}-${localStorage.getItem('section') || ''}`,
    rollNo: localStorage.getItem('registerNo') || "..."
  });

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    // onAuthStateChanged is the correct way to handle Firebase session initialization
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // 1. Fetch Student Profile asynchronously without blocking rendering
        getDoc(doc(db, 'user', user.uid)).then(userDoc => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setStudent({
              name: userData.name || "Student",
              classSec: `${userData.department || ''}-${userData.section || ''}`,
              rollNo: userData.registerNo || "N/A"
            });
            if (userData.registerNo) localStorage.setItem('registerNo', userData.registerNo);
          }
        }).catch(err => console.error("Error fetching student profile:", err));

        // 2. Listen for outpass requests
        const q = query(collection(db, 'outpasses'), where('studentId', '==', user.uid));
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              status: `${data.status?.advisor || 'Pending'} / ${data.status?.hod || 'Pending'} / ${data.status?.warden || 'Pending'}`,
              epass: (data.status?.warden === 'Approved') ? 'Approved' : 'N/A'
            };
          });
          setRequests(fetched);
        }, (error) => console.error("Snapshot error:", error));

        setAuthLoading(false);
      } else {
        // Redirect to login if no user found after initialization
        setAuthLoading(false);
        navigate('/');
      }
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, [navigate]);


  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#4b5563', fontWeight: '500' }}>Initializing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="navbar">
        <div className="logo"><img src="/logo.png" alt="Logo" /></div>
        <div className="brand">Online Outpass Management - CIT</div>
        <nav className="nav-links">
          <button onClick={() => navigate('/')} className="nav-btn">Home</button>
          <button onClick={handleLogout} className="nav-btn">Logout</button>
        </nav>
      </header>

      <main className="dashboard" style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <header className="topbar" style={{ width: '100%', maxWidth: '1100px' }}>
          <div id="student-info" className="student-info">
            Student: <strong>{student.name}</strong> | Class: {student.classSec} | Roll No: {student.rollNo}
          </div>
          <nav>
            <button onClick={() => navigate('/request')} className="nav-btn outpass-req-btn">Request Outpass</button>
          </nav>
        </header>

        <section className="panel" style={{ width: '100%', maxWidth: '1100px' }}>
          <h2>Your Requests</h2>
          <table id="requests-table" className="table">
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Out Date</th>
                <th>Out Time</th>
                <th>In Date</th>
                <th>In Time</th>
                <th>Reason</th>
                <th>Status (Advisor / HOD / Warden)</th>
                <th>E-pass</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? requests.map(req => (
                <tr key={req.id}>
                  <td>{req.registerNo || 'N/A'}</td>
                  <td>{req.outDate}</td>
                  <td>{req.outTime}</td>
                  <td>{req.inDate}</td>
                  <td>{req.inTime}</td>
                  <td>{req.reason}</td>
                  <td style={{ display: 'flex', gap: '8px', justifyContent: 'center', borderBottom: 'none' }}>
                    {req.status.split('/').map((s, i) => {
                      const trimmed = s.trim();
                      const lower = trimmed.toLowerCase();
                      const statusClass = lower.includes('approve') ? 'approved' : lower.includes('reject') ? 'rejected' : 'pending';
                      return <span key={i} className={`status ${statusClass}`}>{trimmed}</span>;
                    })}
                  </td>
                  <td>
                    {req.epass === 'Approved' ? (
                      <button onClick={() => setSelectedPass(req)} style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}>
                        View E-Pass
                      </button>
                    ) : (
                      <span className="status pending" style={{ padding: '4px 12px' }}>{req.epass}</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" style={{ textAlign: 'center' }}>No requests found</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      <footer className="footer">
        © 2026 College Outpass System · Built by END2END
      </footer>

      {selectedPass && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#0f172a', marginBottom: '8px', fontSize: '1.5rem' }}>Official E-Pass</h2>
            <p style={{ marginBottom: '5px', fontSize: '1.15rem', color: '#334155' }}><strong>{selectedPass.name}</strong></p>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.95rem' }}>{selectedPass.reason} | Room {selectedPass.roomNo}</p>

            {selectedPass.isValid ? (
              <>
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'inline-block', marginBottom: '15px' }}>
                  <QRCodeSVG value={selectedPass.id} size={200} level="H" />
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '1px', marginBottom: '4px' }}>VERIFICATION CODE</div>
                <p style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '4px', color: '#10b981', margin: '0 0 10px 0' }}>
                  {selectedPass.epassCode}
                </p>
                <p style={{ fontSize: '0.95rem', color: '#16a34a', marginTop: '10px', fontWeight: 'bold', background: '#dcfce7', padding: '8px', borderRadius: '8px' }}>✓ Approved by Warden</p>
              </>
            ) : (
              <div style={{ padding: '30px 10px', color: '#dc2626', fontWeight: 'bold', fontSize: '1.2rem', background: '#fee2e2', borderRadius: '12px' }}>
                This E-Pass has already been used to exit or is invalid.
              </div>
            )}

            <button onClick={() => setSelectedPass(null)} style={{ marginTop: '25px', width: '100%', padding: '14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', transition: '0.2s' }}>Close Window</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
