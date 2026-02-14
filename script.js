const APP_VERSION = "a-2.3.5";
let swRegistration = null;
let deferredPrompt = null;

/* ------------------------------
   External links open in new tab
--------------------------------*/
document.addEventListener("click", (e) => {
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
document.addEventListener("DOMContentLoaded", () => {

    // Set version
    const versionSpan = document.getElementById("app-version");
    if (versionSpan) versionSpan.textContent = APP_VERSION;

    // Detect standalone mode
    const isApp =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    if (isApp) {
        const appNote = document.getElementById("app-note");
        if (appNote) appNote.style.display = "block";
    }

    // Install button setup
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
            installBtn.style.display = "none";
        });
    }

    // Fetch status immediately
    fetchStatus();

    // Auto refresh every 30 seconds (optional)
    setInterval(fetchStatus, 30000);
});

/* ------------------------------
   Before Install Prompt
--------------------------------*/
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById("install-app");
    if (installBtn) installBtn.style.display = "block";
});

/* ------------------------------
   Service Worker Registration
--------------------------------*/
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            swRegistration = await navigator.serviceWorker.register("./service-worker.js");

            if (swRegistration.waiting) {
                showUpdatePopup();
            }

            swRegistration.addEventListener("updatefound", () => {
                const newWorker = swRegistration.installing;

                newWorker.addEventListener("statechange", () => {
                    if (
                        newWorker.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        showUpdatePopup();
                    }
                });
            });

        } catch (error) {
            console.log("SW failed:", error);
        }
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
    });
}

/* ------------------------------
   Update Popup
--------------------------------*/
function showUpdatePopup() {
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
        if (swRegistration?.waiting) {
            swRegistration.waiting.postMessage("SKIP_WAITING");
        }
    });
}

/* ------------------------------
   Fetch Status
--------------------------------*/
async function fetchStatus() {
    try {
        const response = await fetch("/status.json?" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Status file not found");

        const data = await response.json();
        updateDashboard(data);

    } catch (error) {
        console.error("Failed to fetch status:", error);
    }
}

/* ------------------------------
   Update Dashboard
--------------------------------*/
function updateDashboard(statuses) {
    document.querySelectorAll(".status-card").forEach(card => {

        const key = card.getAttribute("data-key");
        if (!key || !statuses[key]) return;

        const status = statuses[key].toLowerCase().trim();

        // Update text
        const statusText = card.querySelector(".status-text");
        if (statusText) {
            statusText.innerText =
                status.charAt(0).toUpperCase() + status.slice(1);
        }

        // Update indicator
        const indicator = card.querySelector(".status-indicator");
        if (indicator) {
            indicator.style.width = "14px";
            indicator.style.height = "14px";
            indicator.style.borderRadius = "50%";
            indicator.style.margin = "10px auto";

            if (status === "operational") {
                indicator.style.background = "#00ff66";
            } else if (status === "warning") {
                indicator.style.background = "#ffaa00";
            } else if (status === "critical") {
                indicator.style.background = "#ff0033";
            }
        }
    });

    const lastUpdated = document.getElementById("last-updated");
    if (lastUpdated) {
        lastUpdated.innerText =
            "Last Updated: " + new Date().toLocaleTimeString();
    }
}

