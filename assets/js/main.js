(function () {
  var html = document.documentElement;
  var btn = document.getElementById('themeBtn');

  // Returns the stored user preference: 'light' | 'dark' | 'system'
  // Migrates any legacy 'theme' key on first run.
  function getPref() {
    var pref = localStorage.getItem('themePref');
    if (pref === 'light' || pref === 'dark' || pref === 'system') return pref;
    // One-time migration from legacy key (stored resolved value, not pref)
    var legacy = localStorage.getItem('theme');
    if (legacy === 'light' || legacy === 'dark') {
      localStorage.setItem('themePref', legacy);
      localStorage.removeItem('theme');
      return legacy;
    }
    return 'system'; // Default: follow system on first visit
  }

  function setPref(pref) {
    localStorage.setItem('themePref', pref);
  }

  // Resolve a user preference to the actual applied theme value
  function resolveApplied(pref) {
    return pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref;
  }

  // Cycle order: light → dark → system → light
  function getNextPref(pref) {
    if (pref === 'light') return 'dark';
    if (pref === 'dark') return 'system';
    return 'light';
  }

  function updateButton(pref) {
    var next = getNextPref(pref);
    btn.setAttribute('data-mode', pref);
    btn.setAttribute('data-tooltip', next.charAt(0).toUpperCase() + next.slice(1));
  }

  function applyTheme(pref) {
    html.setAttribute('data-theme', resolveApplied(pref));
    updateButton(pref);
  }

  function showFeedback(pref) {
    var label = pref.charAt(0).toUpperCase() + pref.slice(1);
    var feedback = document.createElement('div');
    feedback.className = 'theme-feedback';
    feedback.textContent = 'Theme set to ' + label;
    document.body.appendChild(feedback);
    setTimeout(function () {
      feedback.classList.add('hide');
      setTimeout(function () { document.body.removeChild(feedback); }, 300);
    }, 2000);
  }

  // Initialize — apply current pref to DOM without writing to storage
  applyTheme(getPref());

  // Cycle on click: persist new pref, apply, show feedback
  btn.addEventListener('click', function () {
    var next = getNextPref(getPref());
    setPref(next);
    applyTheme(next);
    showFeedback(next);
    // Suppress hover icon swap briefly so sticky-hover on touch doesn't
    // show the wrong icon after the theme changes
    btn.classList.add('no-hover');
    setTimeout(function () { btn.classList.remove('no-hover'); }, 500);
  });

  // Re-apply when system theme changes, but only if user is on 'system' pref
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (getPref() === 'system') {
      html.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  });
})();

// Article TOC: reveal it once the header has scrolled out of view
(function () {
  var toc = document.getElementById('articleToc');
  var header = document.getElementById('articleHeader');
  if (!toc || !header || !window.IntersectionObserver) return;

  var observer = new IntersectionObserver(function (entries) {
    toc.classList.toggle('visible', !entries[0].isIntersecting);
  }, { rootMargin: '-56px 0px 0px 0px' }); // account for the sticky nav

  observer.observe(header);
})();

// Article TOC: highlight active section while scrolling
(function () {
  var toc = document.getElementById('articleToc');
  if (!toc) return;
  var links = toc.querySelectorAll('.toc-link');
  var chapters = toc.querySelectorAll('.toc-h2');
  var headings = Array.prototype.map.call(links, function (link) {
    return document.getElementById(link.getAttribute('data-toc-target'));
  }).filter(Boolean);
  if (!headings.length) return;

  var offset = 120; // px from viewport top counted as the "current section" line

  function updateActive() {
    var current = headings[0];
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top - offset <= 0) {
        current = headings[i];
      } else {
        break;
      }
    }
    var link = toc.querySelector('.toc-link[data-toc-target="' + current.id + '"]');
    links.forEach(function (l) { l.classList.remove('active'); });
    if (link) link.classList.add('active');

    // Only expand the sub-chapter list of the chapter currently being read
    var section = link && (link.getAttribute('data-toc-parent') || link.getAttribute('data-toc-target'));
    chapters.forEach(function (li) {
      li.classList.toggle('expanded', li.getAttribute('data-toc-section') === section);
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateActive();
      ticking = false;
    });
  }, { passive: true });

  updateActive();
})();

