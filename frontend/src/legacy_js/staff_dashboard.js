document.addEventListener("DOMContentLoaded", () => {
  const requestTable = document.querySelector("#requestTable tbody");

  // Sample data (you can replace this with API call later)
  const requests = [
    {
      id: "OP001",
      student: "20CSE101",
      reason: "Medical Emergency",
      from: "2025-11-05",
      to: "2025-11-07",
      parentStatus: "APPROVED"
    },
    {
      id: "OP002",
      student: "20CSE145",
      reason: "Family Function",
      from: "2025-11-08",
      to: "2025-11-09",
      parentStatus: "PENDING"
    }
  ];

  function renderRequests() {
    requestTable.innerHTML = "";

    requests.forEach(req => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${req.id}</td>
        <td>${req.student}</td>
        <td>${req.reason}</td>
        <td>${req.from}</td>
        <td>${req.to}</td>
        <td><span class="status ${req.parentStatus.toLowerCase()}">${req.parentStatus}</span></td>
        <td>
          <a href="#" class="btn approve">Approve</a>
          <a href="#" class="btn reject">Reject</a>
        </td>
      `;
      requestTable.appendChild(row);
    });
  }

  renderRequests();

  // Button actions
  document.addEventListener("click", e => {
    if (e.target.classList.contains("approve")) {
      e.preventDefault();
      e.target.closest("tr").querySelector(".status").textContent = "APPROVED";
      e.target.closest("tr").querySelector(".status").className = "status approved";
    } else if (e.target.classList.contains("reject")) {
      e.preventDefault();
      e.target.closest("tr").querySelector(".status").textContent = "REJECTED";
      e.target.closest("tr").querySelector(".status").className = "status rejected";
    }
  });
});