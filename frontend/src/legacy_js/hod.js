// Sample data (you can replace this with real API data later)
let hodRequests = [
  {
    id: 101,
    student: "20XXBCS003",
    reason: "Family Function",
    from: "2025-11-10",
    to: "2025-11-12",
    status: "pending"
  },
  {
    id: 102,
    student: "20XXBCS008",
    reason: "Medical Checkup",
    from: "2025-11-15",
    to: "2025-11-16",
    status: "pending"
  }
];

// Function to render all requests
function renderRequests() {
  const tableBody = document.getElementById("hodRequests");
  tableBody.innerHTML = "";

  if (hodRequests.length === 0) {
    tableBody.innerHTML = <tr><td colspan="7" style="text-align:center;color:gray;">No requests available</td></tr>;
    return;
  }

  hodRequests.forEach(req => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${req.id}</td>
      <td>${req.student}</td>
      <td>${req.reason}</td>
      <td>${req.from}</td>
      <td>${req.to}</td>
      <td><span class="status ${req.status}">${req.status.toUpperCase()}</span></td>
      <td>
        ${req.status === "pending" 
          ? `<button class="btn" style="background:#059669" onclick="approveRequest(${req.id})">Approve</button>
             <button class="btn" style="background:#ef4444;margin-left:6px;" onclick="rejectRequest(${req.id})">Reject</button>`
          : "—"}
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Approve request
function approveRequest(id) {
  const req = hodRequests.find(r => r.id === id);
  if (req) {
    req.status = "approved";
    alert(`Request #${id} approved successfully ✅`);
    renderRequests();
  }
}

// Reject request
function rejectRequest(id) {
  const req = hodRequests.find(r => r.id === id);
  if (req) {
    req.status = "rejected";
    alert(`Request #${id} rejected ❌`);
    renderRequests();
  }
}

// Initialize table on page load
document.addEventListener("DOMContentLoaded", renderRequests);