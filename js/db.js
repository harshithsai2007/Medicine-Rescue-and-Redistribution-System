// LocalStorage Database Manager for Medicine Rescue and Redistribution System (MRRS)

const SEED_DATA = {
  users: [
    { id: "u1", name: "Sarah Jenkins", email: "donor@mrrs.org", password: "password", role: "donor", phone: "+1 555-0199", address: "123 Maple Street" },
    { id: "u2", name: "Dr. Robert Chen", email: "verifier@mrrs.org", password: "password", role: "verifier", department: "Quality Control" },
    { id: "u3", name: "Hope Care Free Clinic", email: "charity@mrrs.org", password: "password", role: "charity", type: "Free Clinic", address: "789 Health Ave", contactPerson: "Mary Robbins", verified: true },
    { id: "u4", name: "Alex Mercer", email: "admin@mrrs.org", password: "password", role: "admin", department: "Super Admin" },
    { id: "u5", name: "Red Cross Medical Camp", email: "camp@mrrs.org", password: "password", role: "charity", type: "Medical Camp", address: "456 Outreach Rd", contactPerson: "John Davis", verified: false }
  ],
  donations: [
    {
      id: "d1",
      medicineName: "Amoxicillin 500mg",
      category: "Antibiotics",
      quantity: 30,
      expiryDate: "2026-11-30",
      packageCondition: "Unopened/Sealed",
      pickupPreference: "Pickup Requested",
      donorName: "Sarah Jenkins",
      donorEmail: "donor@mrrs.org",
      status: "Approved",
      dateAdded: "2026-05-10",
      notes: "Stored in a cool dry place.",
      verifiedBy: "Dr. Robert Chen"
    },
    {
      id: "d2",
      medicineName: "Metformin 850mg",
      category: "Diabetes",
      quantity: 60,
      expiryDate: "2026-08-15",
      packageCondition: "Unopened/Sealed",
      pickupPreference: "Drop-off",
      donorName: "Sarah Jenkins",
      donorEmail: "donor@mrrs.org",
      status: "Pending",
      dateAdded: "2026-06-15",
      notes: "Full unopened strip of tablets."
    },
    {
      id: "d3",
      medicineName: "Atorvastatin 20mg",
      category: "Cholesterol",
      quantity: 90,
      expiryDate: "2026-05-01",
      packageCondition: "Opened Box",
      pickupPreference: "Pickup Requested",
      donorName: "Emily Watson",
      donorEmail: "emily@gmail.com",
      status: "Rejected",
      dateAdded: "2026-06-01",
      rejectionReason: "Expiry date is in the past, and package is opened.",
      verifiedBy: "Dr. Robert Chen"
    },
    {
      id: "d4",
      medicineName: "Paracetamol 500mg",
      category: "Analgesics",
      quantity: 100,
      expiryDate: "2027-01-20",
      packageCondition: "Unopened/Sealed",
      pickupPreference: "Drop-off",
      donorName: "Emily Watson",
      donorEmail: "emily@gmail.com",
      status: "Approved",
      dateAdded: "2026-06-01",
      verifiedBy: "Dr. Robert Chen"
    },
    {
      id: "d5",
      medicineName: "Lisinopril 10mg",
      category: "Cardiac",
      quantity: 50,
      expiryDate: "2026-09-30",
      packageCondition: "Unopened/Sealed",
      pickupPreference: "Pickup Requested",
      donorName: "Sarah Jenkins",
      donorEmail: "donor@mrrs.org",
      status: "Approved",
      dateAdded: "2026-06-02",
      verifiedBy: "Dr. Robert Chen"
    }
  ],
  inventory: [
    {
      id: "inv1",
      donationId: "d1",
      medicineName: "Amoxicillin 500mg",
      category: "Antibiotics",
      quantity: 30,
      expiryDate: "2026-11-30",
      packageCondition: "Unopened/Sealed",
      dateAdded: "2026-05-10"
    },
    {
      id: "inv2",
      donationId: "d4",
      medicineName: "Paracetamol 500mg",
      category: "Analgesics",
      quantity: 60, // Originally 100, but 40 requested and delivered
      expiryDate: "2027-01-20",
      packageCondition: "Unopened/Sealed",
      dateAdded: "2026-06-01"
    },
    {
      id: "inv3",
      donationId: "d5",
      medicineName: "Lisinopril 10mg",
      category: "Cardiac",
      quantity: 50,
      expiryDate: "2026-09-30",
      packageCondition: "Unopened/Sealed",
      dateAdded: "2026-06-02"
    }
  ],
  requests: [
    {
      id: "r1",
      medicineName: "Paracetamol 500mg",
      category: "Analgesics",
      quantity: 40,
      charityName: "Hope Care Free Clinic",
      charityEmail: "charity@mrrs.org",
      status: "Delivered",
      dateRequested: "2026-06-05",
      dateUpdated: "2026-06-07"
    },
    {
      id: "r2",
      medicineName: "Lisinopril 10mg",
      category: "Cardiac",
      quantity: 15,
      charityName: "Hope Care Free Clinic",
      charityEmail: "charity@mrrs.org",
      status: "Pending",
      dateRequested: "2026-06-16"
    }
  ]
};

