import { getDonations, approveDonation, rejectDonation } from "../api.js";
import { showToast, showModal, closeModal, renderMedicineDetailModal, isCloseToExpiry } from "../components.js";

export function initVerificationDashboard(container, currentUser) {
  renderLayout(container);
  bindEvents(container);
  loadData(container);
}

function renderLayout(container) {
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="sidebar">
        <ul class="sidebar-menu">
          <li class="sidebar-item active" data-tab="pending">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            Pending Queue
            <span id="badge-pending-count" style="margin-left:auto;background-color:var(--warning-color);color:var(--text-light);font-size:0.75rem;padding:2px 8px;border-radius:var(--radius-full);">0</span>
          </li>
          <li class="sidebar-item" data-tab="reviewed">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Reviewed Logs
          </li>
        </ul>
      </div>

      <div class="dashboard-content">
        <div id="tab-pending" class="tab-pane active">
          <div class="dashboard-header">
            <div>
              <h2 style="font-size:1.75rem;">Verification Queue</h2>
              <p style="color:var(--text-muted);">Approve or reject incoming medicine donations directly.</p>
            </div>
          </div>
          <div id="pending-cards-container" style="display:flex;flex-direction:column;gap:16px;">
            <div style="text-align:center;padding:32px;color:var(--text-muted);">Loading...</div>
          </div>
        </div>

        <div id="tab-reviewed" class="tab-pane" style="display:none;">
          <div class="dashboard-header">
            <div>
              <h2 style="font-size:1.75rem;">Verification History</h2>
              <p style="color:var(--text-muted);">All approved and rejected medicine donations.</p>
            </div>
          </div>
          <div class="card-table-wrap">
            <div class="table-responsive">
              <table class="custom-table" id="verifier-reviewed-table">
                <thead><tr><th>Date</th><th>Medicine</th><th>Qty</th><th>Status</th><th>Verified By</th><th>Details</th></tr></thead>
                <tbody><tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">Loading...</td></tr></tbody>
              </table>
            </div>
          </div>
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
      if (item.dataset.tab === "reviewed") loadData(container);
    });
  });
}

