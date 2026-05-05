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
  compare: storage.get("comparePrograms", [])
};

function getCompany(companyId) {
  return companies.find((c) => c.id === companyId);
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

function cardMarkup(program) {
  const company = getCompany(program.companyId);
  const isSaved = state.saved.includes(program.id);
  const isCompared = state.compare.includes(program.id);
  const rot = (parseInt(program.id.replace("p", ""), 10) % 2 ? -1.8 : 1.2) + "deg";
  return `
    <article class="program-card ${program.featured ? "featured" : ""}" style="--rot:${rot}">
      <span class="pin" aria-hidden="true"></span>
      <div class="meta">
        <strong>${company.name}</strong>
        <span>${program.city}</span>
      </div>
      <h3>${program.title}</h3>
      <div class="badges">
        <span class="badge">${program.category}</span>
        <span class="badge">${program.durationWeeks} weeks</span>
        <span class="badge">${program.priceType}</span>
        ${company.verified ? '<span class="badge success">Verified Company</span>' : ""}
      </div>
      <p class="small">Deadline: ${deadlineLeft(program.deadline)}</p>
      <div class="trust">
        <div class="small">Trust Score ${company.trustScore}/100</div>
        <div class="trust-bar"><span style="width:${company.trustScore}%"></span></div>
      </div>
      <div class="card-actions">
        <a class="btn" href="program.html?id=${program.id}">View Program</a>
        <button class="btn-outline save-btn" data-id="${program.id}">${isSaved ? "Saved" : "Save"}</button>
        <button class="btn-outline compare-btn" data-id="${program.id}">${isCompared ? "Comparing" : "Compare"}</button>
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
  const selected = programs.filter((p) => state.compare.includes(p.id));
  box.innerHTML = "";
  selected.forEach((p) => {
    const company = getCompany(p.companyId);
    box.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${p.title}</td><td>${p.durationWeeks} weeks</td><td>${p.priceType}</td><td>${p.city}</td><td>${company.trustScore}</td><td>${p.seats}</td><td>${deadlineLeft(p.deadline)}</td></tr>`
    );
  });
}

function renderHome() {
  if (!$("#homeBoard")) return;
  const sorted = [...programs].sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
  renderBoard("homeBoard", sorted.slice(0, 6));

  const nearYou = state.location ? sorted.filter((p) => p.city === state.location) : sorted.slice(0, 3);
  renderBoard("nearYouBoard", nearYou.slice(0, 3));

  const weekly = [...sorted]
    .sort((a, b) => getCompany(b.companyId).trustScore - getCompany(a.companyId).trustScore)
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

  let list = programs.filter((p) => {
    const c = getCompany(p.companyId);
    const matchesKeyword = !keyword || p.title.toLowerCase().includes(keyword) || c.name.toLowerCase().includes(keyword);
    const matchesCity = !city || p.city === city;
    const matchesCategory = !category || p.category === category;
    const matchesVerified = !verifiedOnly || c.verified;
    const matchesDuration = !duration || (duration === "short" ? p.durationWeeks <= 8 : p.durationWeeks > 8);
    const matchesPrice = !price || p.priceType === price;
    return matchesKeyword && matchesCity && matchesCategory && matchesVerified && matchesDuration && matchesPrice;
  });

  if (sortBy === "deadline") list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  if (sortBy === "trust") list.sort((a, b) => getCompany(b.companyId).trustScore - getCompany(a.companyId).trustScore);
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
  const program = programs.find((p) => p.id === id) || programs[0];
  const company = getCompany(program.companyId);
  $("#programDetails").innerHTML = `
    <h1>${program.title}</h1>
    <p>${program.description}</p>
    <div class="badges">
      <span class="badge">${program.category}</span>
      <span class="badge">${program.city}</span>
      <span class="badge">${program.durationWeeks} weeks</span>
      ${company.verified ? '<span class="badge success">Verified Company</span>' : ""}
    </div>
    <p><strong>Company:</strong> <a href="company.html?id=${company.id}">${company.name}</a></p>
    <p><strong>Schedule:</strong> ${program.schedule}</p>
    <p><strong>Location:</strong> ${program.locationText}</p>
    <p><strong>Seats:</strong> ${program.seats}</p>
    <p><strong>Deadline:</strong> ${deadlineLeft(program.deadline)}</p>
    <h3>Required Skills</h3>
    <ul>${program.requiredSkills.map((s) => `<li>${s}</li>`).join("")}</ul>
    <div class="card-actions">
      <button id="applyBtn" class="btn">${state.applied.includes(program.id) ? "Applied" : "Apply"}</button>
      <button id="saveProgramBtn" class="btn-outline">${state.saved.includes(program.id) ? "Saved" : "Save"}</button>
      <button id="reportBtn" class="btn-outline">Report</button>
    </div>
  `;
  $("#mapFrame").src = program.mapEmbed;

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
  const saved = programs.filter((p) => state.saved.includes(p.id));
  const applied = programs.filter((p) => state.applied.includes(p.id));
  $("#savedList").innerHTML = saved.map((p) => `<li>${p.title} - ${p.city}</li>`).join("") || "<li>No saved programs yet.</li>";
  $("#applicationsList").innerHTML = applied.map((p) => `<li>${p.title} - Application sent</li>`).join("") || "<li>No applications yet.</li>";

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
  bindCardActions();
  bindReportModal();
  initSkeletonThenRender();
  renderCompareTable();
  renderProgram();
  renderCompany();
  renderDashboard();
  renderVerify();
});
