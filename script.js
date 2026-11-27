
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- hero text types itself, one character after another, like the terminal ---- */
  var typeEls = document.querySelectorAll("[data-stagger]");
  if (!reducedMotion) {
    // name and role are separate columns, so each types on its own, starting together
    [".hero-title", ".hero-role"].forEach(function (column) {
      var chars = [];
      document.querySelectorAll(column + " [data-stagger]").forEach(function (el) {
        var text = el.textContent;
        el.textContent = "";
        Array.from(text).forEach(function (ch) {
          var s = document.createElement("span");
          s.className = "type-char";
          s.textContent = ch;
          el.appendChild(s);
          chars.push(s);
        });
      });
      var typed = 0;
      (function typeNext() {
        if (typed >= chars.length) return;
        if (typed) chars[typed - 1].classList.remove("cur");
        chars[typed++].classList.add("on", "cur");
        setTimeout(typeNext, 70);
      })();
    });
  }
  typeEls.forEach(function (el) { el.classList.add("is-staggered"); });

  /* ---- icosahedron wireframe generator ---- */
  function icosaLines() {
    var cx = 100, cy = 100, r1 = 64, r2 = 52, step = Math.PI * 2 / 5;
    var top = [cx, 26], bottom = [cx, 180];
    var upper = [], lower = [];
    for (var i = 0; i < 5; i++) {
      var a1 = -Math.PI / 2 + i * step;
      var a2 = -Math.PI / 2 + (i + 0.5) * step;
      upper.push([cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1]);
      lower.push([cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2]);
    }
    var lines = [];
    for (i = 0; i < 5; i++) {
      var j = (i + 1) % 5, k = (i + 4) % 5;
      lines.push([top[0], top[1], upper[i][0], upper[i][1]]);
      lines.push([bottom[0], bottom[1], lower[i][0], lower[i][1]]);
      lines.push([upper[i][0], upper[i][1], lower[i][0], lower[i][1]]);
      lines.push([upper[i][0], upper[i][1], lower[k][0], lower[k][1]]);
      lines.push([upper[i][0], upper[i][1], upper[j][0], upper[j][1]]);
      lines.push([lower[i][0], lower[i][1], lower[j][0], lower[j][1]]);
    }
    return lines;
  }

  var NS = "http://www.w3.org/2000/svg";
  function renderIcosa(root) {
    if (!root || root.childElementCount > 0) return;
    icosaLines().forEach(function (l) {
      var line = document.createElementNS(NS, "line");
      line.setAttribute("x1", l[0]); line.setAttribute("y1", l[1]);
      line.setAttribute("x2", l[2]); line.setAttribute("y2", l[3]);
      root.appendChild(line);
    });
  }
  document.querySelectorAll("g.ico-lines").forEach(renderIcosa);

  /* ---- hero cartoon: eyes and head follow the pointer ---- */
  var man = document.getElementById("man");
  if (man && !reducedMotion) {
    window.addEventListener("pointermove", function (e) {
      var r = man.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.43);
      var d = Math.hypot(dx, dy) || 1, reach = Math.min(d / 25, 9);
      man.style.setProperty("--x", (dx / d * reach) + "px");
      man.style.setProperty("--y", (dy / d * reach) + "px");
    }, { passive: true });
  }

  /* ---- navbar: scrolled state ---- */
  var nav = document.getElementById("nav");
  var intro = document.getElementById("intro");
  // the intro eases toward the scroll position every frame, so wheel steps do not jerk the cartoon
  var target = 0, current = 0, frame = 0;
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function between(value, start, end) {
    return smoothstep(Math.max(0, Math.min(1, (value - start) / (end - start))));
  }
  function paint() {
    current += (target - current) * (reducedMotion ? 1 : 0.1);
    if (Math.abs(target - current) < 0.001) current = target;
    intro.style.setProperty("--p", smoothstep(current));
    intro.style.setProperty("--hero", 1 - between(current, 0.15, 0.65));
    intro.style.setProperty("--t", between(current, 0.35, 0.85));
    frame = current === target ? 0 : requestAnimationFrame(paint);
  }
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
    // 0 at the top, 1 just before the About screen is fully in view
    target = Math.min(window.scrollY / (window.innerHeight * 0.85), 1);
    if (reducedMotion) target = Math.round(target);
    if (!frame) frame = requestAnimationFrame(paint);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile menu ---- */
  var toggle = document.getElementById("nav-toggle");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  document.querySelectorAll(".mobile-menu a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  function scrollToElement(el, offset) {
    if (!el) return;
    var padding = offset === undefined ? (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) : offset;
    var top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - padding);
    window.scrollTo({ top: top, behavior: reducedMotion ? "auto" : "smooth" });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToElement(target, target.classList.contains("education-section") ? 0 : undefined);
    });
  });

  var eduTrack = document.getElementById("edu-scroll-track");
  if (eduTrack) {
    var eduCanvas = document.getElementById("edu-canvas");
    var eduSvg = document.getElementById("edu-journey-svg");
    var eduPath = document.getElementById("edu-journey-path");
    var eduSheen = document.getElementById("edu-progress-sheen");
    var eduProgressPath = document.getElementById("edu-progress-path");
    var eduAnchor = document.getElementById("edu-student-anchor");
    var eduRig = document.getElementById("edu-student-rig");
    var eduCelebration = document.getElementById("edu-celebration-layer");
    var eduCue = document.getElementById("edu-scroll-cue");
    var eduFill = document.getElementById("edu-progress-fill");
    var eduLength = eduPath.getTotalLength();
    var eduSheenLength = eduSheen.getTotalLength();
    var eduMilestones = [
      { el: document.getElementById("edu-ms-school"), node: document.getElementById("edu-node-school"), reveal: 0, reach: 0.14, jump: 0.16 },
      { el: document.getElementById("edu-ms-plus2"), node: document.getElementById("edu-node-plus2"), reveal: 0.3, reach: 0.49, jump: 0.51 },
      { el: document.getElementById("edu-ms-college"), node: document.getElementById("edu-node-college"), reveal: 0.65, reach: 0.84, jump: 1 }
    ];
    var eduTarget = 0, eduCurrent = 0, eduLast = 0, eduFrame = 0, eduDirection = 1, eduWalkTimer = 0;

    function eduClamp(value) { return Math.max(0, Math.min(1, value)); }
    function eduIsMobile() { return window.matchMedia("(max-width: 900px)").matches; }
    function eduVisibleHeight() {
      var navEl = document.getElementById("nav");
      var navHeight = navEl ? navEl.getBoundingClientRect().height : 0;
      return Math.max(1, window.innerHeight - navHeight);
    }
    function eduScrollable() { return Math.max(1, eduTrack.getBoundingClientRect().height - eduVisibleHeight()); }
    function eduProgress() { return eduClamp(-eduTrack.getBoundingClientRect().top / eduScrollable()); }

    function eduScrollTo(progress) {
      var rect = eduTrack.getBoundingClientRect();
      var top = window.scrollY + rect.top + eduScrollable() * eduClamp(progress);
      window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : "smooth" });
    }

    function eduPanCanvas(progress) {
      if (eduIsMobile()) return;
      var maxLeft = eduCanvas.scrollWidth - eduCanvas.clientWidth;
      if (maxLeft > 1) eduCanvas.scrollLeft = maxLeft * progress;
    }

    function eduInterpolate(stops, values, value) {
      for (var i = 1; i < stops.length; i++) {
        if (value <= stops[i]) {
          var t = Math.max(0, Math.min(1, (value - stops[i - 1]) / (stops[i] - stops[i - 1])));
          t = t * t * (3 - 2 * t);
          return values[i - 1] + (values[i] - values[i - 1]) * t;
        }
      }
      return values[values.length - 1];
    }

    function eduCamera(progress, point) {
      var zoom = eduInterpolate([0, 0.16, 0.51, 0.84, 1], [1, 1.12, 1.17, 1.24, 1.3], progress);
      var width, height, centerX, centerY;

      if (eduIsMobile()) {
        height = 540 / zoom;
        var rect = eduCanvas.getBoundingClientRect();
        width = Math.min(1800, height * (rect.width / Math.max(1, rect.height)));
        var cardX = eduInterpolate([0, 0.16, 0.51, 0.84, 1], [284, 284, 849, 1289, 1289], progress);
        var cardWeight = eduInterpolate([0, 0.84], [0.9, 1], progress);
        centerX = Math.max(width / 2, Math.min(1800 - width / 2, cardX * cardWeight + point.x * (1 - cardWeight)));
        centerY = eduInterpolate([0, 1], [270, 240], progress);
        centerY = Math.max(height / 2, Math.min(540 - height / 2, centerY));
      } else {
        width = 1800 / zoom;
        height = 540 / zoom;
        var xOvershoot = 20 + (zoom - 1) * 400;
        var yOvershoot = 20 + (zoom - 1) * 200;
        centerX = Math.max(width / 2 - xOvershoot, Math.min(1800 - width / 2 + xOvershoot, point.x));
        var wantedY = 270 + (point.y + 30 - 270) * 0.28;
        centerY = Math.max(height / 2 - yOvershoot, Math.min(540 - height / 2 + yOvershoot, wantedY));
      }

      eduSvg.setAttribute("viewBox", (centerX - width / 2).toFixed(1) + " " + (centerY - height / 2).toFixed(1) + " " + width.toFixed(1) + " " + height.toFixed(1));
    }

    function eduRender(progress) {
      var p = eduClamp(progress);
      var len = p * eduLength;
      var pt = eduPath.getPointAtLength(len);

      eduProgressPath.style.strokeDasharray = String(eduLength);
      eduProgressPath.style.strokeDashoffset = (eduLength - len).toFixed(2);
      eduSheen.style.strokeDasharray = String(eduSheenLength);
      eduSheen.style.strokeDashoffset = (eduSheenLength - p * eduSheenLength).toFixed(2);
      var mobile = eduIsMobile();
      var studentX = mobile ? Math.min(pt.x, 1370) : pt.x;
      eduAnchor.setAttribute("transform", "translate(" + studentX.toFixed(2) + "," + (pt.y + 30).toFixed(2) + ")");
      eduCelebration.setAttribute("transform", "translate(" + (mobile ? -260 : 0) + ", " + (mobile ? 150 : 30) + ")");
      eduCamera(p, pt);
      eduCue.classList.toggle("is-hidden", p > 0.03);
      eduFill.style.transform = "scaleX(" + p.toFixed(3) + ")";
      eduPanCanvas(p);

      eduMilestones.forEach(function (m) {
        var revealed = p >= m.reveal;
        var reached = p >= m.reach;
        m.el.classList.toggle("is-active", revealed);
        m.node.classList.toggle("is-active", revealed);
        m.el.classList.toggle("is-reached", reached);
        m.node.classList.toggle("is-reached", reached);
      });

      if (p >= 0.96) {
        eduRig.setAttribute("transform", "scale(1, 1)");
        eduRig.classList.remove("is-walking", "is-idle");
        eduRig.classList.add("is-celebrating");
        eduCelebration.classList.add("is-active");
      } else {
        eduCelebration.classList.remove("is-active");
        eduRig.classList.remove("is-celebrating");
      }
    }

    function eduWalk(direction) {
      if (reducedMotion) return;
      eduDirection = direction;
      eduRig.setAttribute("transform", "scale(" + eduDirection + ", 1)");
      if (eduCurrent < 0.96) {
        eduRig.classList.remove("is-idle", "is-celebrating");
        eduRig.classList.add("is-walking");
      }
      clearTimeout(eduWalkTimer);
      eduWalkTimer = setTimeout(function () {
        eduRig.classList.remove("is-walking");
        eduRig.classList.add(eduCurrent >= 0.96 ? "is-celebrating" : "is-idle");
      }, 160);
    }

    function eduAnimate() {
      var diff = eduTarget - eduCurrent;
      if (Math.abs(diff) > 0.0002) {
        eduCurrent += diff * (reducedMotion ? 1 : 0.095);
        eduRender(eduCurrent);
        eduFrame = requestAnimationFrame(eduAnimate);
      } else {
        eduCurrent = eduTarget;
        eduRender(eduCurrent);
        eduFrame = 0;
      }
    }

    function eduQueue() { if (!eduFrame) eduFrame = requestAnimationFrame(eduAnimate); }
    function eduSync() {
      eduTarget = eduProgress();
      eduCurrent = eduTarget;
      eduLast = eduTarget;
      eduRender(eduCurrent);
    }

    window.addEventListener("scroll", function () {
      var next = eduProgress();
      var delta = next - eduLast;
      if (Math.abs(delta) > 0.0005) eduWalk(delta > 0 ? 1 : -1);
      eduLast = next;
      eduTarget = next;
      eduQueue();
    }, { passive: true });

    window.addEventListener("resize", eduSync);
    window.addEventListener("load", eduSync);

    eduMilestones.forEach(function (m) {
      function jump() { eduScrollTo(m.jump); }
      function onKey(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jump();
        }
      }
      m.el.addEventListener("click", jump);
      m.el.addEventListener("keydown", onKey);
      m.node.addEventListener("click", jump);
    });

    eduSync();
  }

  /* ---- active section ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a, .mobile-menu a"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = "#" + entry.target.id;
      links.forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === id);
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(function (s) { spy.observe(s); });

  /* ---- reveal on scroll ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseInt(entry.target.getAttribute("data-delay") || "0", 10);
        if (delay) entry.target.style.transitionDelay = delay + "ms";
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---- CV terminal: type the CV in a loop ---- */
  var termCode = document.getElementById("term-code");
  if (termCode) {
    function getExpText() {
      var start = new Date("2025-10-27T00:00:00");
      var now = new Date();
      var totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      if (now.getDate() < start.getDate()) totalMonths--;
      if (totalMonths < 0) totalMonths = 0;
      var years = Math.floor(totalMonths / 12);
      var months = totalMonths % 12;
      var parts = [];
      if (years > 0) parts.push(years + (years === 1 ? " yr" : " yrs"));
      if (months > 0) parts.push(months + (months === 1 ? " mo" : " mos"));
      if (parts.length === 0) parts.push("less than 1 mo");
      return "PHP & Laravel Developer (" + parts.join(" ") + ") · Longtail E-Media";
    }

    var cvLines = [
      [{ c: "tp", t: "nitish@portfolio:~$ " }, { c: "tc", t: "whoami" }],
      [{ c: "tk", t: "Nitish Shakya" }, { c: "to", t: " — Backend Developer (PHP · Laravel)" }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "education" }],
      [{ c: "to", t: "B.Sc. CSIT · Amrit Campus, Tribhuvan University" }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "experience" }],
      [{ c: "to", t: getExpText() }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "skills" }],
      [{ c: "to", t: "PHP  Laravel  MySQL  JavaScript  React  Next.js" }],
      [{ c: "to", t: "Python  Django  TensorFlow  Keras  OpenCV  MediaPipe" }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "projects" }],
      [{ c: "to", t: "Custom-CMS  Payment-Gateway  REST-API-JWT" }],
      [{ c: "to", t: "Client-Websites  Production-Support" }]
    ];
    var cursor = document.createElement("span");
    cursor.className = "term-cursor";
    var charDelay = 24, linePause = 320, endPause = 3600, cancelled = false;

    function renderInstant() {
      termCode.innerHTML = "";
      var last = null;
      cvLines.forEach(function (line) {
        var el = document.createElement("span");
        el.className = "term-line";
        line.forEach(function (seg) {
          var s = document.createElement("span");
          s.className = seg.c;
          s.textContent = seg.t;
          el.appendChild(s);
        });
        termCode.appendChild(el);
        last = el;
      });
      last.appendChild(cursor);
    }

    function runTyping() {
      termCode.innerHTML = "";
      var lineIndex = 0, segIndex = 0, charIndex = 0, lineEl = null;
      function tick() {
        if (cancelled) return;
        if (lineIndex >= cvLines.length) { setTimeout(restart, endPause); return; }
        if (segIndex === 0 && charIndex === 0) {
          lineEl = document.createElement("span");
          lineEl.className = "term-line";
          termCode.appendChild(lineEl);
          lineEl.appendChild(cursor);
        }
        var seg = cvLines[lineIndex][segIndex];
        if (charIndex < seg.t.length) {
          lineEl.appendChild(document.createTextNode(seg.t.charAt(charIndex++)));
          setTimeout(tick, charDelay);
          return;
        }
        segIndex++; charIndex = 0;
        if (segIndex >= cvLines[lineIndex].length) {
          lineIndex++; segIndex = 0;
          setTimeout(tick, linePause);
        } else {
          setTimeout(tick, charDelay);
        }
      }
      tick();
    }

    function restart() {
      if (cancelled) return;
      termCode.innerHTML = "";
      setTimeout(runTyping, 500);
    }

    if (reducedMotion) { renderInstant(); }
    else { runTyping(); }
    window.addEventListener("pagehide", function () { cancelled = true; });
  }

  /* ---- contact form ----
     Paste your Formspree form ID below (the part after /f/ in https://formspree.io/f/xxxxxxxx).
     While it is empty, the form falls back to opening the visitor's email app. */
  var FORMSPREE_ID = "xaeqjvon";
  var TO = "shakyanitish55@gmail.com";
  var form = document.getElementById("contact-form");
  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector("button[type=submit]");

  function say(msg) { statusEl.classList.add("show"); statusEl.textContent = msg; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var name = form.querySelector("#name").value.trim();
    var email = form.querySelector("#email").value.trim();
    var message = form.querySelector("#message").value.trim();

    if (!FORMSPREE_ID) {
      var body = message + "\n\n— " + name + " (" + email + ")";
      say("Opening your email app… if nothing happens, write to " + TO + " directly.");
      form.reset();
      window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent("Portfolio enquiry from " + name) + "&body=" + encodeURIComponent(body);
      return;
    }

    submitBtn.disabled = true;
    say("Sending…");
    var data = new FormData(form);
    data.set("name", name);
    data.set("email", email);
    data.set("message", message);
    data.append("_subject", "Portfolio enquiry from " + name);

    fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          return { ok: res.ok, status: res.status, body: json };
        });
      })
      .then(function (result) {
        if (result.ok) {
          form.reset();
          say("Thanks! Your message has been sent — I'll reply soon.");
          return;
        }
        var errors = result.body && result.body.errors;
        var detail = errors && errors[0] && errors[0].message;
        say("Message not sent (" + result.status + ")" + (detail ? ": " + detail : "") + ". Email me directly at " + TO + ".");
      })
      .catch(function () { say("Network error. Please email me directly at " + TO + "."); })
      .then(function () { submitBtn.disabled = false; });
  });

  /* ---- footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- timeline durations (auto) ---- */
  document.querySelectorAll('.timeline-period[data-start]').forEach(function(expEl) {
    var startStr = expEl.dataset.start;
    if (!startStr) return;
    var start = new Date(startStr + "T00:00:00");
    var now = new Date();

    var totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) {
      totalMonths--;
    }
    if (totalMonths < 0) totalMonths = 0;

    var years = Math.floor(totalMonths / 12);
    var months = totalMonths % 12;

    var parts = [];
    if (years > 0) parts.push(years + (years === 1 ? " year" : " years"));
    if (months > 0) parts.push(months + (months === 1 ? " month" : " months"));
    if (parts.length === 0) parts.push("Less than a month");

    var prefix = expEl.dataset.prefix;
    if (prefix) {
      expEl.textContent = prefix + " · " + parts.join(" ");
    } else {
      expEl.textContent = parts.join(" ");
    }
  });

  /* ---- hero experience duration (auto) ---- */
  var heroExp = document.getElementById("hero-exp");
  if (heroExp) {
    var start = new Date("2025-10-27T00:00:00");
    var now = new Date();

    var totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) {
      totalMonths--;
    }
    if (totalMonths < 0) totalMonths = 0;

    var years = Math.floor(totalMonths / 12);
    var months = totalMonths % 12;

    var parts = [];
    if (years > 0) parts.push(years + (years === 1 ? " year" : " years"));
    if (months > 0) parts.push(months + (months === 1 ? " month" : " months"));
    if (parts.length === 0) parts.push("less than a month");

    heroExp.textContent = parts.join(" ");
  }
})();
