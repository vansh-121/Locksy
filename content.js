if (!document.getElementById("lockOverlay")) {
    const overlay = document.createElement("div");
    overlay.id = "lockOverlay";
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex;
      align-items: center; justify-content: center; color: white;
    `;
    overlay.innerHTML = `
      <div>
        <p>Enter Password to Unlock:</p>
        <input type="password" id="unlockPassword"/>
        <button id="unlockBtn">Unlock</button>
      </div>
    `;
  
    document.body.appendChild(overlay);
  
    document.getElementById("unlockBtn").onclick = () => {
      const password = document.getElementById("unlockPassword").value;
      if (password === "your_password") {  // Replace with your password logic
        overlay.remove();
      } else {
        alert("Incorrect Password!");
      }
    };
  }
  