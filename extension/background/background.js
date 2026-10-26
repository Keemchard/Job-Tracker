const AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts";
const TOKEN_URL = "https://securetoken.googleapis.com/v1/token";
const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects";

async function getConfig() {
  const result = await chrome.storage.local.get(["apiKey", "projectId"]);
  if (!result.apiKey || !result.projectId) {
    throw new Error("NOT_CONFIGURED");
  }
  return result;
}

async function getAuth() {
  const result = await chrome.storage.local.get([
    "idToken",
    "refreshToken",
    "userId",
    "email",
    "tokenExpiry",
  ]);
  if (!result.idToken || !result.refreshToken) {
    throw new Error("NOT_AUTHENTICATED");
  }
  if (Date.now() > (result.tokenExpiry || 0)) {
    return refreshAuthToken(result.refreshToken);
  }
  return result;
}

async function signIn(email, password) {
  const { apiKey } = await getConfig();
  const res = await fetch(
    `${AUTH_URL}:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const authData = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    userId: data.localId,
    email: data.email,
    displayName: data.displayName || email.split("@")[0],
    tokenExpiry: Date.now() + parseInt(data.expiresIn) * 1000 - 60000,
  };
  await chrome.storage.local.set(authData);
  return authData;
}

async function refreshAuthToken(refreshToken) {
  const { apiKey } = await getConfig();
  const res = await fetch(`${TOKEN_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (data.error) {
    await chrome.storage.local.remove([
      "idToken",
      "refreshToken",
      "userId",
      "email",
      "tokenExpiry",
    ]);
    throw new Error("NOT_AUTHENTICATED");
  }

  const authData = {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    tokenExpiry: Date.now() + parseInt(data.expires_in) * 1000 - 60000,
  };
  await chrome.storage.local.set(authData);

  const stored = await chrome.storage.local.get(["userId", "email"]);
  return { ...stored, ...authData };
}

function toFirestoreValue(val) {
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") return { integerValue: String(val) };
  if (typeof val === "boolean") return { booleanValue: val };
  return { stringValue: String(val) };
}

async function saveApplication(jobData) {
  const { projectId } = await getConfig();
  const auth = await getAuth();
  const now = new Date().toISOString();

  const fields = {
    company: toFirestoreValue(jobData.company.trim().slice(0, 200)),
    position: toFirestoreValue(jobData.position.trim().slice(0, 200)),
    location: toFirestoreValue((jobData.location || "").trim().slice(0, 200)),
    workMode: toFirestoreValue(jobData.workMode || "onsite"),
    status: toFirestoreValue("applied"),
    dateApplied: toFirestoreValue(now.split("T")[0]),
    userId: toFirestoreValue(auth.userId),
    createdAt: toFirestoreValue(now),
    updatedAt: toFirestoreValue(now),
  };

  if (jobData.salary) {
    fields.salary = toFirestoreValue(jobData.salary.trim().slice(0, 100));
  }
  if (jobData.jobUrl) {
    fields.jobUrl = toFirestoreValue(jobData.jobUrl.trim().slice(0, 500));
  }
  if (jobData.notes) {
    fields.notes = toFirestoreValue(jobData.notes.trim().slice(0, 2000));
  }

  const url = `${FIRESTORE_URL}/${projectId}/databases/(default)/documents/applications`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Firestore error: ${res.status}`);
  }

  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "signIn") {
    signIn(message.email, message.password)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === "signOut") {
    chrome.storage.local
      .remove([
        "idToken",
        "refreshToken",
        "userId",
        "email",
        "displayName",
        "tokenExpiry",
      ])
      .then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === "getAuth") {
    getAuth()
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === "saveApplication") {
    saveApplication(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
