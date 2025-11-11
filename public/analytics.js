(function() {
  'use strict';

  const CONFIG = {
    trackingUrl: window.ANALYTICS_CONFIG?.apiUrl || 'https://gmvshvbfvqujlktpqllf.supabase.co/functions/v1/track',
    trackingId: window.ANALYTICS_CONFIG?.trackingId || null
  };

  if (!CONFIG.trackingId) {
    console.error('Analytics: No tracking ID provided');
    return;
  }

  function generateSessionId() {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) return stored;

    const id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('analytics_session_id', id);
    return id;
  }

  const sessionId = generateSessionId();

  function getPageData() {
    return {
      tracking_id: CONFIG.trackingId,
      session_id: sessionId,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language
    };
  }

  function sendTracking(data) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.trackingUrl, JSON.stringify(data));
    } else {
      fetch(CONFIG.trackingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(() => {});
    }
  }

  function trackPageView() {
    sendTracking(getPageData());
  }

  trackPageView();

  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      trackPageView();
    }
  });

  observer.observe(document, { subtree: true, childList: true });

  window.addEventListener('beforeunload', () => {
    sendTracking(getPageData());
  });

  function isFileDownload(url) {
    const fileExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2',
      '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
      '.txt', '.csv', '.json', '.xml', '.log',
      '.exe', '.dmg', '.pkg', '.deb', '.rpm',
      '.iso', '.img'
    ];

    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname.toLowerCase();
      const search = urlObj.search.toLowerCase();

      const hasFileExtension = fileExtensions.some(ext => {
        return pathname.endsWith(ext) ||
               pathname.includes(ext + '/') ||
               search.includes(ext);
      });

      const hasDownloadParam = search.includes('download') ||
                              search.includes('attachment') ||
                              urlObj.hash.includes('download');

      return hasFileExtension || hasDownloadParam;
    } catch {
      return false;
    }
  }

  function isOutboundLink(url) {
    try {
      const currentDomain = window.location.hostname;
      const linkUrl = new URL(url, window.location.origin);
      const linkDomain = linkUrl.hostname;

      return linkDomain !== currentDomain;
    } catch {
      return false;
    }
  }

  function trackLinkClick(url, linkText, linkType) {
    sendTracking({
      ...getPageData(),
      event_type: 'link_click',
      link_url: url,
      link_text: linkText,
      link_type: linkType
    });
  }

  function handleLinkClick(target) {
    if (!target || !target.href) return;

    const url = target.href;
    const linkText = target.textContent.trim().substring(0, 200);
    const isFile = isFileDownload(url);
    const isOutbound = isOutboundLink(url);

    const hasDownloadAttr = target.hasAttribute('download');

    if (isFile || hasDownloadAttr) {
      trackLinkClick(url, linkText, 'file_download');
    } else if (isOutbound) {
      trackLinkClick(url, linkText, 'outbound');
    }
  }

  document.addEventListener('click', function(e) {
    let target = e.target;

    while (target && target !== document) {
      if (target.tagName === 'A') {
        handleLinkClick(target);
        break;
      }
      target = target.parentElement;
    }
  }, true);

  document.addEventListener('auxclick', function(e) {
    if (e.button === 1) {
      let target = e.target;
      while (target && target !== document) {
        if (target.tagName === 'A') {
          handleLinkClick(target);
          break;
        }
        target = target.parentElement;
      }
    }
  }, true);

  window.analytics = {
    trackEvent: function(eventName, eventData) {
      sendTracking({
        ...getPageData(),
        event_name: eventName,
        event_data: eventData
      });
    },
    trackDownload: function(fileUrl, fileName) {
      trackLinkClick(fileUrl, fileName || 'Manual Download', 'file_download');
    },
    trackOutboundLink: function(url, linkText) {
      trackLinkClick(url, linkText || url, 'outbound');
    }
  };
})();
