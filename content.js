if (!document.getElementById("lockOverlay")) {
  const overlay = document.createElement("div");
  overlay.id = "lockOverlay";
  overlay.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7); z-index: 10000; display: flex;
    align-items: center; justify-content: center; color: white;
    font-family: Arial, sans-serif;
    backdrop-filter: blur(8px);  /* Adds the background blur effect */
  `;

  overlay.innerHTML = `
    <div style="
        background: #333;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
        text-align: center;
        max-width: 320px;
        width: 100%;
    ">
      <p style="
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
      ">🔒 Enter Password to Unlock</p>
      <input type="password" id="unlockPassword" placeholder="Password" style="
          width: 100%;
          padding: 12px;
          border: 1px solid #777;
          border-radius: 6px;
          font-size: 16px;
          outline: none;
          color: #ddd;
          background: #555;
          text-align: center;
          margin-bottom: 15px;
      "/>
      <button id="unlockBtn" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px;
          font-size: 16px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          transition: background 0.3s;
      ">Unlock</button>
    </div>
  `;

  const unlockBtn = overlay.querySelector("#unlockBtn");
  unlockBtn.addEventListener("mouseenter", () => unlockBtn.style.background = "#45a049");
  unlockBtn.addEventListener("mouseleave", () => unlockBtn.style.background = "#4CAF50");

  document.body.appendChild(overlay);

  unlockBtn.onclick = () => {
    const enteredPassword = document.getElementById("unlockPassword").value;

    chrome.storage.local.get("lockPassword", (data) => {
      if (data && data.lockPassword === enteredPassword) {
        overlay.remove();
      } else {
        alert("Incorrect Password!");
      }
    });
  };
}
