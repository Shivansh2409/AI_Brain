// Background script to sync JWT token from frontend to extension storage

// Listen for messages from frontend (dashboard)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_JWT_TOKEN") {
    // Save JWT token from frontend to extension storage
    chrome.storage.local.set({ jwtToken: message.token }, () => {
      sendResponse({ success: true, message: "JWT token synced" });
    });
    return true; // Keep handler alive for async response
  }

  if (message.type === "GET_JWT_TOKEN") {
    // Get JWT token for extension usage
    chrome.storage.local.get(["jwtToken"], (result) => {
      sendResponse({ token: result.jwtToken || null });
    });
    return true;
  }

  if (message.type === "CLEAR_JWT_TOKEN") {
    // Clear JWT token on logout
    chrome.storage.local.remove("jwtToken", () => {
      sendResponse({ success: true, message: "JWT token cleared" });
    });
    return true;
  }
});

// Listen for storage changes in the extension
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.jwtToken) {
    console.log(
      "JWT token updated:",
      changes.jwtToken.newValue ? "Token present" : "Token cleared",
    );
  }
});
