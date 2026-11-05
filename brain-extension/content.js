// Content script - runs on the dashboard (http://localhost:3000/*, or :3001 in dev)
// Keeps the extension's copy of the JWT in sync with the dashboard's localStorage.

let lastSynced; // undefined until the first check, so the first check always syncs

function syncToken() {
  const token = localStorage.getItem("jwtToken");
  if (token === lastSynced) return;
  lastSynced = token;

  if (token) {
    chrome.runtime.sendMessage({ type: "SYNC_JWT_TOKEN", token }, (response) => {
      console.log("JWT synced to extension:", response);
    });
  } else {
    chrome.runtime.sendMessage({ type: "CLEAR_JWT_TOKEN" }, (response) => {
      console.log("JWT cleared from extension:", response);
    });
  }
}

// On page load
syncToken();

// Login/logout in another tab fires a "storage" event...
window.addEventListener("storage", (event) => {
  if (event.key === "jwtToken") syncToken();
});

// ...but login/logout in THIS tab doesn't (the dashboard navigates client-side,
// so there's no page load either). A cheap periodic check covers that case.
setInterval(syncToken, 1500);

// Also answer direct requests for the token from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REQUEST_JWT_TOKEN") {
    const token = localStorage.getItem("jwtToken");
    sendResponse({ token: token || null });
  }
});
