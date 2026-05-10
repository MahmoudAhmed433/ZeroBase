const $ = (sel) => document.querySelector(sel);

function setMessage(message, isError = false) {
  const box = $("#authMessage");
  box.textContent = message;
  box.style.color = isError ? "#db4437" : "#0f9d58";
}

function showStep(step) {
  $("#loginForm").classList.add("hidden");
  $("#roleStep").classList.toggle("hidden", step !== "role");
  $("#studentForm").classList.toggle("hidden", step !== "student");
  $("#companyForm").classList.toggle("hidden", step !== "company");
  if (step === "role") setSignupProgress("role");
  if (step === "student" || step === "company") setSignupProgress("form");
}

function setSignupProgress(stage) {
  const d1 = $("#progStep1");
  const d2 = $("#progStep2");
  const label = $("#progLabel");
  if (!d1 || !d2) return;
  if (stage === "role") {
    d1.classList.add("active");
    d1.classList.remove("done");
    d2.classList.remove("active");
    d2.classList.remove("done");
    if (label) label.textContent = "Step 1 of 2 — Choose account type";
  } else if (stage === "form") {
    d1.classList.remove("active");
    d1.classList.add("done");
    d2.classList.add("active");
    d2.classList.remove("done");
    if (label) label.textContent = "Step 2 of 2 — Your details";
  }
}

function showLanding() {
  $("#authLanding")?.classList.remove("hidden");
  $("#signupPanel")?.classList.add("hidden");
  $("#loginPanel")?.classList.add("hidden");
}

function beginSignup() {
  $("#authLanding")?.classList.add("hidden");
  $("#loginPanel")?.classList.add("hidden");
  $("#signupPanel")?.classList.remove("hidden");
  showStep("role");
}

function showLoginPanel() {
  $("#authLanding")?.classList.add("hidden");
  $("#signupPanel")?.classList.add("hidden");
  $("#loginPanel")?.classList.remove("hidden");
}

function saveSession(data) {
  localStorage.setItem("accessToken", JSON.stringify(data.access_token));
  localStorage.setItem("authUser", JSON.stringify(data.user));
}

async function registerStudent(e) {
  e.preventDefault();
  try {
    await window.ZB.ensureCsrf();
    const data = await window.ZB.apiRequest("/auth/register/student/", {
      method: "POST",
      body: JSON.stringify({
        username: $("#studentUsername").value.trim(),
        email: $("#studentEmail").value.trim(),
        password: $("#studentPassword").value
      })
    });
    saveSession(data);
    setMessage("Student account created successfully. Redirecting...");
    setTimeout(() => (location.href = "dashboard.html"), 600);
  } catch (err) {
    setMessage(err.message, true);
  }
}

async function registerCompany(e) {
  e.preventDefault();
  try {
    await window.ZB.ensureCsrf();
    const data = await window.ZB.apiRequest("/auth/register/company/", {
      method: "POST",
      body: JSON.stringify({
        company_name: $("#companyName").value.trim(),
        email: $("#companyEmail").value.trim(),
        password: $("#companyPassword").value,
        industry: $("#companyIndustry").value.trim(),
        size: $("#companySize").value.trim(),
        website: $("#companyWebsite").value.trim(),
        description: $("#companyDescription").value.trim()
      })
    });
    saveSession(data);
    setMessage("Company account created successfully. Redirecting...");
    setTimeout(() => (location.href = "dashboard.html"), 600);
  } catch (err) {
    setMessage(err.message, true);
  }
}

async function login(e) {
  e.preventDefault();
  try {
    await window.ZB.ensureCsrf();
    const data = await window.ZB.apiRequest("/auth/login/", {
      method: "POST",
      body: JSON.stringify({
        email: $("#loginEmail").value.trim(),
        password: $("#loginPassword").value
      })
    });
    saveSession(data);
    setMessage("Login successful. Redirecting...");
    setTimeout(() => (location.href = "dashboard.html"), 600);
  } catch (err) {
    setMessage(err.message, true);
  }
}

function bindPasswordToggles() {
  document.querySelectorAll(".auth-toggle-pass").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-target");
      const input = id ? document.getElementById(id) : null;
      if (!input) return;
      const isPwd = input.type === "password";
      input.type = isPwd ? "text" : "password";
      btn.textContent = isPwd ? "Hide" : "Show";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.ZB) {
    console.error("Load zb-api.js before auth.js");
    return;
  }
  showLanding();
  bindPasswordToggles();

  $("#openSignup")?.addEventListener("click", beginSignup);
  $("#openLogin")?.addEventListener("click", showLoginPanel);
  $("#landingToLogin")?.addEventListener("click", showLoginPanel);
  $("#landingToSignup")?.addEventListener("click", beginSignup);
  $("#loginBack")?.addEventListener("click", showLanding);
  $("#signupCancel")?.addEventListener("click", showLanding);

  document.querySelectorAll(".to-login-auth").forEach((b) => b.addEventListener("click", showLoginPanel));

  $("#chooseStudent")?.addEventListener("click", () => showStep("student"));
  $("#chooseCompany")?.addEventListener("click", () => showStep("company"));
  $("#studentBack")?.addEventListener("click", () => showStep("role"));
  $("#companyBack")?.addEventListener("click", () => showStep("role"));

  $("#studentForm")?.addEventListener("submit", registerStudent);
  $("#companyForm")?.addEventListener("submit", registerCompany);
  $("#loginForm")?.addEventListener("submit", login);
});
