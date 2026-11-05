const DASHBOARD_URLS = ["http://localhost:3000/*", "http://localhost:3001/*"];

// Read the JWT straight from an open dashboard tab's localStorage. This works
// even when the sync content script isn't running in that tab (e.g. the tab
// was already open when the extension was installed or reloaded).
async function readTokenFromDashboardTab() {
  try {
    const tabs = await chrome.tabs.query({ url: DASHBOARD_URLS });
    for (const tab of tabs) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => localStorage.getItem("jwtToken"),
        });
        if (result?.result) return result.result;
      } catch (e) {
        console.warn("Couldn't read token from tab", tab.url, e);
      }
    }
  } catch (e) {
    console.warn("Couldn't look for dashboard tabs", e);
  }
  return null;
}

// Get the JWT: an open dashboard tab is the freshest source (it reflects the
// latest login/logout); fall back to the copy saved in extension storage.
async function getOrFetchToken() {
  const fromTab = await readTokenFromDashboardTab();
  if (fromTab) {
    await chrome.storage.local.set({ jwtToken: fromTab });
    return fromTab;
  }
  const { jwtToken } = await chrome.storage.local.get(["jwtToken"]);
  if (jwtToken) return jwtToken;
  throw new Error("Please log in at the dashboard first!");
}

// Helper function to show status messages
function showStatus(message, type = "info") {
  const statusMsg = document.getElementById("status-msg");
  statusMsg.textContent = message;
  statusMsg.className = `status ${type}`;
}

// Handle Pill Selection
let selectedReason = "Read Later";
document.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", (e) => {
    document
      .querySelectorAll(".pill")
      .forEach((p) => p.classList.remove("active"));
    e.target.classList.add("active");
    selectedReason = e.target.getAttribute("data-reason");
  });
});

// Handle Save Button Click
document.getElementById("save-btn").addEventListener("click", async () => {
  const btn = document.getElementById("save-btn");
  const btnText = document.getElementById("btn-text");
  const btnIcon = document.getElementById("btn-icon");
  const statusMsg = document.getElementById("status-msg");

  const userNote = document.getElementById("user-note").value.trim();

  btn.classList.add("loading");
  btnIcon.style.display = "none";
  statusMsg.className = "status hidden";

  try {
    // Get JWT token - if not found, user needs to log in on dashboard
    const jwtToken = await getOrFetchToken();
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    let response;

    // Google Drive file pages look like drive.google.com/file/d/<id>/view
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    const pathname = new URL(url).pathname.toLowerCase();
    const looksLikePdf =
      pathname.endsWith(".pdf") || pathname.includes("/pdf/");

    if (driveMatch || looksLikePdf) {
      // PDF Payload
      btnText.innerText = "Downloading PDF...";

      // Drive's viewer page is HTML; ask Drive for the file itself instead.
      const pdfUrlToFetch = driveMatch
        ? `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`
        : url;

      // credentials: "include" sends your Google cookies so private Drive files work
      const pdfResponse = await fetch(pdfUrlToFetch, { credentials: "include" });
      if (!pdfResponse.ok) throw new Error("Could not download PDF from tab.");
      const pdfBlob = await pdfResponse.blob();

      // Make sure we actually got a PDF (Drive returns an HTML page for
      // non-PDF files, files you can't access, or its virus-scan warning).
      const header = await pdfBlob.slice(0, 5).text();
      if (header !== "%PDF-") {
        throw new Error(
          driveMatch
            ? "Drive didn't return a PDF. Only PDF files you can access are supported (very large files need to be downloaded manually)."
            : "This page didn't return a PDF file.",
        );
      }

      // Use a real name for the item title instead of "document.pdf"
      let fileName = driveMatch
        ? (tab.title || "").replace(/\s+-\s+Google Drive$/, "")
        : decodeURIComponent(pathname.split("/").pop() || "");
      fileName = fileName.trim() || "document";
      if (!fileName.toLowerCase().endsWith(".pdf")) fileName += ".pdf";

      const formData = new FormData();
      console.log(`Fetched PDF: ${fileName} (${pdfBlob.size} bytes)`);
      formData.append(
        "file",
        new Blob([pdfBlob], { type: "application/pdf" }),
        fileName,
      );

      formData.append("saveReason", selectedReason);
      formData.append("userNote", userNote);
      formData.append("url", url);

      btnText.innerText = "Sending to AI Brain...";
      response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });
    } else {
      // Standard Payload
      btnText.innerText = "Analyzing Page...";
      response = await fetch("http://localhost:3000/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ url, saveReason: selectedReason, userNote }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        // Token expired or invalid: forget it so the user is told to log in again
        chrome.storage.local.remove("jwtToken");
        throw new Error("Please log in at the dashboard first!");
      }
      throw new Error(errorData.error || "Server rejected the request");
    }

    btn.classList.remove("loading");
    btn.classList.add("success");
    btnText.innerText = "Saved to Brain!";
    showStatus("✅ Successfully saved!", "success");
    setTimeout(() => window.close(), 2000);
  } catch (error) {
    console.error(error);
    btn.classList.remove("loading");
    btnText.innerText = "Try Again";
    btnIcon.style.display = "block";

    if (error.message.includes("Please log in")) {
      showStatus(
        "❌ Not logged in! Open the dashboard and log in first.",
        "error",
      );
    } else {
      showStatus(`❌ Error: ${error.message}`, "error");
    }
  }
});

// On page load, check if user is authenticated
document.addEventListener("DOMContentLoaded", () => {
  // Check if JWT exists
  getOrFetchToken().catch(() => {
    const btn = document.getElementById("save-btn");
    btn.disabled = true;
    btn.style.opacity = "0.5";
    showStatus(
      "⚠️ Not logged in. Open the dashboard (localhost:3000) and log in, then reopen this popup.",
      "warning",
    );
  });
});
