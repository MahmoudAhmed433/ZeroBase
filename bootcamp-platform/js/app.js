const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const state = {
  saved: storage.get("savedPrograms", []),
  applied: storage.get("appliedPrograms", []),
  location: storage.get("selectedLocation", ""),
  soundEnabled: storage.get("soundEnabled", false),
  darkMode: storage.get("darkMode", false),
  compare: storage.get("comparePrograms", []),
  auth: storage.get("authUser", null),
  accessToken: storage.get("accessToken", null),
  csrfToken: null
};

let remotePrograms = [];

function getCompany(companyId) {
  return companies.find((c) => c.id === companyId);
}

function companyFromProgram(program) {
  if (program.company) {
    return {
      id: program.company.id,
      name: program.company.name || "Company",
      logo: program.company.logo || "CO",
      verified: true,
      trustScore: 80
    };
  }
  return getCompany(program.companyId);
}

function deadlineLeft(deadline) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return `${d}d ${h}h left`;
}

function mockSound(type) {
  if (!state.soundEnabled) return;
  const frequencies = { pin: 680, paper: 260, typing: 540 };
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequencies[type] || 320;
  gain.gain.value = 0.03;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

/** Home/Browse/Compare/Dashboard use `programs` from data.js (full card layout). `remotePrograms` is filled from the API for future features only. */
function getProgramsSource() {
  return programs;
}

async function apiRequest(path, options = {}) {
  if (!window.ZB) throw new Error("ZB API not loaded");
  return window.ZB.apiRequest(path, options);
}

async function ensureCsrf() {
  if (!window.ZB) throw new Error("ZB API not loaded");
  const t = await window.ZB.ensureCsrf();
  state.csrfToken = t;
  return t;
}

function saveAuth(data) {
  state.auth = data.user;
  state.accessToken = data.access_token;
  storage.set("authUser", state.auth);
  storage.set("accessToken", state.accessToken);
}

function clearAuth() {
  state.auth = null;
  state.accessToken = null;
  storage.set("authUser", null);
  storage.set("accessToken", null);
}

function cardMarkup(program) {
  const company = companyFromProgram(program);
  const pid = String(program.id);
  const isSaved = state.saved.some((x) => String(x) === pid);
  const isCompared = state.compare.some((x) => String(x) === pid);
  const idNum = parseInt(pid.replace(/^p/i, ""), 10) || 0;
  const rot = (idNum % 2 ? -1.8 : 1.2) + "deg";
  return `
    <article class="program-card ${program.featured ? "featured" : ""}" style="--rot:${rot}">
      <span class="pin" aria-hidden="true"></span>
      <div class="meta">
        <strong>${company.name}</strong>
        <span>${program.city}</span>
      </div>
      <h3>${program.title}</h3>
      <div class="badges">
        <span class="badge">${program.category || program.type || "Program"}</span>
        <span class="badge">${program.durationWeeks || 8} weeks</span>
        <span class="badge">${program.priceType || (program.salary ? "Paid" : "Flexible")}</span>
        ${company.verified ? '<span class="badge success">Verified Company</span>' : ""}
      </div>
      <p class="small">Deadline: ${deadlineLeft(program.deadline)}</p>
      <div class="trust">
        <div class="small">Trust Score ${company.trustScore}/100</div>
        <div class="trust-bar"><span style="width:${company.trustScore}%"></span></div>
      </div>
      <div class="card-actions">
        <a class="btn" href="program.html?id=${encodeURIComponent(pid)}">View Program</a>
        <button class="btn-outline save-btn" data-id="${pid}">${isSaved ? "Saved" : "Save"}</button>
        <button class="btn-outline compare-btn" data-id="${pid}">${isCompared ? "Comparing" : "Compare"}</button>
      </div>
    </article>
  `;
}

function renderBoard(containerId, list) {
  const container = $("#" + containerId);
  if (!container) return;
  container.innerHTML = "";
  list.forEach((program) => container.insertAdjacentHTML("beforeend", cardMarkup(program)));
}

function bindCommon() {
  if (state.darkMode) document.body.classList.add("dark");
  const darkToggle = $("#darkToggle");
  const soundToggle = $("#soundToggle");
  const locationSelect = $("#locationSelect");
  const compareCount = $("#compareCount");

  if (darkToggle) darkToggle.checked = state.darkMode;
  if (soundToggle) soundToggle.checked = state.soundEnabled;
  if (locationSelect && state.location) locationSelect.value = state.location;
  if (compareCount) compareCount.textContent = state.compare.length;

  darkToggle?.addEventListener("change", (e) => {
    state.darkMode = e.target.checked;
    storage.set("darkMode", state.darkMode);
    document.body.classList.toggle("dark", state.darkMode);
  });

  soundToggle?.addEventListener("change", (e) => {
    state.soundEnabled = e.target.checked;
    storage.set("soundEnabled", state.soundEnabled);
  });

  locationSelect?.addEventListener("change", (e) => {
    state.location = e.target.value;
    storage.set("selectedLocation", state.location);
    location.reload();
  });

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(".program-card")) mockSound("paper");
  });
}

