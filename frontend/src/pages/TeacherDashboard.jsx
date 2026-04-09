import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import '../assets/css/login.css';
import '../assets/css/staff_dashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [btnLoading, setBtnLoading] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const myDept = localStorage.getItem('department');
        const mySec = localStorage.getItem('section');
        
        // Start with a base query
        let q = query(collection(db, 'outpasses'), where('status.advisor', '==', 'Pending'));
        
        // Refine if dept/sec known
        if (myDept && mySec) {
          q = query(
            collection(db, 'outpasses'), 
            where('status.advisor', '==', 'Pending'),
            where('department', '==', myDept),
            where('section', '==', mySec)
          );
        }

        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRequests(fetched);
        }, (error) => {
          console.error("Error fetching requests:", error);
        });

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

  const filteredRequests = requests.filter(req => {
    const term = searchTerm.toLowerCase();
    return (
      (req.name || '').toLowerCase().includes(term) ||
      (req.registerNo || '').toLowerCase().includes(term) ||
      (req.parentsMobileNo || '').toLowerCase().includes(term) ||
      (req.department || '').toLowerCase().includes(term) ||
      (req.section || '').toLowerCase().includes(term) ||
      (req.id || '').toLowerCase().includes(term)
    );
  });



  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate('/');
  };

  const handleParentOverride = async (id) => {
    if (window.confirm("Did the parent manually approve this over a phone call? If yes, click OK to override and approve.")) {
      setBtnLoading(id);
      try {
        const docRef = doc(db, 'outpasses', id);
        await updateDoc(docRef, {
          'status.parent': 'Approved'
        });
        alert("✅ Parent status overridden successfully!");
      } catch (error) {
        console.error("Error overriding parent status:", error);
        alert("❌ Failed to override status. Check connection.");
      }
      setBtnLoading(null);
    }
  };

  const handleAction = async (id, action) => {
    setBtnLoading(id);
    try {
      const docRef = doc(db, 'outpasses', id);
      await updateDoc(docRef, {
        'status.advisor': action === 'approve' ? 'Approved' : 'Rejected'
      });
      alert(`✅ Request ${action === 'approve' ? 'Approved' : 'Rejected'}!`);
    } catch (error) {
      console.error("Error updating:", error);
      alert("❌ Failed to update status.");
    }
    setBtnLoading(null);
  };


  if (authLoading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#4b5563', fontWeight: '500' }}>Initializing secure staff session...</p>
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

      <main className="staff-main" style={{ marginTop: '18px', flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '1100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Pending Outpass Requests</h2>
              <p className="subtitle" style={{ color: 'var(--muted)', margin: '5px 0 0 0' }}>Approve or reject student requests below.</p>
            </div>
          </div>

          <div className="search-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by student name, register number, department, or section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table className="table" id="requestTable">
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Student</th>
                <th>Parent Mobile</th>
                <th>Reason</th>
                <th>From</th>
                <th>To</th>
                <th>Parent Status</th>
                <th>Advisor Status</th>
                <th>Action</th>

              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? filteredRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.registerNo || 'N/A'}</td>
                  <td>
                    {req.name || 'Unknown'}
                    {req.status?.parent === 'Approved' && <span className="ready-badge">Ready</span>}
                  </td>
                  <td>{req.parentsMobileNo || 'N/A'}</td>
                  <td>{req.reason}</td>
                  <td>{`${req.outDate} ${req.outTime}`}</td>
                  <td>{`${req.inDate} ${req.inTime}`}</td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span className={`status ${req.status?.parent === 'Approved' ? 'approved' : req.status?.parent === 'Rejected' ? 'rejected' : 'pending'}`}>
                        {req.status?.parent || 'Pending'}
                      </span>
                      {req.status?.parent !== 'Approved' && (
                        <button disabled={btnLoading === req.id} className="btn" style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#2563eb' }} onClick={() => handleParentOverride(req.id)}>
                          {btnLoading === req.id ? '...' : '📞 Override'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status ${req.status?.advisor?.toLowerCase().includes('approve') ? 'approved' : req.status?.advisor?.toLowerCase().includes('reject') ? 'rejected' : 'pending'}`}>
                      {req.status?.advisor || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button 
                      disabled={req.status?.parent !== 'Approved' || btnLoading === req.id} 
                      className="btn approve" 
                      title={req.status?.parent !== 'Approved' ? 'Awaiting Parent Approval' : ''} 
                      style={{ marginRight: '5px', opacity: req.status?.parent !== 'Approved' ? 0.5 : 1, cursor: (req.status?.parent !== 'Approved' || btnLoading === req.id) ? 'not-allowed' : 'pointer' }} 
                      onClick={() => handleAction(req.id, 'approve')}>
                        {btnLoading === req.id ? '...' : 'Approve'}
                    </button>
                    <button disabled={btnLoading === req.id} className="btn reject" onClick={() => handleAction(req.id, 'reject')}>
                        {btnLoading === req.id ? '...' : 'Reject'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="9" style={{ textAlign: 'center' }}>No requests found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>


      <footer className="footer">
        © 2026 College Outpass System · Built by END2END
      </footer>
    </div>
  );
};

export default TeacherDashboard;
