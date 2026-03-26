document.getElementById("save-btn").addEventListener("click", async () => {
  const btn = document.getElementById("save-btn");
  const btnText = document.getElementById("btn-text");
  const btnIcon = document.getElementById("btn-icon");
  const statusMsg = document.getElementById("status-msg");

  // 1. Enter Loading State
  btn.classList.add("loading");
  btnText.innerText = "Analyzing Page...";
  btnIcon.style.display = "none"; // Hide the save icon while loading
  statusMsg.className = "status hidden";

  try {
    // Get the current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send the URL to your backend (Make sure this matches your actual endpoint!)
    const response = await fetch("http://localhost:3000/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tab.url }),
    });

    if (!response.ok) throw new Error("Server rejected the request");

    // 2. Enter Success State
    btn.classList.remove("loading");
    btn.classList.add("success");
    btnText.innerText = "Saved to Brain!";

    statusMsg.innerText = "Summarized, tagged, and vectorized.";
    statusMsg.className = "status success-text";

    // Automatically close the popup after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error(error);

    // 3. Enter Error State
    btn.classList.remove("loading");
    btnText.innerText = "Try Again";
    btnIcon.style.display = "block"; // Bring icon back

    statusMsg.innerText = "Failed to save. Is your backend running?";
    statusMsg.className = "status error-text";
  }
});
