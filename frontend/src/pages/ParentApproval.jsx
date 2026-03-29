import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../assets/css/style.css';

const ParentApproval = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  
  useEffect(() => {
    const processApproval = async () => {
      const id = searchParams.get('id');
      const action = searchParams.get('action');
      
      if (!id || !action) {
        setStatus('Invalid Link.');
        return;
      }
      
      try {
        const docRef = doc(db, 'outpasses', id);
        await updateDoc(docRef, {
          'status.parent': action === 'approve' ? 'Approved' : 'Rejected'
        });
        
        setStatus(`Successfully ${action === 'approve' ? 'Approved' : 'Rejected'} the Outpass Request!`);
      } catch (error) {
        console.error("Error updating outpass:", error);
        setStatus("An error occurred. Please ensure you clicked a valid link or contact the Class Advisor.");
      }
    };
    
    processApproval();
  }, [searchParams]);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '500px' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Parent Approval Gateway</h1>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{status}</p>
        <p style={{ marginTop: '20px', color: 'var(--muted)' }}>You may safely close this window.</p>
      </div>
    </div>
  );
};

export default ParentApproval;
