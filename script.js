/* ==============================
   CONFIG
============================== */

const APP_VERSION = "b-2.5.1";
let swRegistration = null;
let deferredPrompt = null;


/* ==============================
   OPEN EXTERNAL LINKS IN NEW TAB
============================== */

document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    if (link.hostname !== window.location.hostname) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }
});


/* ==============================
   DOM READY
============================== */

document.addEventListener("DOMContentLoaded", () => {

    // Show version
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

    // Install button
    const installBtn = document.getElementById("install-app");
    if (installBtn) {
        installBtn.addEventListener("click", async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            await deferredPrompt.userChoice;

            deferredPrompt = null;
            installBtn.style.display = "none";
        });
    }

    // Fetch status immediately
    fetchStatus();

    // Auto refresh status every 30 sec
    setInterval(fetchStatus, 30000);
});


/* ==============================
   BEFORE INSTALL PROMPT
============================== */

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById("install-app");
    if (installBtn) installBtn.style.display = "block";
});


/* ==============================
   SERVICE WORKER REGISTRATION
============================== */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            swRegistration = await navigator.serviceWorker.register("./service-worker.js");

            // If already waiting
            if (swRegistration.waiting) {
                showUpdatePopup();
            }

            // Detect new updates
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

        } catch (err) {
            console.error("Service Worker failed:", err);
        }
    });

    // Reload when new SW activates
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
    });
}


/* ==============================
   UPDATE POPUP
============================== */

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

        if (!swRegistration) return;

        if (swRegistration.waiting) {
            swRegistration.waiting.postMessage("SKIP_WAITING");
        }
    });
}


/* ==============================
   FETCH STATUS
============================== */

async function fetchStatus() {
    try {
        const response = await fetch("./status.json?" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Status file not found");

        const data = await response.json();
        updateDashboard(data);

    } catch (error) {
        console.error("Failed to fetch status:", error);
    }
}

/* ==============================
   GLOBAL STATUS BANNER
============================== */

function ensureGlobalBanner() {
    let banner = document.getElementById("global-status-banner");

    if (!banner) {
        banner = document.createElement("div");
        banner.id = "global-status-banner";
        banner.className = "hidden";
        document.body.prepend(banner);
    }

    return banner;
}

function applyGlobalStatus(status) {

    const banner = ensureGlobalBanner();

    banner.classList.remove(
        "hidden",
        "banner-warning",
        "banner-critical"
    );

    document.body.classList.remove(
        "warning-mode",
        "critical-mode"
    );

    if (!status) return;

    const normalized = status.toLowerCase().trim();

    if (normalized === "warning") {

        banner.textContent =
            "⚠️ WARNING: Minor stability issue(s)";

        banner.classList.add("banner-warning");
        document.body.classList.add("warning-mode");

    } else if (normalized === "critical") {

        banner.textContent =
            "🚨 CRITICAL: Major stability issue(s)";

        banner.classList.add("banner-critical");
        document.body.classList.add("critical-mode");

    } else {
        banner.classList.add("hidden");
    }
}

/* ==============================
   UPDATE DASHBOARD
============================== */

function updateDashboard(statuses) {
    
    const path = window.location.pathname;

    let globalStatus;

    if (path.includes("/app/")) {
        globalStatus = statuses["App Status"];
    } else {
        globalStatus = statuses["Website Status"];
    }

    applyGlobalStatus(globalStatus);

    document.querySelectorAll(".status-card").forEach(card => {

        const key = card.getAttribute("data-key");
        if (!key || !statuses[key]) return;

        const status = statuses[key].toLowerCase().trim();

        // Set data-status for CSS animations
        card.setAttribute("data-status", status);

        // Update text
        const statusText = card.querySelector(".status-text");
        if (statusText) {
            statusText.innerText =
                status.charAt(0).toUpperCase() + status.slice(1);
        }
    });

    // Render current issues
    const issuesContainer = document.getElementById("issues-container");

    if (issuesContainer) {
        issuesContainer.innerHTML = "";

        if (statuses.issues && statuses.issues.length > 0) {

            statuses.issues.forEach(issue => {

                const div = document.createElement("div");
                div.classList.add("issue-item", issue.severity.toLowerCase());

                div.innerHTML = `
                    <strong>${issue.title}</strong>
                    <p>${issue.description}</p>
                `;

                issuesContainer.appendChild(div);
            });

        } else {
            issuesContainer.innerHTML = "<p>No current issues 🎉</p>";
        }
    }

    // Update timestamp
    const lastUpdated = document.getElementById("last-updated");
    if (lastUpdated) {
        lastUpdated.innerText =
            "Last Updated: " + new Date().toLocaleTimeString();
    }
}

