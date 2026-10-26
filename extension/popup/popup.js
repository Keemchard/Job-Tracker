const views = {
  setup: document.getElementById("view-setup"),
  login: document.getElementById("view-login"),
  connected: document.getElementById("view-connected"),
};

function showView(name) {
  Object.values(views).forEach((v) => (v.style.display = "none"));
  views[name].style.display = "block";
}

async function init() {
  const config = await chrome.storage.local.get(["apiKey", "projectId"]);
  if (!config.apiKey || !config.projectId) {
    showView("setup");
    return;
  }

  chrome.runtime.sendMessage({ action: "getAuth" }, (response) => {
    if (response?.success) {
      showConnected(response.data);
    } else {
      showView("login");
    }
  });
}

function showConnected(data) {
  const name = data.displayName || data.email?.split("@")[0] || "User";
  document.getElementById("user-name").textContent = name;
  document.getElementById("user-email").textContent = data.email || "";
  document.getElementById("user-avatar").textContent = name.charAt(0).toUpperCase();
  showView("connected");
}

// Save config
document.getElementById("btn-save-config").addEventListener("click", async () => {
  const apiKey = document.getElementById("setup-apikey").value.trim();
  const projectId = document.getElementById("setup-projectid").value.trim();

  if (!apiKey || !projectId) return;

  await chrome.storage.local.set({ apiKey, projectId });
  showView("login");
});

// Login
document.getElementById("btn-login").addEventListener("click", async () => {
  const btn = document.getElementById("btn-login");
  const errorEl = document.getElementById("login-error");
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) return;

  btn.disabled = true;
  btn.textContent = "Signing in...";
  errorEl.style.display = "none";

  chrome.runtime.sendMessage(
    { action: "signIn", email, password },
    (response) => {
      btn.disabled = false;
      btn.textContent = "Sign In";

      if (response?.success) {
        showConnected(response.data);
      } else {
        const msg = response?.error || "Sign in failed";
        let friendly = "Something went wrong. Please try again.";

        if (msg.includes("INVALID_LOGIN_CREDENTIALS") || msg.includes("INVALID_EMAIL")) {
          friendly = "Invalid email or password.";
        } else if (msg.includes("USER_DISABLED")) {
          friendly = "This account has been disabled.";
        } else if (msg.includes("TOO_MANY_ATTEMPTS")) {
          friendly = "Too many attempts. Try again later.";
        }

        errorEl.textContent = friendly;
        errorEl.style.display = "block";
      }
    }
  );
});

// Enter key to submit login
document.getElementById("login-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-login").click();
});

// Logout
document.getElementById("btn-logout").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "signOut" }, () => {
    showView("login");
  });
});

// Show setup from login
document.getElementById("btn-show-setup").addEventListener("click", () => {
  chrome.storage.local.get(["apiKey", "projectId"], (data) => {
    document.getElementById("setup-apikey").value = data.apiKey || "";
    document.getElementById("setup-projectid").value = data.projectId || "";
    showView("setup");
  });
});

// Edit config from connected
document.getElementById("btn-edit-config").addEventListener("click", () => {
  chrome.storage.local.get(["apiKey", "projectId"], (data) => {
    document.getElementById("setup-apikey").value = data.apiKey || "";
    document.getElementById("setup-projectid").value = data.projectId || "";
    showView("setup");
  });
});

init();