// Initialize DB if not present
export function initDB() {
  if (!localStorage.getItem("mrrs_initialized")) {
    localStorage.setItem("mrrs_users", JSON.stringify(SEED_DATA.users));
    localStorage.setItem("mrrs_donations", JSON.stringify(SEED_DATA.donations));
    localStorage.setItem("mrrs_inventory", JSON.stringify(SEED_DATA.inventory));
    localStorage.setItem("mrrs_requests", JSON.stringify(SEED_DATA.requests));
    localStorage.setItem("mrrs_initialized", "true");
    console.log("MRRS local database initialized successfully.");
  }
}

// User Methods
export function getUsers() {
  return JSON.parse(localStorage.getItem("mrrs_users") || "[]");
}

export function saveUsers(users) {
  localStorage.setItem("mrrs_users", JSON.stringify(users));
}

export function registerUser(user) {
  const users = getUsers();
  if (users.find(u => u.email === user.email)) {
    throw new Error("Email already registered.");
  }
  const newUser = {
    id: "u_" + Date.now(),
    verified: user.role === "charity" ? false : true, // charities require admin verification
    ...user
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function authenticate(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    throw new Error("Invalid email or password.");
  }
  if (user.role === "charity" && !user.verified) {
    throw new Error("Your organization account is pending administrator verification.");
  }
  return user;
}

// Donation Methods
export function getDonations() {
  return JSON.parse(localStorage.getItem("mrrs_donations") || "[]");
}

export function saveDonations(donations) {
  localStorage.setItem("mrrs_donations", JSON.stringify(donations));
}

export function addDonation(donationData, currentUser) {
  const donations = getDonations();
  const newDonation = {
    id: "d_" + Date.now(),
    donorName: currentUser.name,
    donorEmail: currentUser.email,
    status: "Pending",
    dateAdded: new Date().toISOString().split("T")[0],
    ...donationData
  };
  donations.unshift(newDonation);
  saveDonations(donations);
  return newDonation;
}

export function updateDonationStatus(donationId, status, rejectionReason = "", verifierName = "") {
  const donations = getDonations();
  const index = donations.findIndex(d => d.id === donationId);
  if (index === -1) throw new Error("Donation not found.");
  
  donations[index].status = status;
  donations[index].verifiedBy = verifierName;
  if (status === "Rejected") {
    donations[index].rejectionReason = rejectionReason;
  }
  saveDonations(donations);

  // If approved, push to inventory
  if (status === "Approved") {
    addToInventory(donations[index]);
  }
  return donations[index];
}

// Inventory Methods
export function getInventory() {
  return JSON.parse(localStorage.getItem("mrrs_inventory") || "[]");
}

export function saveInventory(inventory) {
  localStorage.setItem("mrrs_inventory", JSON.stringify(inventory));
}

function addToInventory(donation) {
  const inventory = getInventory();
  // Check if there is already an active exact item (same name, category, and expiry)
  const existingIndex = inventory.findIndex(
    item => item.medicineName.toLowerCase() === donation.medicineName.toLowerCase() && 
            item.category === donation.category && 
            item.expiryDate === donation.expiryDate
  );

  if (existingIndex !== -1) {
    inventory[existingIndex].quantity += Number(donation.quantity);
  } else {
    inventory.push({
      id: "inv_" + Date.now(),
      donationId: donation.id,
      medicineName: donation.medicineName,
      category: donation.category,
      quantity: Number(donation.quantity),
      expiryDate: donation.expiryDate,
      packageCondition: donation.packageCondition,
      dateAdded: new Date().toISOString().split("T")[0]
    });
  }
  saveInventory(inventory);
}

// Request Methods
export function getRequests() {
  return JSON.parse(localStorage.getItem("mrrs_requests") || "[]");
}

export function saveRequests(requests) {
  localStorage.setItem("mrrs_requests", JSON.stringify(requests));
}

export function createRequest(inventoryId, quantityRequested, charityUser) {
  const inventory = getInventory();
  const invItemIndex = inventory.findIndex(item => item.id === inventoryId);
  
  if (invItemIndex === -1) throw new Error("Medicine not available in inventory.");
  const invItem = inventory[invItemIndex];
  
  if (invItem.quantity < quantityRequested) {
    throw new Error(`Insufficient quantity in stock. Only ${invItem.quantity} units available.`);
  }

  const requests = getRequests();
  const newRequest = {
    id: "r_" + Date.now(),
    inventoryId: inventoryId,
    medicineName: invItem.medicineName,
    category: invItem.category,
    quantity: Number(quantityRequested),
    charityName: charityUser.name,
    charityEmail: charityUser.email,
    status: "Pending",
    dateRequested: new Date().toISOString().split("T")[0]
  };

  requests.unshift(newRequest);
  saveRequests(requests);
  return newRequest;
}

export function updateRequestStatus(requestId, status) {
  const requests = getRequests();
  const reqIndex = requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) throw new Error("Request not found.");

  const request = requests[reqIndex];
  const oldStatus = request.status;
  request.status = status;
  request.dateUpdated = new Date().toISOString().split("T")[0];

  // If approved and previously pending, deduct from actual inventory
  if (status === "Approved" && oldStatus === "Pending") {
    const inventory = getInventory();
    const invIndex = inventory.findIndex(item => item.id === request.inventoryId || item.medicineName.toLowerCase() === request.medicineName.toLowerCase());
    if (invIndex !== -1) {
      if (inventory[invIndex].quantity < request.quantity) {
        throw new Error("Cannot approve request: Insufficient inventory quantity available.");
      }
      inventory[invIndex].quantity -= request.quantity;
      // Remove item if quantity becomes 0
      if (inventory[invIndex].quantity <= 0) {
        inventory.splice(invIndex, 1);
      }
      saveInventory(inventory);
    }
  }

  saveRequests(requests);
  return request;
}

