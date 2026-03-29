// logout.js

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    // No user logged in — redirect to login
    window.location.href = "student_login.html";
    return;
  }

  // Fetch role from Firestore to verify page access
  const docRef = db.collection("users").doc(user.uid);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    alert("User record not found!");
    auth.signOut();
    return;
  }

  const role = docSnap.data().role;

  // Check if role matches allowed roles
  const allowedRoles = ["teacher", "hod", "warden", "security"];
  if (!allowedRoles.includes(role)) {
    alert("Access denied! You are not authorized to view this page.");
    auth.signOut();
    return;
  }

  console.log(`Logged in as ${role}`);
  // You can also display user info dynamically here if you want
});

// Logout button handler
document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => {
    sessionStorage.clear();
    window.location.href = "student_login.html";
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
});
