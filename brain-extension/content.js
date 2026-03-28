// Content script - runs on http://localhost:3001/*
// This script monitors localStorage for JWT changes and syncs them to the extension

// Initial check for JWT on page load
window.addEventListener("load", () => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    chrome.runtime.sendMessage(
      { type: "SYNC_JWT_TOKEN", token },
      (response) => {
        console.log("JWT synced to extension:", response);
      },
    );
  }
});

// Monitor localStorage changes
window.addEventListener("storage", (event) => {
  if (event.key === "jwtToken") {
    if (event.newValue) {
      // Token was added or updated
      chrome.runtime.sendMessage(
        { type: "SYNC_JWT_TOKEN", token: event.newValue },
        (response) => {
          console.log("JWT updated in extension:", response);
        },
      );
    } else {
      // Token was removed (logout)
      chrome.runtime.sendMessage({ type: "CLEAR_JWT_TOKEN" }, (response) => {
        console.log("JWT cleared from extension:", response);
      });
    }
  }
});

// Also listen for messages from the extension requesting the token
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REQUEST_JWT_TOKEN") {
    const token = localStorage.getItem("jwtToken");
    sendResponse({ token: token || null });
  }
});