// Admin Charity Verification methods
export function approveCharity(userId) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error("Charity not found.");
  users[index].verified = true;
  saveUsers(users);
  return users[index];
}

export function rejectCharity(userId) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error("Charity not found.");
  users.splice(index, 1); // remove the registration request
  saveUsers(users);
}

// Database stats calculation
export function getStats() {
  const donations = getDonations();
  const requests = getRequests();
  const inventory = getInventory();
  const users = getUsers();

  const medicinesRescued = donations
    .filter(d => d.status === "Approved")
    .reduce((sum, d) => sum + Number(d.quantity), 0);

  const patientsHelped = requests
    .filter(r => r.status === "Delivered")
    .reduce((sum, r) => sum + Number(r.quantity), 0);

  const activeCharitiesCount = users.filter(u => u.role === "charity" && u.verified).length;
  const completedDonationsCount = donations.filter(d => d.status === "Approved").length;

  return {
    medicinesRescued,
    patientsHelped,
    connectedCharities: activeCharitiesCount,
    completedDonations: completedDonationsCount,
    pendingDonationsCount: donations.filter(d => d.status === "Pending").length,
    pendingRequestsCount: requests.filter(r => r.status === "Pending").length,
    pendingCharitiesCount: users.filter(u => u.role === "charity" && !u.verified).length,
    inventoryCategories: inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {})
  };
}
