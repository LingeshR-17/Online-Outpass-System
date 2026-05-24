import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import '../assets/css/hod.css';

const HodDashboard = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [btnLoading, setBtnLoading] = useState(null);

    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUsers = null;
        let unsubscribeOutpasses = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const usersQ = query(collection(db, 'user'), where('isApproved', '==', false));
                unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
                    const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setPendingUsers(fetchedUsers);
                }, (error) => console.error(error));

                const q = query(collection(db, 'outpasses'), where('status.hod', '==', 'Pending'));
                unsubscribeOutpasses = onSnapshot(q, (snapshot) => {
                    const fetched = snapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(req => req.status?.advisor === 'Approved');
                    setRequests(fetched);
                }, (error) => console.error(error));

                setAuthLoading(false);
            } else {
                setAuthLoading(false);
                navigate('/');
            }
        });

        return () => {
            if (unsubscribeUsers) unsubscribeUsers();
            if (unsubscribeOutpasses) unsubscribeOutpasses();
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
            (req.id || '').toLowerCase().includes(term)
        );
    });

    const filteredUsers = pendingUsers.filter(user => {
        const term = searchTerm.toLowerCase();
        return (
            (user.name || '').toLowerCase().includes(term) ||
            (user.registerNo || '').toLowerCase().includes(term) ||
            (user.email || '').toLowerCase().includes(term)
        );
    });

    const handleUserApproval = async (id, actionType) => {
        setBtnLoading(id);
        try {
            const userRef = doc(db, 'user', id);
            if (actionType === 'approve') {
                await updateDoc(userRef, { isApproved: true });
            } else if (actionType === 'reject') {
                await deleteDoc(userRef);
            }
        } catch (e) {
            console.error("User approval error:", e);
        }
        setBtnLoading(null);
    };

    const handleAction = async (id, actionType) => {
        setBtnLoading(id);
        try {
            const docRef = doc(db, 'outpasses', id);
            await updateDoc(docRef, {
                'status.hod': actionType === 'approve' ? 'Approved' : 'Rejected'
            });
        } catch (e) {
            console.error("Update error:", e);
        }
        setBtnLoading(null);
    };


    if (authLoading) {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#4b5563', fontWeight: '500' }}>Initializing secure HOD session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Navbar */}
            <header className="navbar">
                <div className="logo">
                    <img src="/logo.png" alt="College Logo" />
                </div>
                <div className="brand">Online Outpass Management - CIT</div>
                <nav className="nav-links">
                    <button onClick={() => navigate('/')} className="nav-btn">Home</button>
                    <button onClick={handleLogout} className="nav-btn">Logout</button>
                </nav>
            </header>

            {/* Main Content */}
            <main style={{ marginTop: '18px', flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="card" style={{ maxWidth: '1100px', width: '95%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Requests Forwarded by Staff</h2>
                            <p style={{ color: 'var(--muted)', margin: '5px 0 0 0' }}>Approve or reject requests forwarded to you by staff members.</p>
                        </div>
                    </div>

                    <div className="search-container">
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search by student name, register number or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <table className="table" id="hodTable">
                        <thead>
                            <tr>
                                <th>Reg No</th>
                                <th>Student</th>
                                <th>Reason</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Staff Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="hodRequests">
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map(req => (
                                    <tr key={req.id}>
                                        <td>{req.registerNo || 'N/A'}</td>
                                        <td>{req.name || 'Unknown'}</td>
                                        <td>{req.reason}</td>
                                        <td>{`${req.outDate} ${req.outTime}`}</td>
                                        <td>{`${req.inDate} ${req.inTime}`}</td>
                                        <td>
                                            <span className={`status ${req.status?.hod?.toLowerCase().includes('approve') ? 'approved' : req.status?.hod?.toLowerCase().includes('reject') ? 'rejected' : 'pending'}`}>
                                                {req.status?.hod || 'Pending'}
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
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center' }}>No requests found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {localStorage.getItem('isMainHod') === 'true' && (
                <div className="card" style={{ marginTop: '20px', maxWidth: '1100px', width: '95%' }}>
                    <h2>Pending User Registrations</h2>
                    <p style={{ color: 'var(--muted)' }}>Approve or reject newly registered users.</p>

                    <table className="table" id="pendingUsersTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Reg No</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Date Registered</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.registerNo || 'N/A'}</td>
                                        <td>{user.email}</td>
                                        <td style={{textTransform: 'capitalize'}}>{user.role}</td>
                                        <td>
                                            {(() => {
                                                if (!user.createdAt) return 'N/A';
                                                // Handle Firestore Timestamp {seconds, nanoseconds}
                                                if (user.createdAt.seconds) return new Date(user.createdAt.seconds * 1000).toLocaleDateString();
                                                // Handle ISO String from Register.jsx
                                                return new Date(user.createdAt).toLocaleDateString();
                                            })()}
                                        </td>
                                        <td>
                                            <button disabled={btnLoading === user.id} className="btn approve" style={{marginRight: '5px'}} onClick={() => handleUserApproval(user.id, 'approve')}>
                                                {btnLoading === user.id ? '...' : 'Approve'}
                                            </button>
                                            <button disabled={btnLoading === user.id} className="btn reject" onClick={() => handleUserApproval(user.id, 'reject')}>
                                                {btnLoading === user.id ? '...' : 'Reject'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No pending registrations matching your search.</td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>
                )}
            </main>


            {/* Footer */}
            <footer className="footer">
                © 2026 College Outpass System · Built by END2END
            </footer>
        </div>
    );
};

export default HodDashboard;
