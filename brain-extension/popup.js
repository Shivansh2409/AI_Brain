document.getElementById("save-btn").addEventListener("click", async () => {
  const statusText = document.getElementById("status-text");
  const btn = document.getElementById("save-btn");

  btn.disabled = true;
  statusText.innerText = "Saving...";

  try {
    // 1. Get the current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const currentUrl = tab.url;

    // 2. Send the URL to our backend
    const response = await fetch("http://localhost:3000/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: currentUrl }),
    });

    if (response.ok) {
      statusText.innerText = "✅ Saved to Brain!";
      btn.style.display = "none"; // Hide button on success
    } else {
      console.log(response);
      statusText.innerText = "❌ Failed to save.";
      btn.disabled = false;
    }
  } catch (error) {
    statusText.innerText = "❌ Server offline.";
    btn.disabled = false;
  }
});
