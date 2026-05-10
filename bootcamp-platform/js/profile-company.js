(async function () {
  const $ = (s) => document.querySelector(s);
  if (!window.ZB || !ZB.requireAuthRedirect()) return;
  const u = ZB.getAuthUser();
  if (!u || u.role !== "company") {
    window.location.href = "profile-student.html";
    return;
  }
  try {
    await ZB.ensureCsrf();
    const p = await ZB.apiRequest("/profile/");
    $("#companyName").textContent = p.company_name || "Company";
    $("#companyEmail").textContent = p.email || "";
    $("#companyIndustry").textContent = p.industry || "—";
    $("#companySize").textContent = p.size || "—";
    $("#companyVerified").textContent = p.is_verified ? "Verified" : "Pending verification";
    $("#companyVerified").classList.toggle("success", !!p.is_verified);
    $("#companyDesc").textContent = p.description || "";
    const web = p.website;
    $("#companyWebsite").innerHTML = web
      ? `<a href="${web}" target="_blank" rel="noopener">${web}</a>`
      : "";
    const logo = $("#companyLogoImg");
    const ph = $("#companyLogoPh");
    if (p.logo) {
      logo.src = p.logo;
      logo.classList.remove("hidden");
      ph.classList.add("hidden");
    } else {
      ph.textContent = (p.company_name && p.company_name.slice(0, 2).toUpperCase()) || "CO";
    }
    const posts = p.posts || [];
    $("#companyPostsDetail").innerHTML = posts.length
      ? posts
          .map(
            (x) =>
              `<li><strong>${x.title}</strong> — ${x.type} — ${x.payment_status} — ${
                x.is_published ? "Published" : "Draft"
              }</li>`
          )
          .join("")
      : "<li>No posts yet.</li>";
  } catch (e) {
    $("#companyName").textContent = "Could not load profile";
    $("#companyDesc").textContent = e.message;
  }
})();
