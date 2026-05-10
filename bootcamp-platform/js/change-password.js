(function () {
  const $ = (s) => document.querySelector(s);

  if (!window.ZB || !ZB.requireAuthRedirect()) {
    // redirect handled by ZB
  }

  $("#pwForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#pwMsg");
    msg.textContent = "";
    const old_password = $("#oldPw").value;
    const new_password = $("#newPw").value;
    const confirm_password = $("#newPw2").value;
    if (new_password !== confirm_password) {
      msg.style.color = "#db4437";
      msg.textContent = "New passwords do not match.";
      return;
    }
    try {
      await ZB.ensureCsrf();
      await ZB.apiRequest("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password, new_password, confirm_password })
      });
      msg.style.color = "#0f9d58";
      msg.textContent = "Password updated. Please sign in again.";
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
      setTimeout(() => {
        window.location.href = "auth.html";
      }, 900);
    } catch (err) {
      msg.style.color = "#db4437";
      msg.textContent = err.message;
    }
  });
})();
