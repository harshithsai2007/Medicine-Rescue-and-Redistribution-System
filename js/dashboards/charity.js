import { getInventory, getRequests, createRequest } from "../api.js";
import { showToast, showModal, closeModal, isCloseToExpiry } from "../components.js";

export function initCharityDashboard(container, currentUser) {
  renderLayout(container);
  bindEvents(container, currentUser);
  loadData(container, currentUser);
}

function renderLayout(container) {
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="sidebar">
        <ul class="sidebar-menu">
          <li class="sidebar-item active" data-tab="browse">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            Browse Inventory
          </li>
          <li class="sidebar-item" data-tab="requests">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            Track Requests
          </li>
        </ul>
      </div>

      <div class="dashboard-content">
        <!-- Browse Tab -->
        <div id="tab-browse" class="tab-pane active">
          <div class="dashboard-header">
            <div>
              <h2 style="font-size:1.75rem;">Browse Medicine Inventory</h2>
              <p style="color:var(--text-muted);">Request available medicines for your patients — 100% free of cost.</p>
            </div>
          </div>
          <div class="filters-row">
            <div class="search-input-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="search-inventory" class="form-input" placeholder="Search by medicine name..." />
            </div>
            <div style="width:200px;">
              <select id="filter-category" class="form-input form-select">
                <option value="All">All Categories</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Cardiac">Cardiac</option>
                <option value="Cholesterol">Cholesterol</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div id="inventory-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;margin-bottom:32px;">
            <div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);">Loading inventory...</div>
          </div>
        </div>

        <!-- Requests Tab -->
        <div id="tab-requests" class="tab-pane" style="display:none;">
          <div class="dashboard-header">
            <div>
              <h2 style="font-size:1.75rem;">Request Tracking</h2>
              <p style="color:var(--text-muted);">Monitor your medicine request statuses in real time.</p>
            </div>
          </div>
          <div class="card-table-wrap">
            <div class="table-responsive">
              <table class="custom-table" id="charity-requests-table">
                <thead><tr><th>Date Requested</th><th>Medicine</th><th>Category</th><th>Qty</th><th>Status</th><th>Date Updated</th></tr></thead>
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
  container.querySelectorAll(".sidebar-item").forEach(item => {
    item.addEventListener("click", () => {
      container.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
      container.querySelectorAll(".tab-pane").forEach(p => p.style.display = "none");
      item.classList.add("active");
      const pane = container.querySelector(`#tab-${item.dataset.tab}`);
      if (pane) pane.style.display = "block";
      loadData(container, currentUser);
    });
  });

  container.querySelector("#search-inventory")?.addEventListener("input", () => loadData(container, currentUser));
  container.querySelector("#filter-category")?.addEventListener("change", () => loadData(container, currentUser));
}

