// popup.js
document.getElementById("save-btn").addEventListener("click", async () => {
  const btn = document.getElementById("save-btn");
  const btnText = document.getElementById("btn-text");
  const btnIcon = document.getElementById("btn-icon");
  const statusMsg = document.getElementById("status-msg");

  // Enter Loading State
  btn.classList.add("loading");
  btnIcon.style.display = "none";
  statusMsg.className = "status hidden";

  try {
    // Get the current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    let response;

    // THE MAGIC: Check if the user is looking at a PDF
    if (url.toLowerCase().endsWith(".pdf") || url.includes("/pdf/")) {
      btnText.innerText = "Bypassing firewall...";
      statusMsg.innerText = "Downloading PDF directly from browser...";
      statusMsg.className = "status";
      statusMsg.style.display = "block";

      // 1. Fetch the PDF *inside* the extension.
      // This bypasses Cloudflare because it uses the browser's trusted network stack!
      const pdfFetchParams = { method: "GET" };
      const pdfResponse = await fetch(url, pdfFetchParams);

      if (!pdfResponse.ok) throw new Error("Could not download PDF from tab.");

      // 2. Convert the download into a raw file object (Blob)
      const pdfBlob = await pdfResponse.blob();

      // 3. Package it up exactly like an HTML form upload
      const formData = new FormData();
      // We'll try to extract a name from the URL, or default to document.pdf
      const fileName = url.split("/").pop().split("?")[0] || "document.pdf";
      formData.append("file", pdfBlob, fileName);
      formData.append("url", url);

      btnText.innerText = "Sending to AI Brain...";

      // 4. Send the physical file to your new local Upload API
      response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData, // Notice we don't set Content-Type; the browser handles the boundary automatically
      });
    } else {
      // NORMAL BEHAVIOR: For YouTube and Articles, just send the URL to the backend
      btnText.innerText = "Analyzing Page...";

      response = await fetch("http://localhost:3000/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url }),
      });
    }

    if (!response.ok) throw new Error("Server rejected the request");

    // Enter Success State
    btn.classList.remove("loading");
    btn.classList.add("success");
    btnText.innerText = "Saved to Brain!";

    statusMsg.innerText = "Summarized, tagged, and vectorized.";
    statusMsg.className = "status success-text";

    // Close the popup after a moment
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error(error);

    // Enter Error State
    btn.classList.remove("loading");
    btnText.innerText = "Try Again";
    btnIcon.style.display = "block";

    statusMsg.innerText = "Failed to save. Is your backend running?";
    statusMsg.className = "status error-text";
  }
});
