import { getDonations, addDonation } from "../api.js";
import { showToast, renderMedicineDetailModal, isCloseToExpiry } from "../components.js";

export function initDonorDashboard(container, currentUser) {
  renderLayout(container);
  bindEvents(container, currentUser);
  loadData(container, currentUser);
}

function renderLayout(container) {
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="sidebar">
        <ul class="sidebar-menu">
          <li class="sidebar-item active" data-tab="donate">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Donate Medicines
          </li>
          <li class="sidebar-item" data-tab="history">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Donation History
          </li>
        </ul>
      </div>

      <div class="dashboard-content">
        <!-- Donate Tab -->
        <div id="tab-donate" class="tab-pane active">
          <div class="dashboard-header">
            <div>
              <h2 style="font-size:1.75rem;">Donate Unused Medicines</h2>
              <p style="color:var(--text-muted);">Fill in the details below to start rescuing lives.</p>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:32px; align-items:start;">
            <div class="card-table-wrap" style="padding:32px;">
              <form id="donation-form" style="display:flex;flex-direction:column;gap:20px;">
                <div class="form-group">
                  <label class="form-label" for="med-name">Medicine Name *</label>
                  <input type="text" id="med-name" class="form-input" placeholder="e.g. Lipitor 20mg, Amoxil 500mg" required />
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                  <div class="form-group">
                    <label class="form-label" for="med-category">Category *</label>
                    <select id="med-category" class="form-input form-select" required>
                      <option value="" disabled selected>Select category</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Analgesics">Analgesics (Pain Relievers)</option>
                      <option value="Diabetes">Diabetes Management</option>
                      <option value="Cardiac">Cardiac / Blood Pressure</option>
                      <option value="Cholesterol">Cholesterol</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="med-qty">Quantity (Tablets/Bottles) *</label>
                    <input type="number" id="med-qty" class="form-input" placeholder="e.g. 30" min="1" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="med-expiry">Expiry Date *</label>
                  <input type="date" id="med-expiry" class="form-input" required />
                  <span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-top:4px;">Must be at least 3 months in the future.</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Package Condition *</label>
                  <div class="condition-grid">
                    <div class="condition-card active" data-condition="Unopened/Sealed">
                      <strong style="display:block;margin-bottom:2px;font-size:0.9rem;">Unopened / Sealed</strong>
                      <span style="font-size:0.75rem;color:var(--text-muted);">Eligible for verification</span>
                    </div>
                    <div class="condition-card" data-condition="Opened Box">
                      <strong style="display:block;margin-bottom:2px;font-size:0.9rem;">Opened Box / Loose strips</strong>
                      <span style="font-size:0.75rem;color:var(--text-muted);">Subject to strict review</span>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="med-pickup">Pickup/Drop-off Preference *</label>
                  <select id="med-pickup" class="form-input form-select" required>
                    <option value="Drop-off" selected>I will drop it off at NGO office</option>
                    <option value="Pickup Requested">Arrange a pickup from my address</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="med-notes">Additional Notes</label>
                  <textarea id="med-notes" class="form-input" placeholder="e.g. Stored in refrigerator, pack is intact..." rows="3" style="resize:none;"></textarea>
                </div>
                <button type="submit" id="donation-submit-btn" class="btn btn-primary" style="margin-top:10px;">Submit Donation Details</button>
              </form>
            </div>
            <div style="display:flex;flex-direction:column;gap:20px;">
              <div class="contact-info-card" style="padding:24px;border-radius:var(--radius-md);">
                <h3 style="color:var(--primary-color);font-size:1.15rem;margin-bottom:12px;">Donation Rules</h3>
                <ul style="padding-left:18px;font-size:0.85rem;color:var(--text-muted);display:flex;flex-direction:column;gap:10px;">
                  <li>Medicines distributed <strong>100% free</strong> to patients.</li>
                  <li>No expired or near-expiry medicines accepted.</li>
                  <li>Packaging must be verified upon receipt.</li>
                  <li>Only sealed strips, bottles, or blisters guaranteed to pass.</li>
                </ul>
              </div>
              <div class="dashboard-stats" style="grid-template-columns:1fr;gap:12px;">
                <div class="dashboard-stat-card" style="padding:16px;">
                  <div class="stat-icon-wrap blue" style="width:36px;height:36px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  <div class="stat-details"><h4 style="font-size:0.7rem;">Your Approved Donations</h4><div class="stat-number" id="donor-approved-count" style="font-size:1.25rem;">—</div></div>
                </div>
                <div class="dashboard-stat-card" style="padding:16px;">
                  <div class="stat-icon-wrap orange" style="width:36px;height:36px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
                  <div class="stat-details"><h4 style="font-size:0.7rem;">Pending Approvals</h4><div class="stat-number" id="donor-pending-count" style="font-size:1.25rem;">—</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- History Tab -->
        <div id="tab-history" class="tab-pane" style="display:none;">
          <div class="dashboard-header">
            <div>
              <h2 style="font-size:1.75rem;">Your Donation History</h2>
              <p style="color:var(--text-muted);">Track your donations and see their verification status.</p>
            </div>
          </div>
          <div class="card-table-wrap">
            <div class="table-responsive">
              <table class="custom-table" id="donor-history-table">
                <thead><tr><th>Date</th><th>Medicine Name</th><th>Category</th><th>Quantity</th><th>Status</th><th>Action</th></tr></thead>
                <tbody><tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">Loading...</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindEvents(container, currentUser) {
  // Sidebar tabs
  container.querySelectorAll(".sidebar-item").forEach(item => {
    item.addEventListener("click", () => {
      container.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
      container.querySelectorAll(".tab-pane").forEach(p => p.style.display = "none");
      item.classList.add("active");
      const pane = container.querySelector(`#tab-${item.dataset.tab}`);
      if (pane) pane.style.display = "block";
      if (item.dataset.tab === "history") loadData(container, currentUser);
    });
  });

  // Condition card selector
  let selectedCondition = "Unopened/Sealed";
  container.querySelectorAll(".condition-card").forEach(card => {
    card.addEventListener("click", () => {
      container.querySelectorAll(".condition-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      selectedCondition = card.dataset.condition;
    });
  });

  // Donation form submit
  const form = container.querySelector("#donation-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = container.querySelector("#donation-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const expiryDate = container.querySelector("#med-expiry").value;
    const diffDays = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 90) {
      showToast("Medicines must have at least 3 months shelf-life remaining.", "warning");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Donation Details";
      return;
    }

    try {
      await addDonation({
        medicineName: container.querySelector("#med-name").value,
        category: container.querySelector("#med-category").value,
        quantity: Number(container.querySelector("#med-qty").value),
        expiryDate,
        packageCondition: selectedCondition,
        pickupPreference: container.querySelector("#med-pickup").value,
        notes: container.querySelector("#med-notes").value,
      });
      showToast("Donation submitted! Awaiting verification.", "success");
      form.reset();
      container.querySelectorAll(".condition-card").forEach(c => c.classList.remove("active"));
      container.querySelector('.condition-card[data-condition="Unopened/Sealed"]').classList.add("active");
      selectedCondition = "Unopened/Sealed";
      loadData(container, currentUser);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Donation Details";
    }
  });
}

