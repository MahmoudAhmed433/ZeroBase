(async function () {
  const $ = (s) => document.querySelector(s);
  if (!window.ZB || !ZB.requireAuthRedirect()) return;
  const u = ZB.getAuthUser();
  if (!u || u.role !== "student") {
    window.location.href = "profile-company.html";
    return;
  }
  try {
    await ZB.ensureCsrf();
    const p = await ZB.apiRequest("/profile/");
    const name = p.full_name || p.username || "Student";
    $("#studentDisplayName").textContent = name;
    $("#studentEmail").textContent = p.email || "";
    $("#studentHandle").textContent = p.username ? "@" + p.username : "";
    $("#studentBio").textContent = p.bio || "";
    const img = $("#studentAvatarImg");
    const ph = $("#studentAvatar");
    if (p.profile_picture) {
      img.src = p.profile_picture;
      img.classList.remove("hidden");
      ph.classList.add("hidden");
    } else {
      ph.textContent = (name.charAt(0) || "?").toUpperCase();
    }
    const skills = p.skills || [];
    $("#skillTags").innerHTML = skills.length
      ? skills.map((s) => `<span class="badge">${s}</span>`).join("")
      : '<span class="small">No skills listed yet.</span>';
    const edu = [p.university, p.major].filter(Boolean);
    if (edu.length) {
      $("#studentBio").insertAdjacentHTML(
        "afterend",
        `<p class="small" style="margin-top:8px"><strong>Education:</strong> ${edu.join(" · ")}</p>`
      );
    }
  } catch (e) {
    $("#studentDisplayName").textContent = "Could not load profile";
    $("#studentBio").textContent = e.message;
  }
})();
