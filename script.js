
const APP_VERSION = "2.0.9";


document.addEventListener("click", function (e) {
    const link = e.target.closest("a");
    if (!link) return;

    if (link.hostname !== window.location.hostname) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }
});


document.addEventListener("DOMContentLoaded", function () {

    // Insert version number
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


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {

        registration.update(); // optional

        registration.onupdatefound = () => {
          const newWorker = registration.installing;

          newWorker.onstatechange = () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              showUpdatePopup();
            }
          };
        };

      })
      .catch(error => console.log('SW failed:', error));
  });
}


function showUpdatePopup() {
    const popup = document.createElement("div");

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
        window.location.reload();
    });
}