// Article image lightbox: click to open, zoom (wheel/pinch/double-click), pan
(function () {
  var content = document.getElementById('articleContent');
  if (!content) return;

  var images = Array.prototype.slice.call(content.querySelectorAll('img'));
  if (!images.length) return;

  // Tag each image with the nearest preceding heading (its "chapter") and
  // its figcaption (or alt/title as a fallback), for display in the lightbox.
  var currentChapter = '';
  Array.prototype.forEach.call(content.children, function (node) {
    if (node.tagName === 'H2' || node.tagName === 'H3') {
      currentChapter = node.textContent.trim();
      return;
    }
    var imgsIn = node.tagName === 'IMG' ? [node] : Array.prototype.slice.call(node.querySelectorAll('img'));
    imgsIn.forEach(function (img) {
      img.__lightboxChapter = currentChapter;
      var figcaption = img.closest('figure') && img.closest('figure').querySelector('figcaption');
      img.__lightboxCaption = (figcaption && figcaption.textContent.trim()) || img.title || img.alt || '';
    });
  });

  var lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML =
    '<div class="lightbox-stage">' +
      '<img alt="">' +
      '<button type="button" class="lightbox-close" aria-label="Close">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<div class="lightbox-info">' +
        '<div class="lightbox-chapter"></div>' +
        '<div class="lightbox-caption"></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(lightbox);

  var stage = lightbox.querySelector('.lightbox-stage');
  var lbImg = lightbox.querySelector('img');
  var closeBtn = lightbox.querySelector('.lightbox-close');
  var infoEl = lightbox.querySelector('.lightbox-info');
  var chapterEl = lightbox.querySelector('.lightbox-chapter');
  var captionEl = lightbox.querySelector('.lightbox-caption');

  var scale = 1;
  var originX = 0;
  var originY = 0;
  var MIN_SCALE = 1;
  var MAX_SCALE = 4;

  function applyTransform(animated) {
    lbImg.style.transition = animated ? '' : 'none';
    lbImg.style.transform = 'translate(' + originX + 'px, ' + originY + 'px) scale(' + scale + ')';
    lbImg.classList.toggle('zoomed', scale > 1);
  }

  function clampOrigin() {
    if (scale <= 1) {
      originX = 0;
      originY = 0;
      return;
    }
    var rect = lbImg.getBoundingClientRect();
    var overflowX = (rect.width * scale - stage.clientWidth) / 2 / scale;
    var overflowY = (rect.height * scale - stage.clientHeight) / 2 / scale;
    var limX = Math.max(0, overflowX);
    var limY = Math.max(0, overflowY);
    originX = Math.min(limX, Math.max(-limX, originX));
    originY = Math.min(limY, Math.max(-limY, originY));
  }

  function resetZoom(animated) {
    scale = 1;
    originX = 0;
    originY = 0;
    applyTransform(animated !== false);
  }

  function setZoom(newScale, animated) {
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    clampOrigin();
    applyTransform(animated);
  }

  function open(img) {
    var src = img.currentSrc || img.src;
    lbImg.src = src;
    lbImg.alt = img.alt || '';
    chapterEl.textContent = img.__lightboxChapter || '';
    captionEl.textContent = img.__lightboxCaption || '';
    infoEl.style.display = (img.__lightboxChapter || img.__lightboxCaption) ? '' : 'none';
    resetZoom(false);
    lightbox.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('visible');
    document.body.style.overflow = '';
  }

  images.forEach(function (img) {
    img.addEventListener('click', function () { open(img); });
  });

  closeBtn.addEventListener('click', close);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target === stage) close();
  });

  window.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('visible')) return;
    if (e.key === 'Escape') close();
  });

  // Double-click / double-tap to toggle zoom, centered on the pointer
  lbImg.addEventListener('dblclick', function (e) {
    if (scale > 1) {
      resetZoom(true);
    } else {
      var rect = lbImg.getBoundingClientRect();
      originX = (rect.width / 2 - (e.clientX - rect.left)) * 0.5;
      originY = (rect.height / 2 - (e.clientY - rect.top)) * 0.5;
      setZoom(2.5, true);
    }
  });

  // Wheel to zoom (desktop trackpads/mice)
  lightbox.addEventListener('wheel', function (e) {
    e.preventDefault();
    var delta = -e.deltaY * 0.0025;
    setZoom(scale + delta * scale, false);
  }, { passive: false });

  // Drag to pan when zoomed (mouse + touch, single pointer)
  var dragging = false;
  var lastX = 0;
  var lastY = 0;
  var pointers = {};
  var pinchStartDist = 0;
  var pinchStartScale = 1;

  function dist(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  lbImg.addEventListener('pointerdown', function (e) {
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      pinchStartDist = dist(pointers[ids[0]], pointers[ids[1]]);
      pinchStartScale = scale;
      dragging = false;
    } else if (scale > 1) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lightbox.classList.add('dragging');
      lbImg.setPointerCapture(e.pointerId);
    }
  });

  lbImg.addEventListener('pointermove', function (e) {
    if (!(e.pointerId in pointers)) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);

    if (ids.length === 2) {
      var d = dist(pointers[ids[0]], pointers[ids[1]]);
      if (pinchStartDist > 0) {
        setZoom(pinchStartScale * (d / pinchStartDist), false);
      }
      return;
    }

    if (!dragging) return;
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    originX += dx / scale;
    originY += dy / scale;
    clampOrigin();
    applyTransform(false);
  });

  function endPointer(e) {
    delete pointers[e.pointerId];
    if (Object.keys(pointers).length < 2) pinchStartDist = 0;
    if (dragging) {
      dragging = false;
      lightbox.classList.remove('dragging');
      if (scale <= 1.02) resetZoom(true);
    }
  }

  lbImg.addEventListener('pointerup', endPointer);
  lbImg.addEventListener('pointercancel', endPointer);
  lbImg.addEventListener('pointerleave', function (e) {
    if (Object.keys(pointers).length <= 1) endPointer(e);
  });
})();

// Delegated navigation for [data-href] wrappers (post/featured items)
document.addEventListener('click', function (e) {
  var item = e.target.closest('[data-href]');
  if (!item) return;
  if (e.target.closest('a')) return;
  window.location.href = item.getAttribute('data-href');
});
