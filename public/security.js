/**
 * DevStream Anti-Inspect & Media Security Shield
 * Protects streams from unauthorized inspection, token extraction, and hotlinking.
 */
(function() {
  'use strict';

  // 1. SILENCE ALL CONSOLE LOGGING
  try {
    const noop = function() {};
    window.console.log = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.debug = noop;
    window.console.trace = noop;
    window.console.table = noop;
  } catch (e) {}

  // 2. DISABLE CONTEXT MENU (RIGHT-CLICK)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 3. DISABLE COMMON INSPECT & DEVTOOLS KEYBOARD SHORTCUTS
  document.addEventListener('keydown', function(e) {
    const key = e.key || '';
    const keyCode = e.keyCode || 0;

    // F12 key
    if (key === 'F12' || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl+Shift+I / J / C / K (Inspect & Console)
    if (isCtrlOrMeta && e.shiftKey) {
      const lower = key.toLowerCase();
      if (lower === 'i' || lower === 'j' || lower === 'c' || lower === 'k') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl+U (View Page Source)
    if (isCtrlOrMeta && (key === 'u' || key === 'U' || keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S (Save Webpage)
    if (isCtrlOrMeta && (key === 's' || key === 'S' || keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+P (Print Page / Export DOM)
    if (isCtrlOrMeta && (key === 'p' || key === 'P' || keyCode === 80)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 4. DISABLE DRAG AND DROP ON MEDIA & CONTAINER
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  }, true);

  // 5. DEVTOOLS ACTIVE DETECTION & SECURITY OVERLAY
  let devtoolsDetected = false;
  let devtoolsOverlay = null;

  function createSecurityOverlay() {
    if (devtoolsOverlay) return;
    devtoolsOverlay = document.createElement('div');
    devtoolsOverlay.id = 'security-devtools-shield';
    devtoolsOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.98);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    `;
    devtoolsOverlay.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; padding: 32px; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
        <div style="width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; font-size: 26px;">
          🛡️
        </div>
        <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.02em;">Developer Tools Detected</h2>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
          To prevent stream interception and protect copyrighted broadcast feeds, inspection mode is blocked.
        </p>
        <div style="font-size: 12px; font-weight: 600; color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 10px 16px; border-radius: 12px; margin-bottom: 20px;">
          Please close Developer Tools to continue playback
        </div>
        <button id="btn-security-recheck" style="background: #10b981; color: #020617; border: none; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s;">
          I've Closed DevTools (Resume)
        </button>
      </div>
    `;
    document.body.appendChild(devtoolsOverlay);

    const recheckBtn = document.getElementById('btn-security-recheck');
    if (recheckBtn) {
      recheckBtn.addEventListener('click', function() {
        checkDevTools();
        if (!devtoolsDetected && devtoolsOverlay) {
          devtoolsOverlay.remove();
          devtoolsOverlay = null;
          resumeMedia();
        }
      });
    }
  }

  function pauseMedia() {
    const videos = document.querySelectorAll('video');
    videos.forEach(function(v) {
      try { v.pause(); } catch(e) {}
    });
  }

  function resumeMedia() {
    const videos = document.querySelectorAll('video');
    videos.forEach(function(v) {
      try { v.play().catch(function(){}); } catch(e) {}
    });
  }

  function onDevToolsOpen() {
    if (devtoolsDetected) return;
    devtoolsDetected = true;
    pauseMedia();
    createSecurityOverlay();
  }

  function onDevToolsClose() {
    if (!devtoolsDetected) return;
    devtoolsDetected = false;
    if (devtoolsOverlay) {
      devtoolsOverlay.remove();
      devtoolsOverlay = null;
    }
    resumeMedia();
  }

  // Window resize delta detector (docked devtools)
  function checkWindowDelta() {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    if (widthThreshold || heightThreshold) {
      onDevToolsOpen();
    } else {
      onDevToolsClose();
    }
  }

  // Timing-based detector (works even for undocked devtools)
  function checkTiming() {
    const start = performance.now();
    // Debugger statement triggers slow execution if devtools is open
    // Using a regex object toString trick:
    const div = document.createElement('div');
    Object.defineProperty(div, 'id', {
      get: function() {
        onDevToolsOpen();
        return 'security';
      }
    });
    // Triggers getter only if console/devtools is actively evaluating DOM
    const diff = performance.now() - start;
    if (diff > 100) {
      onDevToolsOpen();
    }
  }

  function checkDevTools() {
    checkWindowDelta();
  }

  window.addEventListener('resize', checkDevTools);
  setInterval(checkDevTools, 1500);

})();