async function loadData(container, currentUser) {
  // ── Inventory Grid ─────────────────────────────────────────────────────────
  const grid = container.querySelector("#inventory-grid");
  if (grid) {
    try {
      const inventory = await getInventory();
      const search = container.querySelector("#search-inventory")?.value.toLowerCase().trim() || "";
      const cat    = container.querySelector("#filter-category")?.value || "All";

      const filtered = inventory.filter(item =>
        item.medicineName.toLowerCase().includes(search) &&
        (cat === "All" || item.category === cat) &&
        item.quantity > 0
      );

      if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;background:var(--card-bg);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-muted);">No medicines match your search.</div>`;
      } else {
        grid.innerHTML = filtered.map(item => {
          const nearExpiry = isCloseToExpiry(item.expiryDate);
          const id = item._id || item.id;
          return `
            <div class="workflow-card" style="text-align:left;padding:24px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                  <span class="badge" style="background:var(--primary-light);color:var(--primary-color);padding:2px 8px;font-size:0.7rem;">${item.category}</span>
                  <span style="font-size:0.8rem;font-weight:600;color:${nearExpiry ? 'var(--danger-color)' : 'var(--text-muted)'};">${nearExpiry ? '⚠️ Near Expiry' : '✓ Good Condition'}</span>
                </div>
                <h3 style="font-size:1.1rem;margin-bottom:12px;">${item.medicineName}</h3>
                <div style="font-size:0.85rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;margin-bottom:20px;">
                  <div style="display:flex;justify-content:space-between;"><span>Available:</span><strong style="color:var(--text-dark);">${item.quantity} units</strong></div>
                  <div style="display:flex;justify-content:space-between;"><span>Expiry:</span><strong style="color:${nearExpiry ? 'var(--danger-color)' : 'var(--text-dark)'};">${item.expiryDate}</strong></div>
                  <div style="display:flex;justify-content:space-between;"><span>Condition:</span><strong style="color:var(--text-dark);font-size:0.75rem;">${item.packageCondition}</strong></div>
                </div>
              </div>
              <button class="btn btn-secondary btn-request-med" data-id="${id}" data-name="${item.medicineName}" data-qty="${item.quantity}" data-expiry="${item.expiryDate}" data-category="${item.category}" data-condition="${item.packageCondition}" style="width:100%;padding:8px;">
                Request Medicine
              </button>
            </div>`;
        }).join("");

        grid.querySelectorAll(".btn-request-med").forEach(btn => {
          btn.addEventListener("click", () => {
            openRequestDialog(btn.dataset, container, currentUser);
          });
        });
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--danger-color);">Failed to load inventory: ${err.message}</div>`;
    }
  }

  // ── Requests Table ─────────────────────────────────────────────────────────
  const tbody = container.querySelector("#charity-requests-table tbody");
  if (tbody) {
    try {
      const requests = await getRequests();
      const mine = requests.filter(r => r.charityEmail === currentUser.email);
      if (mine.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No requests submitted yet.</td></tr>`;
      } else {
        tbody.innerHTML = mine.map(r => `
          <tr>
            <td>${r.dateRequested || r.createdAt?.split('T')[0]}</td>
            <td><strong>${r.medicineName}</strong></td>
            <td>${r.category}</td>
            <td>${r.quantity} units</td>
            <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
            <td>${r.dateUpdated || "—"}</td>
          </tr>`).join("");
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger-color);padding:32px;">Failed to load requests: ${err.message}</td></tr>`;
    }
  }
}

function openRequestDialog(itemData, container, currentUser) {
  showModal({
    title: "Request Medicine",
    bodyHtml: `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:0.95rem;">Submit a request for <strong>${itemData.name}</strong>. These medicines will be delivered completely free.</p>
        <div style="background:var(--background-color);padding:12px 16px;border-radius:var(--radius-md);font-size:0.85rem;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;"><span>Category:</span><strong>${itemData.category}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Expiry Date:</span><strong>${itemData.expiry}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>In Stock:</span><strong>${itemData.qty} units</strong></div>
        </div>
        <div class="form-group" style="margin-top:10px;">
          <label class="form-label" for="req-qty">Quantity to Request (Max ${itemData.qty}) *</label>
          <input type="number" id="req-qty" class="form-input" min="1" max="${itemData.qty}" value="10" required />
        </div>
      </div>`,
    footerHtml: `
      <button class="btn btn-text" id="btn-cancel-req">Cancel</button>
      <button class="btn btn-secondary" id="btn-submit-req">Submit Request</button>`
  });

  document.getElementById("btn-cancel-req")?.addEventListener("click", closeModal);
  document.getElementById("btn-submit-req")?.addEventListener("click", async () => {
    const qty = Number(document.getElementById("req-qty").value);
    if (!qty || qty <= 0 || qty > Number(itemData.qty)) {
      showToast("Enter a valid quantity within the available range.", "error");
      return;
    }
    const submitBtn = document.getElementById("btn-submit-req");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    try {
      await createRequest(itemData.id, qty);
      showToast(`Request for ${qty} units of ${itemData.name} submitted!`, "success");
      closeModal();
      loadData(container, currentUser);
    } catch (err) {
      showToast(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Request";
    }
  });
}
