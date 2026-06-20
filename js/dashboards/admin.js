import { getAdminStats, getCharities, approveCharity, rejectCharity, getRequests, approveRequest, deliverRequest, getInventory, getDonations } from "../api.js";
import { showToast, showModal, closeModal } from "../components.js";

export function initAdminDashboard(container, currentUser) {
  renderLayout(container);
  bindEvents(container);
  loadData(container);
}

function renderLayout(container) {
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="sidebar">
        <ul class="sidebar-menu">
          <li class="sidebar-item active" data-tab="overview"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>Overview</li>
          <li class="sidebar-item" data-tab="charities"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Charities</li>
          <li class="sidebar-item" data-tab="requests"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>Requests</li>
          <li class="sidebar-item" data-tab="inventory"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>Inventory</li>
          <li class="sidebar-item" data-tab="donations"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>All Donations</li>
        </ul>
      </div>

      <div class="dashboard-content">
        <!-- Overview -->
        <div id="tab-overview" class="tab-pane active">
          <div class="dashboard-header"><div><h2 style="font-size:1.75rem;">Platform Overview</h2><p style="color:var(--text-muted);">Real-time system metrics and alerts.</p></div></div>
          <div class="dashboard-stats" id="admin-stats"><div style="text-align:center;padding:32px;grid-column:1/-1;color:var(--text-muted);">Loading stats...</div></div>
        </div>

        <!-- Charities -->
        <div id="tab-charities" class="tab-pane" style="display:none;">
          <div class="dashboard-header"><div><h2 style="font-size:1.75rem;">Charity Registrations</h2><p style="color:var(--text-muted);">Verify NGOs, hospitals, and camps before they can access inventory.</p></div></div>
          <div class="card-table-wrap"><div class="table-responsive">
            <table class="custom-table" id="charities-table">
              <thead><tr><th>Organization</th><th>Type</th><th>Contact Person</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody><tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">Loading...</td></tr></tbody>
            </table>
          </div></div>
        </div>

        <!-- Requests -->
        <div id="tab-requests" class="tab-pane" style="display:none;">
          <div class="dashboard-header"><div><h2 style="font-size:1.75rem;">Medicine Requests</h2><p style="color:var(--text-muted);">Approve and dispatch charity medicine requests.</p></div></div>
          <div class="card-table-wrap"><div class="table-responsive">
            <table class="custom-table" id="requests-table">
              <thead><tr><th>Date</th><th>Medicine</th><th>Qty</th><th>Requested By</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody><tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">Loading...</td></tr></tbody>
            </table>
          </div></div>
        </div>

        <!-- Inventory -->
        <div id="tab-inventory" class="tab-pane" style="display:none;">
          <div class="dashboard-header"><div><h2 style="font-size:1.75rem;">Inventory Status</h2><p style="color:var(--text-muted);">Current approved medicine stock levels.</p></div></div>
          <div class="card-table-wrap"><div class="table-responsive">
            <table class="custom-table" id="inventory-table">
              <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Expiry</th><th>Condition</th></tr></thead>
              <tbody><tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">Loading...</td></tr></tbody>
            </table>
          </div></div>
        </div>

        <!-- All Donations -->
        <div id="tab-donations" class="tab-pane" style="display:none;">
          <div class="dashboard-header"><div><h2 style="font-size:1.75rem;">All Donations</h2><p style="color:var(--text-muted);">Full donation history across all donors.</p></div></div>
          <div class="card-table-wrap"><div class="table-responsive">
            <table class="custom-table" id="donations-table">
              <thead><tr><th>Date</th><th>Medicine</th><th>Donor</th><th>Qty</th><th>Expiry</th><th>Status</th></tr></thead>
              <tbody><tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">Loading...</td></tr></tbody>
            </table>
          </div></div>
        </div>
      </div>
    </div>
  `;
}

function bindEvents(container) {
  container.querySelectorAll(".sidebar-item").forEach(item => {
    item.addEventListener("click", () => {
      container.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
      container.querySelectorAll(".tab-pane").forEach(p => p.style.display = "none");
      item.classList.add("active");
      const pane = container.querySelector(`#tab-${item.dataset.tab}`);
      if (pane) pane.style.display = "block";
      loadTabData(container, item.dataset.tab);
    });
  });
}

async function loadData(container) {
  loadTabData(container, "overview");
}

async function loadTabData(container, tab) {
  if (tab === "overview")    await loadStats(container);
  if (tab === "charities")   await loadCharities(container);
  if (tab === "requests")    await loadRequests(container);
  if (tab === "inventory")   await loadInventory(container);
  if (tab === "donations")   await loadDonations(container);
}

async function loadStats(container) {
  const el = container.querySelector("#admin-stats");
  if (!el) return;
  try {
    const s = await getAdminStats();
    el.innerHTML = `
      <div class="dashboard-stat-card"><div class="stat-icon-wrap blue"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="stat-details"><h4>Medicines Rescued</h4><div class="stat-number">${s.medicinesRescued}</div></div></div>
      <div class="dashboard-stat-card"><div class="stat-icon-wrap green"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div><div class="stat-details"><h4>Patients Helped</h4><div class="stat-number">${s.patientsHelped}</div></div></div>
      <div class="dashboard-stat-card"><div class="stat-icon-wrap purple"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></div><div class="stat-details"><h4>Connected Charities</h4><div class="stat-number">${s.connectedCharities}</div></div></div>
      <div class="dashboard-stat-card"><div class="stat-icon-wrap orange"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div><div class="stat-details"><h4>Pending Donations</h4><div class="stat-number">${s.pendingDonationsCount}</div></div></div>
      <div class="dashboard-stat-card"><div class="stat-icon-wrap red"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div><div class="stat-details"><h4>Pending Requests</h4><div class="stat-number">${s.pendingRequestsCount}</div></div></div>
      <div class="dashboard-stat-card"><div class="stat-icon-wrap yellow"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></div><div class="stat-details"><h4>Charities Pending Approval</h4><div class="stat-number">${s.pendingCharitiesCount}</div></div></div>
    `;
  } catch (err) {
    el.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--danger-color);padding:32px;">Failed to load stats: ${err.message}</div>`;
  }
}

