import { apiLogin, apiRegister, apiLogout, getCurrentUser, getPublicStats } from "./api.js";
import { showToast, animateCounter, closeModal } from "./components.js";
import { initDonorDashboard } from "./dashboards/donor.js";
import { initVerificationDashboard } from "./dashboards/verification.js";
import { initCharityDashboard } from "./dashboards/charity.js";
import { initAdminDashboard } from "./dashboards/admin.js";

// Global State
let currentUser = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  restoreSession();
  setupNavigation();
  setupRouter();
  handleRoute();
});

function restoreSession() {
  currentUser = getCurrentUser();
}

function setupNavigation() {
  const navContainer = document.querySelector(".nav-links");
  if (!navContainer) return;

  const updateNavbar = () => {
    let authNavHtml = currentUser
      ? `<li class="nav-item" data-route="dashboard">Dashboard</li>
         <li class="btn-nav-action" id="nav-logout-btn" style="cursor:pointer;">Logout</li>`
      : `<li class="nav-item btn-nav-action" data-route="login">Login / Register</li>`;

    navContainer.innerHTML = `
      <li class="nav-item" data-route="home">Home</li>
      <li class="nav-item" data-route="about">About Us</li>
      <li class="nav-item" data-route="how-it-works">How It Works</li>
      <li class="nav-item" data-route="donate">Donate Medicines</li>
      <li class="nav-item" data-route="charities">Charities</li>
      <li class="nav-item" data-route="contact">Contact Us</li>
      ${authNavHtml}
    `;

    navContainer.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => navigateTo(item.dataset.route));
    });

    document.getElementById("nav-logout-btn")?.addEventListener("click", handleLogout);

    const currentHash = window.location.hash.slice(1) || "home";
    navContainer.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.route === currentHash);
    });
  };

  window.updateNavbarState = updateNavbar;
  updateNavbar();
}

function setupRouter() {
  window.addEventListener("hashchange", () => {
    closeModal();
    handleRoute();
  });
}

