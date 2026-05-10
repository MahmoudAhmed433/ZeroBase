(function () {
  const $ = (s) => document.querySelector(s);

  async function init() {
    if (!window.ZB || !ZB.requireAuthRedirect()) return;
    const u = ZB.getAuthUser();
    if (!u) return;

    if (u.role === "company") {
      $("#tabCompanyPosts").classList.remove("hidden");
      $("#companyFields").classList.remove("hidden");
      $("#studentFields").classList.add("hidden");
    } else {
      $("#studentFields").classList.remove("hidden");
      $("#companyFields").classList.add("hidden");
    }

    await ZB.ensureCsrf();
    const p = await ZB.apiRequest("/profile/");

    if (u.role === "student") {
      $("#sfFull").value = p.full_name || "";
      $("#sfUser").value = p.username || "";
      $("#sfBio").value = p.bio || "";
      $("#sfPic").value = p.profile_picture || "";
      $("#sfUni").value = p.university || "";
      $("#sfMajor").value = p.major || "";
      $("#sfSkills").value = (p.skills || []).join(", ");
    } else {
      $("#cfName").value = p.company_name || "";
      $("#cfLogo").value = p.logo || "";
      $("#cfWeb").value = p.website || "";
      $("#cfInd").value = p.industry || "";
      $("#cfSize").value = p.size || "11-50";
      $("#cfDesc").value = p.description || "";
      const posts = p.posts || [];
      $("#settingsPostList").innerHTML = posts.length
        ? posts
            .map(
              (x) =>
                `<li><strong>${x.title}</strong> — ${x.type} — ${x.payment_status} — ${
                  x.is_published ? "Published" : "Draft"
                }</li>`
            )
            .join("")
        : "<li>No posts yet.</li>";
    }

    $$tabs();
  }

  function $$(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  function $$tabs() {
    const panels = {
      profile: $("#panelProfile"),
      security: $("#panelSecurity"),
      posts: $("#panelPosts")
    };
    $$(".settings-tabs button[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        $$(".settings-tabs button").forEach((b) => b.classList.toggle("active", b === btn));
        Object.keys(panels).forEach((k) => {
          if (panels[k]) panels[k].classList.toggle("hidden", k !== tab);
        });
      });
    });
  }

  $("#btnSaveProfile")?.addEventListener("click", async () => {
    const msg = $("#profileSaveMsg");
    msg.textContent = "";
    const u = ZB.getAuthUser();
    try {
      await ZB.ensureCsrf();
      let body;
      if (u.role === "student") {
        const skills = ($("#sfSkills").value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        body = {
          full_name: $("#sfFull").value.trim(),
          username: $("#sfUser").value.trim(),
          bio: $("#sfBio").value.trim(),
          profile_picture: $("#sfPic").value.trim(),
          university: $("#sfUni").value.trim(),
          major: $("#sfMajor").value.trim(),
          skills
        };
      } else {
        body = {
          company_name: $("#cfName").value.trim(),
          logo: $("#cfLogo").value.trim(),
          website: $("#cfWeb").value.trim(),
          industry: $("#cfInd").value,
          size: $("#cfSize").value,
          description: $("#cfDesc").value.trim()
        };
      }
      await ZB.apiRequest("/profile/", { method: "PATCH", body: JSON.stringify(body) });
      msg.textContent = "Saved successfully.";
      msg.style.color = "#0f9d58";
    } catch (e) {
      msg.textContent = e.message;
      msg.style.color = "#db4437";
    }
  });

  $("#btnDeleteAccount")?.addEventListener("click", async () => {
    const msg = $("#deleteMsg");
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    try {
      await ZB.ensureCsrf();
      await ZB.apiRequest("/account/", { method: "DELETE", body: JSON.stringify({}) });
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
      window.location.href = "auth.html";
    } catch (e) {
      msg.textContent = e.message;
    }
  });

  void init();
})();
