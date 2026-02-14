const APP_VERSION = "a-2.2.9";

let swRegistration = null;

/* ------------------------------
   External links open in new tab
--------------------------------*/
document.addEventListener("click", function (e) {
    const link = e.target.closest("a");
    if (!link) return;

    if (link.hostname !== window.location.hostname) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }
});

/* ------------------------------
   DOM Ready
--------------------------------*/
document.addEventListener("DOMContentLoaded", function () {

    const versionSpan = document.getElementById("app-version");
    if (versionSpan) {
        versionSpan.textContent = APP_VERSION;
    }

    const isApp =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    if (isApp) {
        const appNote = document.getElementById("app-note");
        if (appNote) {
            appNote.style.display = "block";
        }
    }
});

/* ------------------------------
   Service Worker Registration
--------------------------------*/
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {

        try {
            swRegistration = await navigator.serviceWorker.register('./service-worker.js');

            // If there's already a waiting update
            if (swRegistration.waiting) {
                showUpdatePopup();
            }

            // Detect new updates
            swRegistration.addEventListener('updatefound', () => {

                const newWorker = swRegistration.installing;

                newWorker.addEventListener('statechange', () => {

                    if (
                        newWorker.state === 'installed' &&
                        navigator.serviceWorker.controller
                    ) {
                        showUpdatePopup();
                    }

                });
            });

        } catch (error) {
            console.log('SW failed:', error);
        }

    });
}

/* ------------------------------
   Update Popup
--------------------------------*/
function showUpdatePopup() {

    // Prevent multiple popups
    if (document.getElementById("update-popup")) return;

    const popup = document.createElement("div");
    popup.id = "update-popup";

    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.background = "#1f1f2e";
    popup.style.color = "white";
    popup.style.padding = "15px 25px";
    popup.style.borderRadius = "12px";
    popup.style.boxShadow = "0 0 15px rgba(0,0,0,0.5)";
    popup.style.zIndex = "9999";

    popup.innerHTML = `
        🚀 New Version Available!
        <br><br>
        <button id="refresh-app">Update Now</button>
    `;

    document.body.appendChild(popup);

    document.getElementById("refresh-app").addEventListener("click", () => {

        if (swRegistration && swRegistration.waiting) {
            swRegistration.waiting.postMessage("SKIP_WAITING");
        }

    });
}

/* ------------------------------
   Reload When New SW Takes Control
--------------------------------*/
navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
});
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show your install button
    const installBtn = document.getElementById("install-app");
    if (installBtn) {
        installBtn.style.display = "block";
    }
});
const installBtn = document.getElementById("install-app");

if (installBtn) {
    installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;

        if (result.outcome === "accepted") {
            console.log("User installed the app");
        }

        deferredPrompt = null;
    });
}

async function fetchStatus() {
  try {
    const response = await fetch(
      "/status.json?" + Date.now(),
      { cache: "no-store" }
    );

    const data = await response.json();
    updateDashboard(data);

  } catch (error) {
    console.error("Failed to fetch status:", error);
  }
}



function updateDashboard(statuses) {
  // Loop through each status card and update it based on the fetched data
  document.querySelectorAll(".status-card").forEach(card => {
    const title = card.querySelector("h2").innerText;

    // Check if the title matches the key in the JSON object
    if (statuses[title]) {
      card.setAttribute("data-status", statuses[title]);
      card.querySelector(".status-text").innerText =
        statuses[title].charAt(0).toUpperCase() + statuses[title].slice(1);

      // Set the status indicator color based on status
      const statusIndicator = card.querySelector(".status-indicator");

      if (statuses[title] === "operational") {
        statusIndicator.style.background = "#00ff66"; // Green
      } else if (statuses[title] === "warning") {
        statusIndicator.style.background = "#ffaa00"; // Yellow
      } else if (statuses[title] === "critical") {
        statusIndicator.style.background = "#ff0033"; // Red
      }
    }
  });

// Update the timestamp
const now = new Date();
const lastUpdated = document.getElementById("last-updated");

if (lastUpdated) {
  lastUpdated.innerText =
    "Last Updated: " + now.toLocaleTimeString();
}


// Run the initial fetch
fetchStatus();

// Auto-refresh every 30 seconds
setInterval(fetchStatus, 30000);