export function navigateTo(route) {
  window.location.hash = route;
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || "home";
  const contentArea = document.getElementById("app-content");

  window.updateNavbarState?.();

  if (hash === "dashboard" && !currentUser) {
    navigateTo("login");
    showToast("Please log in to access your dashboard.", "warning");
    return;
  }

  switch (hash) {
    case "home":          renderHome(contentArea);           break;
    case "about":         renderAbout(contentArea);          break;
    case "how-it-works":  renderHowItWorks(contentArea);     break;
    case "charities":     renderCharitiesList(contentArea);  break;
    case "contact":       renderContact(contentArea);        break;
    case "login":         renderLogin(contentArea);          break;
    case "register":      renderRegister(contentArea);       break;
    case "dashboard":     renderDashboard(contentArea);      break;
    case "donate":
      if (currentUser?.role === "donor") navigateTo("dashboard");
      else if (currentUser) { showToast("Only donors can submit medicines.", "warning"); navigateTo("dashboard"); }
      else { navigateTo("login"); showToast("Please log in as a Donor first.", "info"); }
      break;
    default:
      contentArea.innerHTML = `<h2>Page Not Found</h2><a href="#home">Back to Home</a>`;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Home ─────────────────────────────────────────────────────────────────────
async function renderHome(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>Don't Let Good Medicines Go to Waste</h1>
        <p>Rescuing unused, unexpired, and sealed medicines. Restoring hopes and lives by distributing them 100% free of cost to patients in need through verified charity hospitals and medical camps.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="hero-donate-btn">Donate Now</button>
          <button class="btn btn-outline" id="hero-about-btn">Learn More</button>
        </div>
      </div>
      <div class="hero-illustration">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%">
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#E1F0FC" /><stop offset="100%" stop-color="#F5F9FC" />
            </linearGradient>
            <linearGradient id="iconGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0F6CBD" /><stop offset="100%" stop-color="#2E8B57" />
            </linearGradient>
          </defs>
          <rect width="500" height="400" rx="30" fill="url(#blueGrad)" />
          <circle cx="250" cy="180" r="90" fill="#FFF" filter="drop-shadow(0 10px 20px rgba(15,108,189,0.08))" />
          <path d="M250 130 v100 M200 180 h100" stroke="url(#iconGrad)" stroke-width="24" stroke-linecap="round" />
          <rect x="90" y="80" width="40" height="80" rx="20" transform="rotate(-30 90 80)" fill="#4CAF50" opacity="0.85" />
          <rect x="90" y="120" width="40" height="40" rx="0" transform="rotate(-30 90 80)" fill="#FFF" opacity="0.85" />
          <rect x="360" y="240" width="30" height="70" rx="15" transform="rotate(45 360 240)" fill="#0F6CBD" opacity="0.8" />
          <g transform="translate(320, 80)">
            <circle cx="25" cy="25" r="30" fill="#EAF7EE" />
            <path d="M15 25 l7 7 l15-15" fill="none" stroke="#2E8B57" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <text x="250" y="320" text-anchor="middle" font-family="'Poppins', sans-serif" font-weight="700" font-size="20" fill="#0F6CBD">Rescuing &amp; Restoring</text>
          <text x="250" y="345" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" fill="#64748B">Safety First • 100% Free</text>
        </svg>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stat-card"><span class="stat-value" id="count-rescued">0</span><span class="stat-label">Medicines Rescued (Units)</span></div>
      <div class="stat-card"><span class="stat-value" id="count-charities">0</span><span class="stat-label">Connected Charities</span></div>
      <div class="stat-card"><span class="stat-value" id="count-patients">0</span><span class="stat-label">Patients Helped</span></div>
      <div class="stat-card"><span class="stat-value" id="count-donations">0</span><span class="stat-label">Completed Donations</span></div>
    </section>

    <!-- How It Works -->
    <section style="margin-bottom:80px;">
      <div class="section-title-wrap">
        <h2 class="section-title">How It Works</h2>
        <p class="section-subtitle">A simple, transparent, and secure workflow to save medical resources.</p>
      </div>
      <div class="workflow-grid">
        <div class="workflow-card"><div class="workflow-step-num">1</div><h3>Upload Details</h3><p>Donors list medicine name, category, package condition, and expiry date.</p></div>
        <div class="workflow-card"><div class="workflow-step-num">2</div><h3>Quality Audit</h3><p>Authorized medical verifiers review condition and check shelf-life criteria.</p></div>
        <div class="workflow-card"><div class="workflow-step-num">3</div><h3>Inventory Log</h3><p>Approved medicines are logged in a centralized catalog for NGOs to request.</p></div>
        <div class="workflow-card"><div class="workflow-step-num">4</div><h3>Charity Request</h3><p>Verified NGOs request specific stock. Admin reviews and dispatches packages.</p></div>
        <div class="workflow-card"><div class="workflow-step-num">5</div><h3>Patients Helped</h3><p>Medicines are given to underprivileged patients completely free of cost.</p></div>
      </div>
    </section>

    <!-- Testimonials -->
    <section style="margin-bottom:80px;">
      <div class="section-title-wrap">
        <h2 class="section-title">Testimonials</h2>
        <p class="section-subtitle">Real stories from our donors and charity hospitals.</p>
      </div>
      <div class="testimonials-grid">
        <div class="testimonial-card"><p class="testimonial-text">"I had unused prescription medicines left over after my recovery. I wanted them to help someone rather than throwing them in the trash. The pickup process was so simple!"</p><div class="testimonial-author"><div class="author-avatar">MS</div><div class="author-info"><h4>Margaret Smith</h4><span>Individual Donor</span></div></div></div>
        <div class="testimonial-card"><p class="testimonial-text">"In our medical camps, getting quality medicines is always our highest cost. Thanks to MRRS, we received cardiac and antibiotic batches that were fully verified by doctors."</p><div class="testimonial-author"><div class="author-avatar">HC</div><div class="author-info"><h4>Dr. Allen Brooks</h4><span>Hope Clinic Director</span></div></div></div>
        <div class="testimonial-card"><p class="testimonial-text">"As a volunteer verifier, I ensure every batch has at least 3 months shelf-life and sealed blisters. It's rewarding to bridge the gap between waste and critical care."</p><div class="testimonial-author"><div class="author-avatar">RC</div><div class="author-info"><h4>Dr. Robert Chen</h4><span>Verification Lead</span></div></div></div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq-wrap">
      <div class="section-title-wrap">
        <h2 class="section-title">Frequently Asked Questions</h2>
        <p class="section-subtitle">Everything you need to know about medicine donations and safety standards.</p>
      </div>
      <div class="faq-item"><div class="faq-question">What types of medicines can I donate?<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div><div class="faq-answer">We accept unused, unopened, and sealed prescription and OTC medicines. Liquid bottles must have intact seals. No opened bottles, loose tablets, or near-expiry medicines.</div></div>
      <div class="faq-item"><div class="faq-question">Is there any fee to receive medicines?<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div><div class="faq-answer">Absolutely not. All medicines through MRRS are distributed completely free of cost. No medical store or private hospital is permitted to receive them.</div></div>
      <div class="faq-item"><div class="faq-question">How do you ensure medicine safety?<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div><div class="faq-answer">Every donation is audited by licensed doctors and pharmacists who verify packaging integrity and that the expiry date is at least 3 months in the future.</div></div>
    </section>
  `;

  document.getElementById("hero-donate-btn")?.addEventListener("click", () => navigateTo("donate"));
  document.getElementById("hero-about-btn")?.addEventListener("click", () => navigateTo("about"));

  container.querySelectorAll(".faq-question").forEach(item => {
    item.addEventListener("click", () => {
      const parent = item.parentElement;
      const isActive = parent.classList.contains("active");
      container.querySelectorAll(".faq-item").forEach(f => f.classList.remove("active"));
      if (!isActive) parent.classList.add("active");
    });
  });

  // Load real stats from MongoDB
  try {
    const stats = await getPublicStats();
    setTimeout(() => {
      animateCounter("count-rescued",   stats.medicinesRescued || 0);
      animateCounter("count-charities", stats.connectedCharities || 0);
      animateCounter("count-patients",  stats.patientsHelped || 0);
      animateCounter("count-donations", stats.completedDonations || 0);
    }, 100);
  } catch {
    setTimeout(() => {
      animateCounter("count-rescued",   230);
      animateCounter("count-charities", 12);
      animateCounter("count-patients",  40);
      animateCounter("count-donations", 80);
    }, 100);
  }
}

// ── About ─────────────────────────────────────────────────────────────────────
function renderAbout(container) {
  container.innerHTML = `
    <div class="section-title-wrap">
      <h2 class="section-title">About Our Mission</h2>
      <p class="section-subtitle">Rescuing Medicines, Restoring Lives.</p>
    </div>
    <div class="about-grid">
      <div>
        <h3 style="font-size:1.5rem;color:var(--primary-color);margin-bottom:16px;">Reducing Waste, Empowering Communities</h3>
        <p style="color:var(--text-muted);margin-bottom:16px;">Millions of dollars worth of perfectly usable, unexpired medicines are thrown away annually by households, while millions of underprivileged patients struggle to afford basic prescriptions.</p>
        <p style="color:var(--text-muted);">The Medicine Rescue and Redistribution System (MRRS) bridges this gap by creating a safe, transparent, and completely free supply chain connecting individual donors to verified healthcare charity organizations, NGOs, and medical camps.</p>
        <ul class="about-features">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><strong>Strictly Non-Profit:</strong> Zero cost distribution. Commercial resale is blocked.</li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><strong>Rigorous Verification:</strong> Audited by licensed medical professionals.</li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><strong>Trust &amp; Transparency:</strong> Full audit logs and requests tracking via MongoDB.</li>
        </ul>
      </div>
      <div style="display:flex;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 350" width="100%">
          <rect width="400" height="350" rx="20" fill="#EAF7EE" />
          <circle cx="200" cy="160" r="80" fill="#FFF" />
          <path d="M150 190 l30-30 c10-10 25-10 35 0 l30 30" fill="none" stroke="var(--primary-color)" stroke-width="12" stroke-linecap="round" />
          <path d="M120 220 h160" stroke="var(--secondary-color)" stroke-width="8" stroke-linecap="round" />
          <text x="200" y="290" text-anchor="middle" font-family="'Poppins', sans-serif" font-weight="700" font-size="18" fill="var(--secondary-color)">Redistribution and Trust</text>
        </svg>
      </div>
    </div>
  `;
}

function renderHowItWorks(container) { renderHome(container); }

// ── Charities List ────────────────────────────────────────────────────────────
async function renderCharitiesList(container) {
  container.innerHTML = `
    <div class="section-title-wrap">
      <h2 class="section-title">Verified Charity Partners</h2>
      <p class="section-subtitle">We partner exclusively with verified healthcare NGOs, free hospitals, and medical camps.</p>
    </div>
    <div style="max-width:900px;margin:0 auto 40px auto;">
      <div class="contact-info-card" style="padding:24px;border-radius:var(--radius-md);background-color:var(--primary-light);color:var(--primary-dark);margin-bottom:32px;">
        <strong style="display:block;margin-bottom:4px;">Eligibility Warning:</strong>
        <p style="font-size:0.9rem;margin:0;">Under no circumstances does MRRS distribute medicines to commercial entities, private hospitals, retail pharmacies, or stores. All medicines are allocated strictly to organizations offering medical treatment completely free of cost.</p>
      </div>
      <div id="charities-public-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;">
        <p style="color:var(--text-muted);">Loading verified partners...</p>
      </div>
    </div>
  `;

  try {
    const { getCharities } = await import("./api.js");
    const charities = await getCharities().catch(() => []);
    const verified = charities.filter(c => c.verified);
    const grid = container.querySelector("#charities-public-grid");
    if (!grid) return;

    if (verified.length === 0) {
      grid.innerHTML = `<p style="color:var(--text-muted);">No verified charities yet.</p>`;
    } else {
      grid.innerHTML = verified.map(c => `
        <div class="workflow-card" style="text-align:left;padding:24px;">
          <span class="badge" style="background-color:var(--secondary-light);color:var(--secondary-color);margin-bottom:12px;">${c.type || "Charity"}</span>
          <h3 style="font-size:1.15rem;margin-bottom:8px;color:var(--text-dark);">${c.name}</h3>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:6px;"><strong>Location:</strong> ${c.address || "—"}</p>
          <p style="font-size:0.85rem;color:var(--text-muted);"><strong>Contact:</strong> ${c.contactPerson || "—"}</p>
        </div>`).join("");
    }
  } catch { /* not logged in — show empty */ }
}

// ── Contact ───────────────────────────────────────────────────────────────────
function renderContact(container) {
  container.innerHTML = `
    <div class="section-title-wrap">
      <h2 class="section-title">Contact Us</h2>
      <p class="section-subtitle">Have questions about donation eligibility or registration? Get in touch with our team.</p>
    </div>
    <div class="contact-section-grid" style="max-width:1100px;margin:0 auto 40px auto;">
      <div class="contact-info-card">
        <h3 style="margin-bottom:24px;font-size:1.35rem;">Contact Information</h3>
        <div class="contact-method"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><div><h4>Email</h4><p>support@mrrs.org</p></div></div>
        <div class="contact-method"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><div><h4>Helpline</h4><p>+1 (800) 555-RESCUE</p></div></div>
        <div class="contact-method"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><div><h4>HQ Address</h4><p>789 Health &amp; Outreach Ave, Suite 300</p></div></div>
      </div>
      <div class="card-table-wrap" style="padding:40px;">
        <h3 style="margin-bottom:20px;font-size:1.35rem;">Send a Message</h3>
        <form id="contact-form" style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" placeholder="Enter your name" required /></div>
          <div class="form-group"><label class="form-label">Email Address</label><input type="email" class="form-input" placeholder="Enter email" required /></div>
          <div class="form-group"><label class="form-label">Message</label><textarea class="form-input" placeholder="Your message..." rows="4" style="resize:none;" required></textarea></div>
          <button type="submit" class="btn btn-primary" style="margin-top:10px;">Send Message</button>
        </form>
      </div>
    </div>
  `;

  container.querySelector("#contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Thank you! Your message has been sent. We will respond within 24 hours.", "success");
    e.target.reset();
  });
}

// ── Login ─────────────────────────────────────────────────────────────────────
function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-container">
      <h2 style="font-size:1.5rem;text-align:center;margin-bottom:8px;">Login to Your Account</h2>
      <p style="color:var(--text-muted);font-size:0.85rem;text-align:center;margin-bottom:28px;">Enter your credentials to access your role-specific dashboard.</p>
      <form id="login-form" style="display:flex;flex-direction:column;gap:16px;">
        <div class="form-group"><label class="form-label" for="login-email">Email Address</label><input type="email" id="login-email" class="form-input" placeholder="e.g. donor@mrrs.org" required /></div>
        <div class="form-group"><label class="form-label" for="login-pass">Password</label><input type="password" id="login-pass" class="form-input" placeholder="••••••••" required /></div>
        <button type="submit" id="login-submit-btn" class="btn btn-primary" style="margin-top:10px;width:100%;">Sign In</button>
      </form>
      <div style="margin-top:24px;text-align:center;border-top:1px solid var(--border-color);padding-top:16px;">
        <p style="font-size:0.85rem;color:var(--text-muted);">Don't have an account? <a href="#register" style="font-weight:600;">Register Here</a></p>
      </div>
    </div>
  `;

  const emailInput = container.querySelector("#login-email");
  const passInput  = container.querySelector("#login-pass");

  container.querySelector("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = container.querySelector("#login-submit-btn");
    btn.disabled = true; btn.textContent = "Signing in...";

    try {
      const user = await apiLogin(emailInput.value.trim(), passInput.value);
      currentUser = user;
      window.updateNavbarState?.();
      showToast(`Welcome back, ${user.name}!`, "success");
      navigateTo("dashboard");
    } catch (err) {
      showToast(err.message, "error");
      btn.disabled = false; btn.textContent = "Sign In";
    }
  });
}

// ── Register ──────────────────────────────────────────────────────────────────
function renderRegister(container) {
  container.innerHTML = `
    <div class="auth-container" style="max-width:550px;">
      <h2 style="font-size:1.5rem;text-align:center;margin-bottom:8px;">Create an Account</h2>
      <p style="color:var(--text-muted);font-size:0.85rem;text-align:center;margin-bottom:24px;">Register as a Donor or a verified Charity Organization.</p>
      <div style="display:flex;background-color:var(--background-color);padding:4px;border-radius:var(--radius-md);margin-bottom:24px;">
        <button class="btn btn-text" id="btn-toggle-donor" style="flex:1;border-radius:var(--radius-md);padding:8px;font-size:0.85rem;font-weight:600;background-color:var(--card-bg);color:var(--primary-color);">Individual Donor</button>
        <button class="btn btn-text" id="btn-toggle-charity" style="flex:1;border-radius:var(--radius-md);padding:8px;font-size:0.85rem;font-weight:600;">Charity / NGO</button>
      </div>

      <!-- Donor Form -->
      <form id="register-donor-form" style="display:flex;flex-direction:column;gap:16px;">
        <div class="form-group"><label class="form-label" for="reg-donor-name">Full Name *</label><input type="text" id="reg-donor-name" class="form-input" placeholder="e.g. Sarah Jenkins" required /></div>
        <div class="form-group"><label class="form-label" for="reg-donor-email">Email Address *</label><input type="email" id="reg-donor-email" class="form-input" required /></div>
        <div class="form-group"><label class="form-label" for="reg-donor-pass">Password *</label><input type="password" id="reg-donor-pass" class="form-input" placeholder="••••••••" required /></div>
        <div class="form-group"><label class="form-label" for="reg-donor-phone">Phone Number</label><input type="text" id="reg-donor-phone" class="form-input" placeholder="+1 555-0199" /></div>
        <button type="submit" id="donor-reg-btn" class="btn btn-primary" style="margin-top:10px;">Register as Donor</button>
      </form>

      <!-- Charity Form -->
      <form id="register-charity-form" style="display:none;flex-direction:column;gap:16px;">
        <div class="form-group"><label class="form-label" for="reg-charity-name">Organization Name *</label><input type="text" id="reg-charity-name" class="form-input" required /></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group"><label class="form-label" for="reg-charity-email">Email *</label><input type="email" id="reg-charity-email" class="form-input" required /></div>
          <div class="form-group"><label class="form-label" for="reg-charity-pass">Password *</label><input type="password" id="reg-charity-pass" class="form-input" placeholder="••••••••" required /></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group"><label class="form-label" for="reg-charity-type">Organization Type *</label>
            <select id="reg-charity-type" class="form-input form-select" required>
              <option value="Charity Hospital">Charity Hospital</option>
              <option value="Healthcare NGO">Healthcare NGO</option>
              <option value="Free Medical Camp">Free Medical Camp</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label" for="reg-charity-contact">Contact Person *</label><input type="text" id="reg-charity-contact" class="form-input" required /></div>
        </div>
        <div class="form-group"><label class="form-label" for="reg-charity-address">Operational Address *</label><input type="text" id="reg-charity-address" class="form-input" required /></div>
        <div style="background-color:var(--warning-light);color:var(--warning-color);padding:12px;border-radius:var(--radius-md);font-size:0.75rem;border:1px dashed var(--warning-color);">
          <strong>Verification Required:</strong> Admin will review your organization before granting access.
        </div>
        <button type="submit" id="charity-reg-btn" class="btn btn-secondary" style="margin-top:10px;">Register Organization</button>
      </form>

      <div style="margin-top:24px;text-align:center;border-top:1px solid var(--border-color);padding-top:16px;">
        <p style="font-size:0.85rem;color:var(--text-muted);">Already have an account? <a href="#login" style="font-weight:600;">Login here</a></p>
      </div>
    </div>
  `;

  const btnDonor   = container.querySelector("#btn-toggle-donor");
  const btnCharity = container.querySelector("#btn-toggle-charity");
  const fDonor     = container.querySelector("#register-donor-form");
  const fCharity   = container.querySelector("#register-charity-form");

  btnDonor.addEventListener("click", () => {
    btnDonor.style.cssText   = "flex:1;border-radius:var(--radius-md);padding:8px;font-size:0.85rem;font-weight:600;background-color:var(--card-bg);color:var(--primary-color);";
    btnCharity.style.cssText = "flex:1;border-radius:var(--radius-md);padding:8px;font-size:0.85rem;font-weight:600;background-color:transparent;color:var(--text-muted);";
    fDonor.style.display = "flex"; fCharity.style.display = "none";
  });

  btnCharity.addEventListener("click", () => {
    btnCharity.style.cssText = "flex:1;border-radius:var(--radius-md);padding:8px;font-size:0.85rem;font-weight:600;background-color:var(--card-bg);color:var(--primary-color);";
    btnDonor.style.cssText   = "flex:1;border-radius:var(--radius-md);padding:8px;font-size:0.85rem;font-weight:600;background-color:transparent;color:var(--text-muted);";
    fDonor.style.display = "none"; fCharity.style.display = "flex";
  });

  fDonor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = container.querySelector("#donor-reg-btn");
    btn.disabled = true; btn.textContent = "Registering...";
    try {
      await apiRegister({
        name:     container.querySelector("#reg-donor-name").value.trim(),
        email:    container.querySelector("#reg-donor-email").value.trim(),
        password: container.querySelector("#reg-donor-pass").value,
        phone:    container.querySelector("#reg-donor-phone").value.trim(),
        role:     "donor",
      });
      showToast("Registration successful! You can now log in.", "success");
      navigateTo("login");
    } catch (err) {
      showToast(err.message, "error");
      btn.disabled = false; btn.textContent = "Register as Donor";
    }
  });

  fCharity.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = container.querySelector("#charity-reg-btn");
    btn.disabled = true; btn.textContent = "Submitting...";
    try {
      await apiRegister({
        name:          container.querySelector("#reg-charity-name").value.trim(),
        email:         container.querySelector("#reg-charity-email").value.trim(),
        password:      container.querySelector("#reg-charity-pass").value,
        type:          container.querySelector("#reg-charity-type").value,
        contactPerson: container.querySelector("#reg-charity-contact").value.trim(),
        address:       container.querySelector("#reg-charity-address").value.trim(),
        role:          "charity",
      });
      showToast("Registration submitted! Pending admin verification before you can request medicines.", "warning");
      navigateTo("login");
    } catch (err) {
      showToast(err.message, "error");
      btn.disabled = false; btn.textContent = "Register Organization";
    }
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard(container) {
  if (!currentUser) return;

  container.innerHTML = `
    <div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <h1 style="font-size:2rem;text-transform:capitalize;">${currentUser.role} Control Center</h1>
        <p style="color:var(--text-muted);font-size:0.9rem;">Logged in as: <strong>${currentUser.name}</strong> (${currentUser.email})</p>
      </div>
      <span class="badge" style="background-color:var(--primary-light);color:var(--primary-color);font-weight:600;">${currentUser.role.toUpperCase()} ACCOUNT</span>
    </div>
    <div id="dashboard-role-content"></div>
  `;

  const dc = container.querySelector("#dashboard-role-content");
  if (currentUser.role === "donor")    initDonorDashboard(dc, currentUser);
  if (currentUser.role === "verifier") initVerificationDashboard(dc, currentUser);
  if (currentUser.role === "charity")  initCharityDashboard(dc, currentUser);
  if (currentUser.role === "admin")    initAdminDashboard(dc, currentUser);
}

// ── Logout ────────────────────────────────────────────────────────────────────
function handleLogout() {
  apiLogout();
  currentUser = null;
  showToast("Logged out successfully.", "info");
  navigateTo("home");
  window.updateNavbarState?.();
}