async function loadData(container, currentUser) {
  try {
    const donations = await getDonations();
    const myDonations = donations.filter(d => d.donorEmail === currentUser.email);

    const approvedEl = container.querySelector("#donor-approved-count");
    const pendingEl  = container.querySelector("#donor-pending-count");
    if (approvedEl) approvedEl.textContent = myDonations.filter(d => d.status === "Approved").length;
    if (pendingEl)  pendingEl.textContent  = myDonations.filter(d => d.status === "Pending").length;

    const tbody = container.querySelector("#donor-history-table tbody");
    if (!tbody) return;

    if (myDonations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No donations yet. Use the Donate Medicines tab to add your first.</td></tr>`;
      return;
    }

    tbody.innerHTML = myDonations.map(d => `
      <tr>
        <td>${d.dateAdded || d.createdAt?.split('T')[0]}</td>
        <td><strong>${d.medicineName}</strong></td>
        <td>${d.category}</td>
        <td>${d.quantity} units</td>
        <td><span class="badge badge-${d.status.toLowerCase()}">${d.status}</span></td>
        <td><button class="btn btn-text btn-view-details" data-id="${d._id || d.id}" style="padding:4px 8px;font-size:0.85rem;">View Details</button></td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".btn-view-details").forEach(btn => {
      btn.addEventListener("click", () => {
        const donation = myDonations.find(d => (d._id || d.id) === btn.dataset.id);
        if (donation) renderMedicineDetailModal(donation);
      });
    });
  } catch (err) {
    showToast("Failed to load donations: " + err.message, "error");
  }
}