async function loadData(container) {
  try {
    const donations = await getDonations();
    const pending  = donations.filter(d => d.status === "Pending");
    const reviewed = donations.filter(d => d.status === "Approved" || d.status === "Rejected");

    const badge = container.querySelector("#badge-pending-count");
    if (badge) badge.textContent = pending.length;

    // ── Pending cards ──────────────────────────────────────────────────────────
    const cardsEl = container.querySelector("#pending-cards-container");
    if (cardsEl) {
      if (pending.length === 0) {
        cardsEl.innerHTML = `
          <div style="text-align:center;padding:48px;background:var(--card-bg);border:1px solid var(--border-color);border-radius:var(--radius-md);">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--success-color);margin-bottom:16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <p style="font-weight:600;font-size:1.05rem;">All caught up!</p>
            <p style="color:var(--text-muted);margin-top:4px;font-size:0.9rem;">No pending donations to verify right now.</p>
          </div>`;
      } else {
        cardsEl.innerHTML = pending.map(d => {
          const shortExpiry   = isCloseToExpiry(d.expiryDate);
          const openedPackage = d.packageCondition === "Opened Box";
          const id = d._id || d.id;

          const warning = (shortExpiry || openedPackage) ? `
            <div style="padding:0 24px;border-bottom:1px solid var(--border-color);">
              <div style="background:var(--warning-light);border-left:4px solid var(--warning-color);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.82rem;color:var(--warning-color);display:flex;align-items:flex-start;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>
                  ${shortExpiry   ? `<strong>Short Expiry:</strong> Expires ${d.expiryDate} — less than 3 months. ` : ""}
                  ${openedPackage ? `<strong>Package Alert:</strong> Donor reported "Opened Box" — inspect seal carefully.` : ""}
                </span>
              </div>
            </div>` : "";

          return `
            <div class="card-table-wrap" style="padding:0;overflow:hidden;">
              <div style="padding:18px 24px;background:linear-gradient(to right,var(--primary-light),#fff);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <h3 style="font-size:1.1rem;color:var(--primary-color);margin-bottom:2px;">${d.medicineName}</h3>
                  <span style="font-size:0.8rem;color:var(--text-muted);">Submitted ${d.dateAdded || d.createdAt?.split('T')[0]} by <strong>${d.donorName}</strong></span>
                </div>
                <span class="badge badge-pending">Pending Review</span>
              </div>

              <div style="padding:20px 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;border-bottom:1px solid var(--border-color);">
                <div><span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:4px;">Category</span><strong>${d.category}</strong></div>
                <div><span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:4px;">Quantity</span><strong>${d.quantity} units</strong></div>
                <div><span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:4px;">Expiry Date</span><strong style="color:${shortExpiry ? 'var(--danger-color)' : 'inherit'};">${d.expiryDate}</strong></div>
                <div><span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:4px;">Condition</span><strong style="color:${openedPackage ? 'var(--warning-color)' : 'inherit'};">${d.packageCondition}</strong></div>
              </div>

              ${warning}

              <div style="padding:16px 24px;display:flex;align-items:center;gap:12px;background:#FAFBFD;">
                <button class="btn btn-secondary btn-approve" data-id="${id}" style="padding:9px 20px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Verify & Approve
                </button>
                <button class="btn btn-outline btn-reject" data-id="${id}" data-name="${d.medicineName}" style="padding:9px 20px;border-color:var(--danger-color);color:var(--danger-color);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Reject
                </button>
                <button class="btn btn-text btn-details" data-id="${id}" style="margin-left:auto;font-size:0.85rem;">View Full Details</button>
              </div>
            </div>`;
        }).join("");

        // Approve
        cardsEl.querySelectorAll(".btn-approve").forEach(btn => {
          btn.addEventListener("click", async () => {
            btn.disabled = true; btn.textContent = "Approving...";
            try {
              await approveDonation(btn.dataset.id);
              showToast("Medicine approved and added to inventory.", "success");
              loadData(container);
            } catch (err) {
              showToast(err.message, "error");
              btn.disabled = false; btn.textContent = "Verify & Approve";
            }
          });
        });

        // Reject → open reason dialog
        cardsEl.querySelectorAll(".btn-reject").forEach(btn => {
          btn.addEventListener("click", () => openRejectDialog(btn.dataset.id, btn.dataset.name, container));
        });

        // View details
        cardsEl.querySelectorAll(".btn-details").forEach(btn => {
          btn.addEventListener("click", () => {
            const d = pending.find(x => (x._id || x.id) === btn.dataset.id);
            if (d) renderMedicineDetailModal(d);
          });
        });
      }
    }

    // ── Reviewed table ─────────────────────────────────────────────────────────
    const tbody = container.querySelector("#verifier-reviewed-table tbody");
    if (tbody) {
      if (reviewed.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No reviewed donations yet.</td></tr>`;
      } else {
        tbody.innerHTML = reviewed.map(d => `
          <tr>
            <td>${d.dateAdded || d.createdAt?.split('T')[0]}</td>
            <td><strong>${d.medicineName}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${d.category}</span></td>
            <td>${d.quantity} units</td>
            <td><span class="badge badge-${d.status.toLowerCase()}">${d.status}</span></td>
            <td>${d.verifiedBy || "N/A"}</td>
            <td><button class="btn btn-text btn-view" data-id="${d._id || d.id}" style="padding:4px 8px;font-size:0.85rem;">View Details</button></td>
          </tr>`).join("");

        tbody.querySelectorAll(".btn-view").forEach(btn => {
          btn.addEventListener("click", () => {
            const d = reviewed.find(x => (x._id || x.id) === btn.dataset.id);
            if (d) renderMedicineDetailModal(d);
          });
        });
      }
    }
  } catch (err) {
    showToast("Failed to load donations: " + err.message, "error");
  }
}

function openRejectDialog(id, medicineName, container) {
  showModal({
    title: `Reject: ${medicineName}`,
    bodyHtml: `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <p style="font-size:0.95rem;">Provide a reason for rejecting <strong>${medicineName}</strong>. This will be shown to the donor.</p>
        <div class="form-group">
          <label class="form-label" for="rejection-reason">Rejection Reason *</label>
          <textarea id="rejection-reason" class="form-input" placeholder="e.g. Expired / Seal broken / Near-expiry..." rows="4" style="resize:none;"></textarea>
        </div>
      </div>`,
    footerHtml: `
      <button class="btn btn-text" id="btn-cancel-rej">Cancel</button>
      <button class="btn btn-danger" id="btn-confirm-rej">Confirm Rejection</button>`
  });

  document.getElementById("btn-cancel-rej")?.addEventListener("click", closeModal);
  document.getElementById("btn-confirm-rej")?.addEventListener("click", async () => {
    const reason = document.getElementById("rejection-reason").value.trim();
    if (!reason) { showToast("Please enter a rejection reason.", "error"); return; }
    try {
      await rejectDonation(id, reason);
      showToast("Donation rejected. Reason recorded.", "warning");
      closeModal();
      loadData(container);
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}
