/**
 * DevStream Silent Anti-DevTools & Anti-Inspect Shield
 * Immediately closes the website silently when inspect/developer mode is opened.
 * No notifications, no alerts — instant silent termination & blank.
 */
(function() {
  'use strict';

  let isTerminated = false;

  // Immediate Silent Termination function
  function closeWebsiteImmediately() {
    if (isTerminated) return;
    isTerminated = true;

    // 1. Immediately pause and destroy all media & iframes
    try {
      const media = document.querySelectorAll('video, audio, iframe, embed');
      media.forEach(function(el) {
        try { el.pause(); } catch(e) {}
        try { el.src = ''; } catch(e) {}
        try { el.remove(); } catch(e) {}
      });
    } catch(e) {}

    // 2. Wipe the entire DOM completely so no content or URLs remain
    try {
      if (document.body) document.body.innerHTML = '';
      if (document.head) document.head.innerHTML = '';
      document.documentElement.innerHTML = '';
    } catch(e) {}

    // 3. Try to close the browser tab/window
    try {
      window.close();
    } catch(e) {}

    // 4. Fallback: immediately replace location with about:blank
    try {
      window.location.replace('about:blank');
    } catch(e) {
      window.location.href = 'about:blank';
    }
  }

  // 1. SILENCE CONSOLE COMPLETELY
  try {
    const noop = function() {};
    window.console.log = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.debug = noop;
    window.console.trace = noop;
    window.console.table = noop;
    window.console.dir = noop;
  } catch(e) {}

  // 2. BLOCK CONTEXT MENU (RIGHT-CLICK)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 3. BLOCK INSPECT SHORTCUTS AND CLOSE ON ATTEMPT
  document.addEventListener('keydown', function(e) {
    const key = e.key || '';
    const keyCode = e.keyCode || 0;
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // F12 key -> immediately close
    if (key === 'F12' || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      closeWebsiteImmediately();
      return false;
    }

    // Ctrl+Shift+I / J / C / K -> immediately close
    if (isCtrlOrMeta && e.shiftKey) {
      const lower = key.toLowerCase();
      if (['i', 'j', 'c', 'k'].includes(lower) || [73, 74, 67, 75].includes(keyCode)) {
        e.preventDefault();
        e.stopPropagation();
        closeWebsiteImmediately();
        return false;
      }
    }

    // Ctrl+U (View Page Source) -> immediately close
    if (isCtrlOrMeta && (key === 'u' || key === 'U' || keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      closeWebsiteImmediately();
      return false;
    }

    // Ctrl+S (Save Webpage) -> block
    if (isCtrlOrMeta && (key === 's' || key === 'S' || keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 4. BLOCK DRAGGING OF ELEMENTS
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  }, true);

  // 5. DEVTOOLS ACTIVE DETECTION (SILENT AUTO-CLOSE)
  
  // Method A: Viewport Delta Detection (Docked DevTools)
  function checkViewportDelta() {
    if (window.outerWidth && window.innerWidth) {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      // If docked devtools is open (typically > 160px)
      if (widthDiff > 160 || heightDiff > 160) {
        closeWebsiteImmediately();
      }
    }
  }

  // Method B: Console Getter Trigger (Undocked / Detached DevTools)
  function checkConsoleGetter() {
    try {
      const detector = new Image();
      Object.defineProperty(detector, 'id', {
        get: function() {
          closeWebsiteImmediately();
          return '';
        }
      });
      // When devtools is open, it inspects or evaluates the object
      console.log(detector);
      console.clear();
    } catch(e) {}
  }

  // Method C: Debugger Timing Check (triggers if DevTools is active)
  function checkDebuggerTiming() {
    try {
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      (function() {}['constructor']('debugger')());
      if (performance.now() - t0 > 100) {
        closeWebsiteImmediately();
      }
    } catch(e) {}
  }

  function runDevToolsChecks() {
    checkViewportDelta();
    checkConsoleGetter();
    checkDebuggerTiming();
  }

  window.addEventListener('resize', checkViewportDelta);
  setInterval(runDevToolsChecks, 1000);

})();