async function loadCharities(container) {
  const tbody = container.querySelector("#charities-table tbody");
  if (!tbody) return;
  try {
    const charities = await getCharities();
    if (charities.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No charity registrations found.</td></tr>`;
      return;
    }
    tbody.innerHTML = charities.map(c => `
      <tr>
        <td><strong>${c.name}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${c.email}</span></td>
        <td>${c.type || "—"}</td>
        <td>${c.contactPerson || "—"}</td>
        <td>${c.address || "—"}</td>
        <td><span class="badge badge-${c.verified ? 'approved' : 'pending'}">${c.verified ? 'Verified' : 'Pending'}</span></td>
        <td style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          ${!c.verified ? `<button class="btn btn-secondary btn-approve-ch" data-id="${c._id}" style="padding:6px 12px;font-size:0.8rem;">Approve</button>` : '<span style="font-size:0.8rem;color:var(--success-color);">✓ Active</span>'}
          <button class="btn btn-outline btn-reject-ch" data-id="${c._id}" data-name="${c.name}" style="padding:6px 12px;font-size:0.8rem;border-color:var(--danger-color);color:var(--danger-color);">Remove</button>
        </td>
      </tr>`).join("");

    tbody.querySelectorAll(".btn-approve-ch").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "Approving...";
        try {
          await approveCharity(btn.dataset.id);
          showToast("Charity verified successfully.", "success");
          loadCharities(container);
        } catch (err) { showToast(err.message, "error"); }
      });
    });

    tbody.querySelectorAll(".btn-reject-ch").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm(`Remove "${btn.dataset.name}" permanently?`)) return;
        try {
          await rejectCharity(btn.dataset.id);
          showToast("Charity removed.", "warning");
          loadCharities(container);
        } catch (err) { showToast(err.message, "error"); }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger-color);padding:32px;">${err.message}</td></tr>`;
  }
}

async function loadRequests(container) {
  const tbody = container.querySelector("#requests-table tbody");
  if (!tbody) return;
  try {
    const requests = await getRequests();
    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No requests found.</td></tr>`;
      return;
    }
    tbody.innerHTML = requests.map(r => `
      <tr>
        <td>${r.dateRequested || r.createdAt?.split('T')[0]}</td>
        <td><strong>${r.medicineName}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${r.category}</span></td>
        <td>${r.quantity} units</td>
        <td>${r.charityName}<br><span style="font-size:0.75rem;color:var(--text-muted);">${r.charityEmail}</span></td>
        <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
        <td style="display:flex;gap:8px;flex-wrap:wrap;">
          ${r.status === 'Pending'   ? `<button class="btn btn-secondary btn-approve-req" data-id="${r._id}" style="padding:6px 12px;font-size:0.8rem;">Approve</button>` : ''}
          ${r.status === 'Approved'  ? `<button class="btn btn-outline btn-deliver-req" data-id="${r._id}" style="padding:6px 12px;font-size:0.8rem;">Mark Delivered</button>` : ''}
          ${r.status === 'Delivered' ? `<span style="font-size:0.8rem;color:var(--success-color);">✓ Delivered ${r.dateUpdated}</span>` : ''}
        </td>
      </tr>`).join("");

    tbody.querySelectorAll(".btn-approve-req").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "Approving...";
        try {
          await approveRequest(btn.dataset.id);
          showToast("Request approved. Inventory updated.", "success");
          loadRequests(container);
        } catch (err) { showToast(err.message, "error"); }
      });
    });

    tbody.querySelectorAll(".btn-deliver-req").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "Updating...";
        try {
          await deliverRequest(btn.dataset.id);
          showToast("Marked as delivered.", "success");
          loadRequests(container);
        } catch (err) { showToast(err.message, "error"); }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger-color);padding:32px;">${err.message}</td></tr>`;
  }
}

async function loadInventory(container) {
  const tbody = container.querySelector("#inventory-table tbody");
  if (!tbody) return;
  try {
    const items = await getInventory();
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px;">No stock available.</td></tr>`;
      return;
    }
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.medicineName}</strong></td>
        <td>${item.category}</td>
        <td><strong style="color:${item.quantity < 20 ? 'var(--danger-color)' : 'var(--success-color)'};">${item.quantity} units</strong></td>
        <td>${item.expiryDate}</td>
        <td>${item.packageCondition}</td>
      </tr>`).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger-color);padding:32px;">${err.message}</td></tr>`;
  }
}

async function loadDonations(container) {
  const tbody = container.querySelector("#donations-table tbody");
  if (!tbody) return;
  try {
    const donations = await getDonations();
    if (donations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No donations found.</td></tr>`;
      return;
    }
    tbody.innerHTML = donations.map(d => `
      <tr>
        <td>${d.dateAdded || d.createdAt?.split('T')[0]}</td>
        <td><strong>${d.medicineName}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${d.category}</span></td>
        <td>${d.donorName}<br><span style="font-size:0.75rem;color:var(--text-muted);">${d.donorEmail}</span></td>
        <td>${d.quantity} units</td>
        <td>${d.expiryDate}</td>
        <td><span class="badge badge-${d.status.toLowerCase()}">${d.status}</span></td>
      </tr>`).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger-color);padding:32px;">${err.message}</td></tr>`;
  }
}
