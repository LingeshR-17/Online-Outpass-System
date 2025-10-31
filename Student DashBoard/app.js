/* app.js - frontend logic and mock API
   Replace fakeApi.* functions with real fetch() to Node endpoints.
*/
const App = (function(){
  // mock DB in memory (replace with server)
  let db = {
    requests: [
      // sample entries
      {
        id: '1',
        name: 'Arun Kumar',
        roll: 'CS21A001',
        class: 'CSE-A',
        phone: '9876543210',
        outDate: '2025-10-20',
        outTime: '09:00',
        inDate: '2025-10-20',
        inTime: '17:00',
        reason: 'Family work',
        status: { advisor: 'pending', hod: 'pending', warden: 'pending' },
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Meera R',
        roll: 'CS21A012',
        class: 'CSE-A',
        phone: '9123456780',
        outDate: '2025-10-18',
        outTime: '08:30',
        inDate: '2025-10-18',
        inTime: '20:00',
        reason: 'Medical',
        status: { advisor: 'approved', hod: 'pending', warden: 'pending' },
        createdAt: new Date().toISOString()
      }
    ]
  };

  // simple ID generator
  function genId(){ return 'REQ-' + String(Math.floor(Math.random()*90000)+10000) }

  // fake API (simulate async)
  const fakeApi = {
    listRequests: (filterRole) => {
      // role-based filtering
      return new Promise(res => {
        setTimeout(() => {
          if(filterRole === 'advisor'){
            // advisor sees all with advisor pending or all for his class
            res(db.requests.filter(r => r.status.advisor === 'pending' || r.status.advisor === 'rejected' || r.status.advisor === 'approved'));
          } else if(filterRole === 'hod'){
            // HOD sees advisor-approved and hod pending
            res(db.requests.filter(r => r.status.advisor === 'approved' && r.status.hod !== 'approved'));
          } else if(filterRole === 'warden'){
            // warden sees hod approved and warden pending
            res(db.requests.filter(r => r.status.hod === 'approved' && r.status.warden !== 'approved'));
          } else { // student or default
            res(db.requests);
          }
        }, 200);
      });
    },

    createRequest: (payload) => {
      return new Promise(res => {
        setTimeout(() => {
          const newReq = {...payload, id: genId(), status: {advisor:'pending', hod:'pending', warden:'pending'}, createdAt: new Date().toISOString()};
          db.requests.unshift(newReq);
          res({ok:true, data:newReq});
        }, 250);
      });
    },

    updateStatus: (id, role, action) => {
      return new Promise((res, rej) => {
        setTimeout(() => {
          const r = db.requests.find(x => x.id === id);
          if(!r) return rej({ok:false, msg:'Not found'});
          if(role === 'advisor') r.status.advisor = action;
          if(role === 'hod') r.status.hod = action;
          if(role === 'warden') r.status.warden = action;
          res({ok:true, data:r});
        }, 180);
      });
    },

    markEntry: (id, entryMarked) => {
      return new Promise(res => {
        setTimeout(() => {
          const r = db.requests.find(x => x.id === id);
          if(r) r.entryMarked = !!entryMarked;
          res({ok:true, data:r});
        }, 120);
      });
    }
  };

  // render helpers
  function formatDateTime(d,t){ return `${d} ${t}` }

  // student view
  async function renderStudentTable(){
    const tb = document.querySelector('#requests-table tbody');
    if(!tb) return;
    const data = await fakeApi.listRequests('student');
    tb.innerHTML = '';
    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.outDate}</td>
        <td>${r.outTime}</td>
        <td>${r.inDate}</td>
        <td>${r.inTime}</td>
        <td title="${r.reason}">${r.reason.length>30? r.reason.slice(0,30)+'…':r.reason}</td>
        <td>
          A: <strong>${r.status.advisor}</strong> /
          H: <strong>${r.status.hod}</strong> /
          W: <strong>${r.status.warden}</strong>
        </td>
        <td>
          <button class="action-btn" onclick="App.viewRequest('${r.id}')">View</button>
        </td>
      `;
      tb.appendChild(tr);
    });

    // stats
    document.getElementById('total-req').textContent = data.length;
    document.getElementById('approved-req').textContent = data.filter(x => x.status.warden === 'approved').length;
    document.getElementById('pending-req').textContent = data.filter(x => x.status.warden !== 'approved').length;
  }

  // attach form
  function attachOutpassForm(){
    const form = document.getElementById('outpass-form');
    if(!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('studentName').value.trim(),
        roll: document.getElementById('roll').value.trim(),
        class: document.getElementById('classSection').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        outDate: document.getElementById('outDate').value,
        outTime: document.getElementById('outTime').value,
        inDate: document.getElementById('inDate').value,
        inTime: document.getElementById('inTime').value,
        reason: document.getElementById('reason').value.trim()
      };

      // basic validation
      if(!payload.name || !payload.roll) return showFormMsg('Please fill required fields', true);
      const resp = await fakeApi.createRequest(payload);
      if(resp.ok){
        showFormMsg('Request submitted ✅');
        form.reset();
      } else {
        showFormMsg('Failed to submit', true);
      }
    });

    function showFormMsg(msg, err=false){
      const el = document.getElementById('form-msg');
      el.textContent = msg;
      el.style.color = err ? 'var(--danger)' : 'var(--success)';
      setTimeout(()=> el.textContent = '', 5000);
    }
  }

  // common action handler (approve/reject)
  async function handleAction(id, role, action){
    try{
      await fakeApi.updateStatus(id, role, action);
      // re-render current page
      if(document.location.pathname.endsWith('student.html') || document.location.pathname === '/' ) renderStudentTable();
    } catch(e){
      alert('Error: '+ (e.msg || e));
    }
  }


  // view single request (quick modal)
 function viewRequest(id) {
  const r = db.requests.find(x => x.id === id);
  if (!r) return alert('Request not found');

  // Check if QR code exists
  if (!r.qrImageUrl) {
    return alert("QR code not generated yet!");
  }

  // Create and display a styled popup with the QR
  const qrWindow = window.open("", "_blank", "width=400,height=450");
  const doc = qrWindow.document;
  doc.write(`
    <html>
      <head>
        <title>E-Pass QR</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f6f9;
            text-align: center;
            padding: 30px;
          }
          h2 {
            color: #2563eb;
          }
          img {
            width: 200px;
            height: 200px;
            margin-top: 20px;
          }
          p {
            font-size: 15px;
            color: #374151;
          }
        </style>
      </head>
      <body>
        <h2>${r.name}'s E-Pass</h2>
        <img src="${r.qrImageUrl}" alt="E-Pass QR Code">
        <p><b>Roll No:</b> ${r.roll}</p>
        <p><b>Class:</b> ${r.class}</p>
        <p><b>Out:</b> ${r.outDate} ${r.outTime}</p>
        <p><b>In:</b> ${r.inDate} ${r.inTime}</p>
      </body>
    </html>
  `);
}

  // public API
  return {
    init: function(role){
      // decide what to render based on role
      if(role === 'student'){
        renderStudentTable();
      } 
      // small interval to refresh (demonstration)
      setInterval(()=>{
        if(role === 'student') renderStudentTable();
      }, 6000);
    },
    attachOutpassForm,
    viewRequest
  };
})();