function bindCardActions() {
  document.addEventListener("click", (e) => {
    const saveBtn = e.target.closest(".save-btn");
    const compareBtn = e.target.closest(".compare-btn");
    if (saveBtn) {
      const id = saveBtn.dataset.id;
      if (!state.saved.includes(id)) state.saved.push(id);
      else state.saved = state.saved.filter((x) => x !== id);
      storage.set("savedPrograms", state.saved);
      saveBtn.textContent = state.saved.includes(id) ? "Saved" : "Save";
    }
    if (compareBtn) {
      const id = compareBtn.dataset.id;
      if (!state.compare.includes(id) && state.compare.length < 3) state.compare.push(id);
      else state.compare = state.compare.filter((x) => x !== id);
      storage.set("comparePrograms", state.compare);
      compareBtn.textContent = state.compare.includes(id) ? "Comparing" : "Compare";
      const compareCount = $("#compareCount");
      if (compareCount) compareCount.textContent = state.compare.length;
      renderCompareTable();
    }
  });
}

function renderCompareTable() {
  const box = $("#compareTableBody");
  if (!box) return;
  const selected = getProgramsSource().filter((p) => state.compare.includes(p.id));
  box.innerHTML = "";
  selected.forEach((p) => {
    const company = companyFromProgram(p);
    box.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${p.title}</td><td>${p.durationWeeks || 8} weeks</td><td>${p.priceType || "Flexible"}</td><td>${p.city || p.location || "Remote"}</td><td>${company.trustScore || 80}</td><td>${p.seats || "N/A"}</td><td>${deadlineLeft(p.deadline || new Date().toISOString())}</td></tr>`
    );
  });
}

function renderHome() {
  if (!$("#homeBoard")) return;
  const sorted = [...getProgramsSource()].sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
  renderBoard("homeBoard", sorted.slice(0, 6));

  const nearYou = state.location ? sorted.filter((p) => p.city === state.location) : sorted.slice(0, 3);
  renderBoard("nearYouBoard", nearYou.slice(0, 3));

  const weekly = [...sorted]
    .sort((a, b) => companyFromProgram(b).trustScore - companyFromProgram(a).trustScore)
    .slice(0, 3);
  renderBoard("weeklyBoard", weekly);
}

function applyBrowseFilters() {
  const keyword = ($("#searchInput")?.value || "").toLowerCase();
  const city = $("#cityFilter")?.value || "";
  const category = $("#categoryFilter")?.value || "";
  const verifiedOnly = $("#verifiedFilter")?.checked;
  const duration = $("#durationFilter")?.value || "";
  const price = $("#priceFilter")?.value || "";
  const sortBy = $("#sortFilter")?.value || "newest";

  let list = getProgramsSource().filter((p) => {
    const c = companyFromProgram(p);
    const matchesKeyword =
      !keyword ||
      p.title.toLowerCase().includes(keyword) ||
      (c.name || "").toLowerCase().includes(keyword);
    const matchesCity = !city || p.city === city;
    const matchesCategory = !category || p.category === category;
    const matchesVerified = !verifiedOnly || c.verified;
    const matchesDuration = !duration || (duration === "short" ? p.durationWeeks <= 8 : p.durationWeeks > 8);
    const matchesPrice = !price || p.priceType === price;
    return matchesKeyword && matchesCity && matchesCategory && matchesVerified && matchesDuration && matchesPrice;
  });

  if (sortBy === "deadline") list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    if (sortBy === "trust") list.sort((a, b) => companyFromProgram(b).trustScore - companyFromProgram(a).trustScore);
  if (sortBy === "newest") list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  renderBoard("browseBoard", list);
}

function renderBrowse() {
  if (!$("#browseBoard")) return;
  const ids = ["searchInput", "cityFilter", "categoryFilter", "verifiedFilter", "durationFilter", "priceFilter", "sortFilter"];
  ids.forEach((id) => $("#" + id)?.addEventListener(id === "verifiedFilter" ? "change" : "input", applyBrowseFilters));
  $("#sortFilter")?.addEventListener("change", applyBrowseFilters);
  applyBrowseFilters();
}

function renderProgram() {
  if (!$("#programDetails")) return;
  const id = new URLSearchParams(location.search).get("id");
  const source = getProgramsSource();
  const program = source.find((p) => String(p.id) === String(id)) || source[0];
  const company = companyFromProgram(program);
  $("#programDetails").innerHTML = `
    <h1>${program.title}</h1>
    <p>${program.description || "No description provided yet."}</p>
    <div class="badges">
      <span class="badge">${program.category || program.type || "Program"}</span>
      <span class="badge">${program.city || program.location || "Remote"}</span>
      <span class="badge">${program.durationWeeks || 8} weeks</span>
      ${company.verified ? '<span class="badge success">Verified Company</span>' : ""}
    </div>
    <p><strong>Company:</strong> <a href="company.html?id=${company.id}">${company.name}</a></p>
    <p><strong>Schedule:</strong> ${program.schedule || "To be announced"}</p>
    <p><strong>Location:</strong> ${program.locationText || program.location || "Not specified"}</p>
    <p><strong>Seats:</strong> ${program.seats || "N/A"}</p>
    <p><strong>Deadline:</strong> ${deadlineLeft(program.deadline)}</p>
    <h3>Required Skills</h3>
    <ul>${(program.requiredSkills || program.tags || []).map((s) => `<li>${s}</li>`).join("")}</ul>
    <div class="card-actions">
      <button id="applyBtn" class="btn">${state.applied.includes(program.id) ? "Applied" : "Apply"}</button>
      <button id="saveProgramBtn" class="btn-outline">${state.saved.includes(program.id) ? "Saved" : "Save"}</button>
      <button id="reportBtn" class="btn-outline">Report</button>
    </div>
  `;
  $("#mapFrame").src = program.mapEmbed || "https://maps.google.com/maps?q=cairo&t=&z=12&ie=UTF8&iwloc=&output=embed";

  const qa = questionsMock[program.id] || [];
  $("#qaList").innerHTML = qa.map((q) => `<li><strong>${q.by}:</strong> ${q.text}<br><span class="small">Company reply: ${q.reply}</span></li>`).join("");

  $("#applyBtn")?.addEventListener("click", () => {
    if (!state.applied.includes(program.id)) state.applied.push(program.id);
    storage.set("appliedPrograms", state.applied);
    $("#applyBtn").textContent = "Applied";
    mockSound("pin");
  });
  $("#saveProgramBtn")?.addEventListener("click", () => {
    if (!state.saved.includes(program.id)) state.saved.push(program.id);
    else state.saved = state.saved.filter((x) => x !== program.id);
    storage.set("savedPrograms", state.saved);
    $("#saveProgramBtn").textContent = state.saved.includes(program.id) ? "Saved" : "Save";
  });
  $("#reportBtn")?.addEventListener("click", () => $("#reportModal").classList.add("open"));
}

function bindReportModal() {
  $("#closeReport")?.addEventListener("click", () => $("#reportModal").classList.remove("open"));
  $("#submitReport")?.addEventListener("click", () => {
    alert("Report submitted. Thank you for helping keep the platform trusted.");
    $("#reportModal").classList.remove("open");
  });
}

function renderCompany() {
  if (!$("#companyProfile")) return;
  const id = new URLSearchParams(location.search).get("id");
  const company = companies.find((c) => c.id === id) || companies[0];
  const relatedPrograms = programs.filter((p) => p.companyId === company.id);
  $("#companyProfile").innerHTML = `
    <h1>${company.logo} - ${company.name}</h1>
    <p>${company.about}</p>
    <div class="badges">
      ${company.verified ? '<span class="badge success">Verified Company</span>' : '<span class="badge">Pending Verification</span>'}
      <span class="badge">Trust Score ${company.trustScore}/100</span>
    </div>
    <div class="trust"><div class="trust-bar"><span style="width:${company.trustScore}%"></span></div></div>
    <h3>Student Reviews Summary</h3>
    <p>Average Rating: ${company.avgRating}/5 from previous programs.</p>
    <h3>Previous Training Programs</h3>
    <ul>${relatedPrograms.map((p) => `<li>${p.title} (${p.city})</li>`).join("")}</ul>
    <h3>Gallery</h3>
    <div class="badges">${company.gallery.map((g) => `<span class="badge">${g}</span>`).join("")}</div>
  `;
}

function renderDashboard() {
  if (!$("#savedList")) return;
  if (!state.auth) {
    location.href = "auth.html";
    return;
  }
  const dashboardTitle = $("title");
  if (dashboardTitle) {
    dashboardTitle.textContent = state.auth.role === "company" ? "Company Dashboard | ZeroBase" : "Student Dashboard | ZeroBase";
  }
  const source = getProgramsSource();
  const saved = source.filter((p) => state.saved.includes(p.id));
  const applied = source.filter((p) => state.applied.includes(p.id));
  if (state.auth.role === "student") {
    $("#savedList").innerHTML = saved.map((p) => `<li>${p.title} - ${p.city || p.location}</li>`).join("") || "<li>No saved programs yet.</li>";
    $("#applicationsList").innerHTML = applied.map((p) => `<li>${p.title} - Application sent</li>`).join("") || "<li>No applications yet.</li>";
  } else {
    $("#savedList").innerHTML = "<li>Company account: saved list is student-only.</li>";
    $("#applicationsList").innerHTML = `
      <li>
        <strong>Create Post (Draft)</strong><br/>
        <input id="postTitle" placeholder="Post title" style="margin-top:6px"/>
        <input id="postType" placeholder="Type: job/internship/training" style="margin-top:6px"/>
        <input id="postLocation" placeholder="Location" style="margin-top:6px"/>
        <textarea id="postDesc" placeholder="Description" style="margin-top:6px"></textarea>
        <textarea id="postReq" placeholder="Requirements" style="margin-top:6px"></textarea>
        <input id="postTags" placeholder="Tags comma separated" style="margin-top:6px"/>
        <button id="createPostBtn" style="margin-top:8px">Save Draft</button>
        <button id="payPublishBtn" class="btn-outline" style="margin-top:8px">Pay $15 and Publish</button>
        <p id="companyPostMsg" class="small"></p>
        <ul id="companyPostsList" class="list" style="margin-top:10px"></ul>
      </li>
    `;
    let draftPostId = null;
    const renderCompanyPosts = async () => {
      try {
        const listResp = await apiRequest("/company/posts/");
        $("#companyPostsList").innerHTML = (listResp.items || [])
          .map(
            (p) =>
              `<li>${p.title} — ${p.type} — ${p.payment_status.toUpperCase()} — ${
                p.is_published ? "Published" : "Draft"
              }</li>`
          )
          .join("") || "<li>No posts yet.</li>";
      } catch {
        $("#companyPostsList").innerHTML = "<li>Could not load company posts.</li>";
      }
    };
    $("#createPostBtn")?.addEventListener("click", async () => {
      const msg = $("#companyPostMsg");
      try {
        await ensureCsrf();
        const draft = await apiRequest("/create-post/", {
          method: "POST",
          body: JSON.stringify({
            title: $("#postTitle").value.trim(),
            description: $("#postDesc").value.trim(),
            type: ($("#postType").value || "job").trim().toLowerCase(),
            location: $("#postLocation").value.trim(),
            requirements: $("#postReq").value.trim(),
            tags: ($("#postTags").value || "").split(",").map((v) => v.trim()).filter(Boolean)
          })
        });
        draftPostId = draft.id;
        msg.textContent = "Draft created. Complete payment to publish.";
        await renderCompanyPosts();
      } catch (err) {
        msg.textContent = err.message;
      }
    });
    $("#payPublishBtn")?.addEventListener("click", async () => {
      const msg = $("#companyPostMsg");
      if (!draftPostId) {
        msg.textContent = "Create a draft first.";
        return;
      }
      try {
        await ensureCsrf();
        await apiRequest(`/company/posts/${draftPostId}/payment/confirm/`, {
          method: "POST",
          body: JSON.stringify({
            payment_status: "paid",
            transaction_ref: `mock_tx_${Date.now()}`
          })
        });
        msg.textContent = "Payment successful. Post is now published.";
        await renderCompanyPosts();
        await loadBackendFeed();
      } catch (err) {
        msg.textContent = err.message;
      }
    });
    renderCompanyPosts();
  }

  $("#alertsForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const category = $("#alertCategory").value;
    const city = $("#alertCity").value;
    storage.set("alertSettings", { category, city });
    $("#digestBox").textContent = `Weekly digest enabled for ${category || "all categories"} in ${city || "all locations"}.`;
  });
}

function renderVerify() {
  if (!$("#verifyForm")) return;
  $("#verifyForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("#verificationId").value.trim();
    const record = verificationRecords.find((r) => r.id.toLowerCase() === id.toLowerCase());
    $("#verifyResult").innerHTML = record
      ? `<p><strong>Status:</strong> ${record.status}</p><p>Student: ${record.studentName}</p><p>Company: ${record.companyName}</p><p>Training Program: ${record.programTitle}</p><p>Start: ${record.startDate}</p><p>End: ${record.endDate}</p>`
      : "<p><strong>Status:</strong> Not Found</p><p>Please verify the record ID and try again.</p>";
  });
}

function ensureNavAuthLink() {
  const nav = $(".nav-links");
  if (!nav || $("#navAuthGuestLink")) return;
  nav.insertAdjacentHTML(
    "beforeend",
    '<a href="auth.html" id="navAuthGuestLink" class="nav-auth-guest">Login / Sign Up</a>'
  );
}

function mountProfileNavSlot() {
  const host = $(".toolbar") || $(".nav-wrap");
  if (!host || $("#profileNavSlot")) return;
  host.insertAdjacentHTML("beforeend", '<div id="profileNavSlot" class="profile-nav-slot"></div>');
}

if (!window._zbUserMenuOutsideBound) {
  window._zbUserMenuOutsideBound = true;
  document.addEventListener("click", () => {
    $("#userMenuDropdown")?.classList.add("hidden");
    $("#userMenuTrigger")?.setAttribute("aria-expanded", "false");
  });
}

function bindUserMenu() {
  const trigger = $("#userMenuTrigger");
  const menu = $("#userMenuDropdown");
  if (!trigger || !menu) return;
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
    trigger.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
  });
  menu.addEventListener("click", (e) => e.stopPropagation());
  $("#menuLogout")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await ensureCsrf();
      await apiRequest("/auth/logout/", { method: "POST" });
    } catch {}
    clearAuth();
    syncSessionStatus();
    location.href = "index.html";
  });
}

function syncSessionStatus() {
  const guest = $("#navAuthGuestLink");
  const slot = $("#profileNavSlot");
  if (slot) {
    if (state.auth && state.accessToken) {
      const role = state.auth.role;
      const initial = ((role === "company" ? state.auth.email : state.auth.email) || "?").charAt(0).toUpperCase();
      const profileHref = role === "company" ? "profile-company.html" : "profile-student.html";
      slot.innerHTML = `
        <div class="user-menu" id="userMenu">
          <button type="button" class="user-menu-trigger" id="userMenuTrigger" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
            <span class="user-avatar">${initial}</span>
          </button>
          <div class="user-menu-dropdown hidden" id="userMenuDropdown" role="menu">
            <a href="${profileHref}" role="menuitem">View Profile</a>
            <a href="settings.html" role="menuitem">Account Settings</a>
            <a href="change-password.html" role="menuitem">Change Password</a>
            <button type="button" class="user-menu-item" id="menuLogout" role="menuitem">Logout</button>
          </div>
        </div>`;
      bindUserMenu();
      if (guest) guest.classList.add("hidden");
    } else {
      slot.innerHTML = "";
      if (guest) guest.classList.remove("hidden");
    }
  }
}

async function loadBackendFeed() {
  if (!state.accessToken) return;
  try {
    const data = await apiRequest("/home/?page=1&page_size=30");
    remotePrograms = (data.items || []).map((item) => ({
      id: String(item.id),
      company: item.company,
      title: item.title,
      category: item.type,
      type: item.type,
      city: item.location,
      location: item.location,
      description: item.description,
      requiredSkills: item.tags || [],
      tags: item.tags || [],
      postedAt: item.created_at,
      deadline: item.created_at,
      featured: item.is_featured
    }));
  } catch {
    remotePrograms = [];
  }
}

function initSkeletonThenRender() {
  const board = $("#homeBoard, #browseBoard");
  if (!board) return;
  board.innerHTML = Array.from({ length: 4 })
    .map(
      () => `<div class="program-card"><div class="skeleton" style="width:55%"></div><div class="skeleton" style="margin-top:8px"></div><div class="skeleton" style="margin-top:8px;width:70%"></div></div>`
    )
    .join("");
  setTimeout(() => {
    renderHome();
    renderBrowse();
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  bindCommon();
  ensureNavAuthLink();
  mountProfileNavSlot();
  syncSessionStatus();
  bindCardActions();
  bindReportModal();
  initSkeletonThenRender();
  renderCompareTable();
  renderProgram();
  renderCompany();
  renderDashboard();
  renderVerify();
  loadBackendFeed();
});
