// 1. Handle Pill Selection
let selectedReason = "Read Later";
document.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", (e) => {
    // Remove active class from all pills
    document
      .querySelectorAll(".pill")
      .forEach((p) => p.classList.remove("active"));
    // Add active class to clicked pill
    e.target.classList.add("active");
    selectedReason = e.target.getAttribute("data-reason");
  });
});

document.getElementById("save-btn").addEventListener("click", async () => {
  const btn = document.getElementById("save-btn");
  const btnText = document.getElementById("btn-text");
  const btnIcon = document.getElementById("btn-icon");
  const statusMsg = document.getElementById("status-msg");

  // 2. Grab the custom note
  const userNote = document.getElementById("user-note").value.trim();

  btn.classList.add("loading");
  btnIcon.style.display = "none";
  statusMsg.className = "status hidden";

  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    let response;

    if (url.toLowerCase().endsWith(".pdf") || url.includes("/pdf/")) {
      // PDF Payload
      btnText.innerText = "Bypassing firewall...";
      const pdfResponse = await fetch(url, { method: "GET" });
      if (!pdfResponse.ok) throw new Error("Could not download PDF");

      const pdfBlob = await pdfResponse.blob();
      const formData = new FormData();
      formData.append("file", pdfBlob, "document.pdf");

      // Append our new data to the form
      formData.append("saveReason", selectedReason);
      formData.append("userNote", userNote);
      formData.append("url", url);

      btnText.innerText = "Sending to AI Brain...";
      response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });
    } else {
      // Standard Payload
      btnText.innerText = "Analyzing Page...";
      response = await fetch("http://localhost:3000/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Add the new fields here!
        body: JSON.stringify({ url, saveReason: selectedReason, userNote }),
      });
    }

    if (!response.ok) throw new Error("Server rejected the request");

    btn.classList.remove("loading");
    btn.classList.add("success");
    btnText.innerText = "Saved to Brain!";
    setTimeout(() => window.close(), 2000);
  } catch (error) {
    console.error(error);
    btn.classList.remove("loading");
    btnText.innerText = "Try Again";
    btnIcon.style.display = "block";
  }
});
