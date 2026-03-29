import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../assets/css/RequestOutpass.css';

const RequestOutpass = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: localStorage.getItem('name') || '',
    registerNo: localStorage.getItem('registerNo') || '',
    department: localStorage.getItem('department') || '',
    section: localStorage.getItem('section') || '',
    hostelName: '',
    hostelFloor: '',
    roomNo: '',
    outDate: '',
    inDate: '',
    outTimeHour: '09',
    outTimeMin: '00',
    outTimePeriod: 'AM',
    inTimeHour: '09',
    inTimeMin: '00',
    inTimePeriod: 'AM',
    reason: '',
    mobileNo: '',
    parentsMobileNo: localStorage.getItem('parentPhone') || '',
    parentEmail: localStorage.getItem('parentEmail') || ''
  });

  const [loading, setLoading] = useState(false);

  // Time options
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert('Authentication required. Please login again.');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      // Consolidate 12h time segments
      const outTimeStr = `${formData.outTimeHour}:${formData.outTimeMin} ${formData.outTimePeriod}`;
      const inTimeStr = `${formData.inTimeHour}:${formData.inTimeMin} ${formData.inTimePeriod}`;

      // Create data for save (minus segment fields)
      const { outTimeHour, outTimeMin, outTimePeriod, inTimeHour, inTimeMin, inTimePeriod, ...rest } = formData;
      
      const docRef = await addDoc(collection(db, 'outpasses'), {
        ...rest,
        outTime: outTimeStr,
        inTime: inTimeStr,
        studentId: user.uid,
        status: {
          parent: 'Pending',
          advisor: 'Pending',
          hod: 'Pending',
          warden: 'Pending'
        },
        createdAt: serverTimestamp()
      });

      // Hit our Node backend to send Email and SMS
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        await fetch(`${BACKEND_URL}/api/notify-parent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outpassId: docRef.id,
            studentName: formData.name,
            parentEmail: formData.parentEmail,
            parentsMobileNo: formData.parentsMobileNo
          })
        });
      } catch (err) {
        console.error('Backend notification failed (is backend running?):', err);
      }

      alert('Outpass request submitted! Parent has been notified.');
      navigate('/student');
    } catch (error) {
      console.error('Error securely submitting outpass:', error);
      alert('Failed to submit outpass: ' + error.message);
    }
    setLoading(false);
  };


  return (
    <div className="container">
      <header className="navbar">
        <div className="logo"><img src="/logo.png" alt="CIT Logo" /></div>
        <div className="brand">Online Outpass Management - CIT</div>
        <nav className="nav-links">
          <button onClick={() => navigate('/student')} className="nav-btn">Back to Dashboard</button>
        </nav>
      </header>

      <main className="form-wrapper">
        <div className="card form-panel">
          <h2 style={{color: '#343a40', marginBottom: '20px'}}>Request New Outpass</h2>
          <form onSubmit={handleSubmit} className="outpass-form">
            <div className="form-grid">
              
              <div>
                <label>Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Vinayak S" />
              </div>
              
              <div>
                <label>Registration Number</label>
                <input required type="text" name="registerNo" value={formData.registerNo} onChange={handleChange} placeholder="e.g. 25CSK032" />
              </div>
              
              <div>
                <label>Department</label>
                <input required type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. CSE" />
              </div>

              <div>
                <label>Section</label>
                <input required type="text" name="section" value={formData.section} onChange={handleChange} placeholder="e.g. K" />
              </div>

              <div>
                <label>Hostel Name</label>
                <input required type="text" name="hostelName" value={formData.hostelName} onChange={handleChange} placeholder="e.g. Pothigai" />
              </div>

              <div>
                <label>Hostel Floor</label>
                <input required type="text" name="hostelFloor" value={formData.hostelFloor} onChange={handleChange} placeholder="e.g. 1st Floor" />
              </div>

              <div>
                <label>Room No</label>
                <input required type="text" name="roomNo" value={formData.roomNo} onChange={handleChange} placeholder="e.g. 101" />
              </div>

              <div>
                <label>Out Date</label>
                <input required type="date" name="outDate" value={formData.outDate} onChange={handleChange} />
              </div>

              <div>
                <label>In Date</label>
                <input required type="date" name="inDate" value={formData.inDate} onChange={handleChange} />
              </div>

              <div>
                <label>Out Time (AM/PM)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <select name="outTimeHour" value={formData.outTimeHour} onChange={handleChange} style={{ flex: 2 }}>
                    {hours.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select name="outTimeMin" value={formData.outTimeMin} onChange={handleChange} style={{ flex: 2 }}>
                    {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select name="outTimePeriod" value={formData.outTimePeriod} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label>In Time (AM/PM)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <select name="inTimeHour" value={formData.inTimeHour} onChange={handleChange} style={{ flex: 2 }}>
                    {hours.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select name="inTimeMin" value={formData.inTimeMin} onChange={handleChange} style={{ flex: 2 }}>
                    {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select name="inTimePeriod" value={formData.inTimePeriod} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>


              <div>
                <label>Student Mobile No</label>
                <input required type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="10-digit number" />
              </div>

              <div>
                <label>Parent's Mobile No</label>
                <input required type="tel" name="parentsMobileNo" value={formData.parentsMobileNo} onChange={handleChange} placeholder="10-digit number" />
              </div>

              <div>
                <label>Parent's Email</label>
                <input required type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} placeholder="parent@email.com" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label>Reason for Outpass</label>
                <textarea required name="reason" value={formData.reason} onChange={handleChange} rows="3" placeholder="Explain your reason clearly..."></textarea>
              </div>

            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button disabled={loading} type="submit" className="btn Submit-btn">
                {loading ? 'Submitting to Database...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <footer className="footer">© 2026 College Outpass System</footer>
    </div>
  );
};

export default RequestOutpass;
