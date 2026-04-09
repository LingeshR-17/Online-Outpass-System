import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import '../assets/css/hod.css';

const WardenDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [btnLoading, setBtnLoading] = useState(null);


  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const myHostel = localStorage.getItem('hostelName');
        const myFloor = localStorage.getItem('hostelFloor');
        
        let q = query(collection(db, 'outpasses'), where('status.warden', '==', 'Pending'));
        if (myHostel && myFloor) {
          q = query(
            collection(db, 'outpasses'), 
            where('status.warden', '==', 'Pending'),
            where('hostelName', '==', myHostel),
            where('hostelFloor', '==', myFloor)
          );
        }

        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs
             .map(doc => ({ id: doc.id, ...doc.data() }))
             .filter(req => req.status?.hod === 'Approved');
          setRequests(fetched);
        }, (error) => console.error(error));

        setAuthLoading(false);
      } else {
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

  const filteredRequests = requests.filter(req => {
    const term = searchTerm.toLowerCase();
    return (
      (req.name || '').toLowerCase().includes(term) ||
      (req.registerNo || '').toLowerCase().includes(term) ||
      (req.roomNo || '').toLowerCase().includes(term) ||
      (req.hostelName || '').toLowerCase().includes(term) ||
      (req.id || '').toLowerCase().includes(term)
    );
  });

  const handleAction = async (id, action) => {
    setBtnLoading(id);
    try {
      const docRef = doc(db, 'outpasses', id);
      const updates = { 'status.warden': action === 'approve' ? 'Approved' : 'Rejected' };
      if (action === 'approve') {
        updates.epassCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        updates.isValid = true;
      }
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating outpass:", error);
    }
    setBtnLoading(null);
  };


  if (authLoading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#4b5563', fontWeight: '500' }}>Initializing secure warden session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="navbar">
        <div className="logo"><img src="/logo.png" alt="College Logo" /></div>
        <div className="brand">Online Outpass Management - CIT</div>
        <nav className="nav-links">
          <button onClick={() => navigate('/')} className="nav-btn">Home</button>
          <button onClick={handleLogout} className="nav-btn">Logout</button>
        </nav>
      </header>

      <main style={{ marginTop: '18px', flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '1100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Requests Forwarded by HOD</h2>
              <p style={{ color: 'var(--muted)', margin: '5px 0 0 0' }}>View student details and finalize their outpass requests.</p>
            </div>
          </div>

          <div className="search-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by student name, register number, room, or hostel..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table className="table" id="wardenTable">
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Student Name</th>
                <th>Phone No</th>
                <th>Class</th>
                <th>Room No</th>
                <th>Hostel</th>
                <th>Floor</th>
                <th>Reason</th>
                <th>From</th>
                <th>To</th>
                <th>HOD Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="wardenRequests">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(req => (
                  <tr key={req.id}>
                    <td>{req.registerNo || 'N/A'}</td>
                    <td>{req.name || 'Unknown'}</td>
                    <td>{req.mobileNo || 'N/A'}</td>
                    <td>{req.department || 'N/A'}</td>
                    <td>{req.roomNo || 'N/A'}</td>
                    <td>{req.hostelName || 'N/A'}</td>
                    <td>{req.hostelFloor || 'N/A'}</td>
                    <td>{req.reason}</td>
                    <td>{`${req.outDate} ${req.outTime}`}</td>
                    <td>{`${req.inDate} ${req.inTime}`}</td>
                    <td>
                      <span className={`status ${req.status?.warden?.toLowerCase().includes('approve') ? 'approved' : req.status?.warden?.toLowerCase().includes('reject') ? 'rejected' : 'pending'}`}>
                        {req.status?.warden || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button disabled={btnLoading === req.id} className="btn approve" style={{marginRight: '5px'}} onClick={() => handleAction(req.id, 'approve')}>
                        {btnLoading === req.id ? '...' : 'Approve'}
                      </button>
                      <button disabled={btnLoading === req.id} className="btn reject" onClick={() => handleAction(req.id, 'reject')}>
                        {btnLoading === req.id ? '...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="11" style={{ textAlign: 'center' }}>No requests found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>


      <footer className="footer">
        © 2026 College Outpass System
      </footer>
    </div>
  );
};

export default WardenDashboard;
