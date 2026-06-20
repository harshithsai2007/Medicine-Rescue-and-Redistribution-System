// Shared Components Library for MRRS

// Toast Notification Manager
export function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  // Icon based on type
  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "warning") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  }

  toast.innerHTML = `
    <div style="margin-top: 2px;">${iconSvg}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Modal Manager
export function showModal({ title, bodyHtml, footerHtml }) {
  let modalOverlay = document.getElementById("app-modal");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "app-modal";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="btn btn-text" id="modal-close-btn" style="padding: 4px; display: flex;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
    </div>
  `;

  modalOverlay.style.display = "flex";
  
  // Close triggers
  const closeBtn = modalOverlay.querySelector("#modal-close-btn");
  closeBtn.addEventListener("click", closeModal);
  
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

export function closeModal() {
  const modalOverlay = document.getElementById("app-modal");
  if (modalOverlay) {
    modalOverlay.style.display = "none";
  }
}

// Stats Counter Animator
export function animateCounter(elementId, targetValue, duration = 1500) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let start = 0;
  const end = parseInt(targetValue);
  if (start === end) {
    element.textContent = end;
    return;
  }

  const range = end - start;
  let current = start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  
  // Cap stepTime to avoid browser freezing
  const minStepTime = 20;
  const actualStepTime = Math.max(stepTime, minStepTime);
  const actualIncrement = Math.ceil(range / (duration / actualStepTime));

  const timer = setInterval(() => {
    current += actualIncrement;
    if ((actualIncrement > 0 && current >= end) || (actualIncrement < 0 && current <= end)) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = current;
    }
  }, actualStepTime);
}

// Medicine Details Modal generator
export function renderMedicineDetailModal(donation, actionsHtml = "") {
  const isRejected = donation.status === "Rejected";
  const rejectionMarkup = isRejected ? `
    <div style="background-color: var(--danger-light); padding: 12px; border-radius: var(--radius-md); border-left: 4px solid var(--danger-color); margin-top: 16px;">
      <h4 style="color: var(--danger-color); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 4px;">Rejection Reason</h4>
      <p style="font-size: 0.9rem; color: var(--text-dark); margin: 0;">${donation.rejectionReason || "No details provided."}</p>
    </div>
  ` : "";

  const steps = [
    { key: "Pending", label: "Uploaded" },
    { key: "Approved", label: "Verified" },
    { key: "Completed", label: "Rescued" }
  ];

  let activeIndex = 0;
  if (donation.status === "Approved") activeIndex = 1;
  if (donation.status === "Delivered" || donation.status === "Completed") activeIndex = 2;

  const isTimelineVisible = !isRejected;

  const timelineHtml = isTimelineVisible ? `
    <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 20px;">
      <h4 style="font-size: 0.9rem; margin-bottom: 16px; color: var(--text-muted);">Donation Status Progress</h4>
      <div class="tracking-timeline">
        <div class="timeline-step completed">
          <div class="step-dot"></div>
          <div class="step-label">Uploaded</div>
        </div>
        <div class="timeline-step ${activeIndex >= 1 ? 'completed' : 'active'}">
          <div class="step-dot"></div>
          <div class="step-label">Verified</div>
        </div>
        <div class="timeline-step ${activeIndex >= 2 ? 'completed' : (activeIndex === 1 ? 'active' : '')}">
          <div class="step-dot"></div>
          <div class="step-label">Distributed</div>
        </div>
      </div>
    </div>
  ` : `
    <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 20px;">
      <div class="tracking-timeline" style="justify-content: space-around;">
        <div class="timeline-step completed">
          <div class="step-dot"></div>
          <div class="step-label">Uploaded</div>
        </div>
        <div class="timeline-step rejected">
          <div class="step-dot"></div>
          <div class="step-label">Rejected</div>
        </div>
      </div>
    </div>
  `;

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 1.35rem; color: var(--primary-color); margin-bottom: 4px;">${donation.medicineName}</h2>
          <span class="badge badge-${donation.status.toLowerCase()}">${donation.status}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Date Added</span>
          <p style="font-weight: 600; font-size: 0.95rem;">${donation.dateAdded}</p>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background-color: var(--background-color); padding: 16px; border-radius: var(--radius-md); margin-top: 8px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Category</span>
          <strong style="font-size: 0.95rem;">${donation.category}</strong>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Quantity</span>
          <strong style="font-size: 0.95rem;">${donation.quantity} units</strong>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Expiry Date</span>
          <strong style="font-size: 0.95rem; color: ${isCloseToExpiry(donation.expiryDate) ? 'var(--danger-color)' : 'inherit'};">
            ${donation.expiryDate} ${isCloseToExpiry(donation.expiryDate) ? '(Near Expiry)' : ''}
          </strong>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Package Condition</span>
          <strong style="font-size: 0.95rem;">${donation.packageCondition}</strong>
        </div>
      </div>

      <div style="margin-top: 8px;">
        <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Pickup / Drop-off</span>
        <strong style="font-size: 0.9rem;">${donation.pickupPreference}</strong>
      </div>

      ${donation.notes ? `
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Donor Notes</span>
          <p style="font-size: 0.9rem; margin-top: 2px;">"${donation.notes}"</p>
        </div>
      ` : ""}

      <div>
        <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Donor Details</span>
        <p style="font-size: 0.9rem; margin-top: 2px;"><strong>${donation.donorName}</strong> (${donation.donorEmail})</p>
      </div>

      ${rejectionMarkup}
      ${timelineHtml}
    </div>
  `;

  showModal({
    title: "Medicine Donation Details",
    bodyHtml,
    footerHtml: actionsHtml || `<button class="btn btn-primary" id="modal-ok-btn">Close</button>`
  });

  const okBtn = document.getElementById("modal-ok-btn");
  if (okBtn) {
    okBtn.addEventListener("click", closeModal);
  }
}

// Utility to check if expiry date is close (within 3 months) or passed
export function isCloseToExpiry(dateStr) {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 90; // True if less than 90 days remaining or passed
}
