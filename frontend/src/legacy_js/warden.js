// warden.js

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("wardenRequests");

  // Fetch existing requests from localStorage
  let stored = localStorage.getItem("outpass_requests");
  let requests = [];
  try {
    requests = stored ? JSON.parse(stored) : [];
  } catch {
    requests = [];
  }

  // ✅ Add one dummy student request if no data exists
    requests = [
      {
        id: "REQ-001",
        studentName: "vinayaga",
        studentId: "20CSE001",
        className: "III-CSE-A",
        roomNo: "B-102",
        hostelName: "Boys Hostel 1",
        reason: "Checkup",
        fromDate: "2025-11-05",
        toDate: "2025-11-06",
        status: { hod: "Approved" } // Already approved by HOD
      }
    ];
    localStorage.setItem("outpass_requests", JSON.stringify(requests));
  

  // Filter only requests approved by HOD and pending for Warden
  const pending = requests.filter(
    req => req.status?.hod === "Approved" && !req.status?.warden
  );

  // If no pending requests
  if (pending.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align:center;color:var(--muted)">
          No pending requests for review.
        </td>
      </tr>`;
    return;
  }

  // Render each request row
  pending.forEach(req => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${req.id}</td>
      <td>${req.studentName || "-"}</td>
      <td>${req.studentId || "-"}</td>
      <td>${req.className || "-"}</td>
      <td>${req.roomNo || "-"}</td>
      <td>${req.hostelName || "-"}</td>
      <td>${req.reason || "-"}</td>
      <td>${req.fromDate || "-"}</td>
      <td>${req.toDate || "-"}</td>
      <td><span class="status approved">HOD Approved</span></td>
      <td>
        <button class="btn approve" onclick="updateWardenStatus('${req.id}','Approved')">Approve</button>
        <button class="btn reject" onclick="updateWardenStatus('${req.id}','Rejected')" style="margin-left:6px;">Reject</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
});

function updateWardenStatus(id, decision) {
  const stored = localStorage.getItem("outpass_requests");
  let requests = [];
  try {
    requests = stored ? JSON.parse(stored) : [];
  } catch {
    requests = [];
  }

  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    requests[index].status = requests[index].status || {};
    requests[index].status.warden = decision;
    localStorage.setItem("outpass_requests", JSON.stringify(requests));
    alert(`Request ${id} has been ${decision} by Warden.`);
    location.reload();
  }
}