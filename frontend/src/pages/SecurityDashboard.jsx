import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import '../assets/css/security.css'; 

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState('');
  const [outpassData, setOutpassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState('');

  useEffect(() => {
    if (outpassData) return;
    const targetNode = document.getElementById("reader");
    if (!targetNode) return;

    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });
    
    scanner.render(
      (decodedText) => {
        scanner.clear();
        setScanResult(decodedText);
        verifyOutpass(decodedText, 'id');
      },
      (err) => { /* ignore standard frame empty errors */ }
    );
    
    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [outpassData]);

  const handleManualScan = (e) => {
    e.preventDefault();
    if (!scanResult) return;
    if (scanResult.length === 6) {
       verifyOutpass(scanResult.toUpperCase(), 'code');
    } else {
       verifyOutpass(scanResult, 'id');
    }
  };

  const verifyOutpass = async (value, type) => {
    setLoading(true);
    setErrorCode('');
    try {
      let docSnap;
      let docId = value;

      if (type === 'code') {
        const q = query(collection(db, 'outpasses'), where('epassCode', '==', value));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setErrorCode('No outpass found with this code.');
          setOutpassData(null);
          setLoading(false);
          return;
        }
        docSnap = querySnapshot.docs[0];
        docId = docSnap.id;
      } else {
        const docRef = doc(db, 'outpasses', value);
        docSnap = await getDoc(docRef);
      }

      if (docSnap && docSnap.exists()) {
        setOutpassData({ id: docId, ...docSnap.data() });
      } else {
        setErrorCode('Invalid QR code or Document ID.');
        setOutpassData(null);
      }
    } catch (err) {
      console.error(err);
      setErrorCode('Error verifying outpass. Ensure valid format.');
    }
    setLoading(false);
  };

  const handleAllowExit = async () => {
    try {
      if (!outpassData || !outpassData.isValid) return;
      await updateDoc(doc(db, 'outpasses', outpassData.id), {
        isValid: false,
        usedAt: serverTimestamp()
      });
      alert('Outpass marked as EXITED successfully.');
      setOutpassData(null);
      setScanResult('');
    } catch (e) {
      alert('Failed to update outpass status.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="container" style={{backgroundColor: '#0f172a', minHeight: '100vh', padding: '0', margin: '0', maxWidth: '100%'}}>
      <header className="navbar" style={{backgroundColor: '#020617', padding: '15px 30px', display: 'flex', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <img src="/logo.png" alt="CIT" style={{width: '60px', borderRadius: '8px'}} />
          <h2 style={{color: 'white', margin: 0, fontSize: '1.2rem'}}>Security Gate Scanner</h2>
        </div>
        <button onClick={handleLogout} style={{background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>Logout</button>
      </header>

      <main style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          
          {!outpassData ? (
            <>
              <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '10px' }}>Verify Identity</h2>
              <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '25px' }}>Scan the student's QR E-Pass or enter their 6-digit backup code.</p>
              
              <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', marginBottom: '25px' }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                <div style={{ padding: '0 15px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>OR</div>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              </div>

              <form onSubmit={handleManualScan} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={scanResult}
                  onChange={(e) => setScanResult(e.target.value)}
                  placeholder="Enter 6-Digit Code" 
                  style={{ flex: 1, padding: '12px 16px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '1.1rem', textTransform: 'uppercase' }}
                  maxLength={30}
                />
                <button type="submit" disabled={loading} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 25px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}>
                  {loading ? '...' : 'Verify'}
                </button>
              </form>

              {errorCode && <p style={{ color: '#dc2626', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>{errorCode}</p>}
            </>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {outpassData.isValid ? (
                  <div style={{ display: 'inline-block', background: '#dcfce7', color: '#16a34a', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.2rem' }}>✓ VALID PASS</div>
                ) : (
                  <div style={{ display: 'inline-block', background: '#fee2e2', color: '#dc2626', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.2rem' }}>✗ INVALID / USED</div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', color: '#0f172a' }}>Student Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div><strong style={{ color: '#64748b', fontSize: '0.85rem' }}>NAME</strong><div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{outpassData.name || 'N/A'}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.85rem' }}>ROOM</strong><div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{outpassData.roomNo || 'N/A'}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.85rem' }}>OUT TIME</strong><div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#ea580c' }}>{outpassData.outDate} {outpassData.outTime}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.85rem' }}>IN TIME</strong><div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#0284c7' }}>{outpassData.inDate} {outpassData.inTime}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#64748b', fontSize: '0.85rem' }}>REASON</strong><div style={{ fontWeight: '500' }}>{outpassData.reason}</div></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setOutpassData(null); setScanResult(''); }} style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem' }}>Back / Scan Next</button>
                {outpassData.isValid && (
                  <button onClick={handleAllowExit} style={{ flex: 1, padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
                    ALLOW EXIT
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SecurityDashboard;
