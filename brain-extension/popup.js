// Get JWT from extension storage
async function getOrFetchToken() {
  return new Promise((resolve, reject) => {
    // Get JWT from extension local storage
    chrome.storage.local.get(["jwtToken"], (result) => {
      if (result.jwtToken) {
        resolve(result.jwtToken);
      } else {
        reject("Please log in at the dashboard first!");
      }
    });
  });
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

    if (url.toLowerCase().endsWith(".pdf") || url.includes("/pdf/")) {
      // PDF Payload
      btnText.innerText = "Bypassing firewall...";
      let pdfUrlToFetch = url;
      if (url.includes("drive.google.com/file/d/")) {
        // Extract the File ID
        const match = url.match(/\/d\/(.*?)\//);
        if (match && match[1]) {
          const fileId = match[1];
          // Convert to direct download link
          pdfUrlToFetch = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }
      const pdfFetchParams = { method: "GET" };
      const pdfResponse = await fetch(url, pdfFetchParams);

      console.log(pdfResponse.ok);
      if (!pdfResponse.ok) throw new Error("Could not download PDF from tab.");
      const pdfBlob = await pdfResponse.blob();
      const formData = new FormData();

      const fileName = "document.pdf";
      console.log(`Fetched PDF: ${fileName} (${pdfBlob.size} bytes)`);
      formData.append("file", pdfBlob, fileName);

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
      const errorData = await response.json();
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
  chrome.storage.local.get(["jwtToken"], (result) => {
    if (!result.jwtToken) {
      const btn = document.getElementById("save-btn");
      btn.disabled = true;
      btn.style.opacity = "0.5";
      showStatus("⚠️ You must log in on the dashboard first!", "warning");
    }
  });
});
