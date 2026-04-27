(function() {
  const scriptTag = document.currentScript;
  const scriptUrl = new URL(scriptTag && scriptTag.src ? scriptTag.src : window.location.href);
  const projectId = scriptUrl.searchParams.get('id');
  if (!projectId) {
    console.error('NotJar: Project ID is missing');
    return;
  }

  const API_ENDPOINT = new URL('/api/track', scriptUrl.origin).toString().replace(/\/$/, '');
  let sessionId = sessionStorage.getItem('notjar_session_id');
  let visitorId = localStorage.getItem('notjar_visitor_id');

  if (!visitorId) {
    visitorId = crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('notjar_visitor_id', visitorId);
  }

  // Initialize session
  async function initSession() {
    try {
      const response = await fetch(`${API_ENDPOINT}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          visitorId,
          userAgent: navigator.userAgent,
          screenRes: `${window.screen.width}x${window.screen.height}`,
          url: window.location.href,
          referrer: document.referrer
        })
      });
      const data = await response.json();
      sessionId = data.sessionId;
      sessionStorage.setItem('notjar_session_id', sessionId);
    } catch (err) {
      console.error('NotJar: Failed to initialize session', err);
    }
  }

  const eventQueue = [];
  let flushTimeout = null;

  function pushEvent(type, data) {
    if (!sessionId) return;
    
    eventQueue.push({
      type,
      data: {
        ...data,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      timestamp: Date.now(),
      url: window.location.href
    });

    if (eventQueue.length >= 10) {
      flushEvents();
    } else {
      if (flushTimeout) clearTimeout(flushTimeout);
      flushTimeout = setTimeout(flushEvents, 5000);
    }
  }

  async function flushEvents(useBeacon) {
    if (eventQueue.length === 0 || !sessionId) return;

    const events = [...eventQueue];
    eventQueue.length = 0;
    const payload = JSON.stringify({
      sessionId,
      events
    });

    if (useBeacon && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(`${API_ENDPOINT}/events`, new Blob([payload], { type: 'application/json' }));
      if (sent) return;
    }

    try {
      await fetch(`${API_ENDPOINT}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: Boolean(useBeacon)
      });
    } catch (err) {
      // Re-add events to queue if failed
      eventQueue.unshift(...events);
      console.error('NotJar: Failed to flush events', err);
    }
  }

  // Track Clicks
  document.addEventListener('click', (e) => {
    const target = e.target;
    pushEvent('click', {
      x: e.clientX,
      y: e.clientY,
      tagName: target.tagName,
      id: target.id,
      className: typeof target.className === 'string' ? target.className : '',
      text: target.innerText?.substring(0, 50)
    });
  });

  // Track Mouse Movement (Throttled)
  let lastMove = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMove < 200) return; // 5 times per second
    lastMove = now;
    pushEvent('mousemove', { x: e.clientX, y: e.clientY });
  });

  // Track Scroll (Throttled)
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScroll < 500) return;
    lastScroll = now;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    pushEvent('scroll', {
      x: window.scrollX,
      y: window.scrollY,
      percentage: scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100
    });
  });

  // Track Page Navigation (SPA support)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      pushEvent('navigation', { url: lastUrl });
    }
  }, 1000);

  // Initialize
  initSession();

  // Flush on unload
  window.addEventListener('pagehide', () => flushEvents(true));
  window.addEventListener('beforeunload', () => flushEvents(true));

})();
