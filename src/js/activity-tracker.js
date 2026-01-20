// Activity Tracker Content Script
// Monitors user activity on web pages and reports to background script

(function() {
  'use strict';

  let activityTimeout = null;
  const ACTIVITY_THROTTLE = 10000; // Report activity max once every 10 seconds
  let lastActivityReport = 0;

  /**
   * Report user activity to background script
   * Throttled to avoid excessive messaging
   */
  function reportActivity() {
    const now = Date.now();
    
    // Throttle: only report if 10 seconds have passed since last report
    if (now - lastActivityReport < ACTIVITY_THROTTLE) {
      return;
    }

    lastActivityReport = now;

    console.log('[Activity Tracker] Reporting activity to background');

    // Send activity signal to background script
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({ 
          action: 'userActivity',
          source: 'content-script',
          timestamp: now
        }).catch((error) => {
          // Silently handle extension context invalidation (happens on reload)
          if (error.message && error.message.includes('Extension context invalidated')) {
            // Extension was reloaded, this is expected - stop trying to send messages
            return;
          }
          console.log('[Activity Tracker] Error sending message:', error);
        });
      } catch (error) {
        // Extension context no longer valid, silently fail
        if (error.message && !error.message.includes('Extension context invalidated')) {
          console.log('[Activity Tracker] Error:', error);
        }
      }
    }
  }

  /**
   * Debounced activity handler
   * Prevents excessive function calls
   */
  function handleActivity() {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(reportActivity, 1000); // Debounce by 1 second
  }

  // ============================================================================
  // EVENT LISTENERS FOR USER ACTIVITY
  // ============================================================================

  // Mouse movement
  document.addEventListener('mousemove', handleActivity, { passive: true });

  // Mouse clicks
  document.addEventListener('mousedown', reportActivity, { passive: true });
  document.addEventListener('mouseup', reportActivity, { passive: true });
  document.addEventListener('click', reportActivity, { passive: true });

  // Keyboard activity
  document.addEventListener('keydown', reportActivity, { passive: true });
  document.addEventListener('keypress', reportActivity, { passive: true });
  document.addEventListener('keyup', reportActivity, { passive: true });

  // Scrolling
  document.addEventListener('scroll', handleActivity, { passive: true });
  window.addEventListener('scroll', handleActivity, { passive: true });

  // Touch events (for tablets/mobile)
  document.addEventListener('touchstart', reportActivity, { passive: true });
  document.addEventListener('touchmove', handleActivity, { passive: true });
  document.addEventListener('touchend', reportActivity, { passive: true });

  // Wheel events (mouse wheel scrolling)
  document.addEventListener('wheel', handleActivity, { passive: true });

  // Focus events (clicking into input fields, etc.)
  document.addEventListener('focus', reportActivity, { passive: true, capture: true });
  
  // Page visibility change (switching back to the tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      reportActivity(); // Tab became visible, user is active
    }
  });

  // Video/audio playback detection
  // When video plays, consider user active
  document.addEventListener('play', reportActivity, { passive: true, capture: true });
  
  // Detect video time updates (watching video)
  let videoActivityInterval = null;
  document.addEventListener('playing', () => {
    // While video is playing, periodically report activity
    if (!videoActivityInterval) {
      videoActivityInterval = setInterval(() => {
        const videos = document.querySelectorAll('video');
        const hasPlayingVideo = Array.from(videos).some(v => !v.paused && !v.ended);
        if (hasPlayingVideo) {
          reportActivity();
        } else {
          clearInterval(videoActivityInterval);
          videoActivityInterval = null;
        }
      }, 15000); // Every 15 seconds while video plays
    }
  }, { passive: true, capture: true });

  document.addEventListener('pause', () => {
    // Clear video activity interval when paused
    if (videoActivityInterval) {
      clearInterval(videoActivityInterval);
      videoActivityInterval = null;
    }
  }, { passive: true, capture: true });

  // Log initialization (for debugging)
  // console.log('[Locksy Activity Tracker] Initialized on:', window.location.hostname);

})();
