
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---- navbar: scrolled state ---- */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 12); }
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

  /* ---- hero CV terminal: type the CV in a loop ---- */
  var termCode = document.getElementById("term-code");
  if (termCode) {
    var cvLines = [
      [{ c: "tp", t: "nitish@portfolio:~$ " }, { c: "tc", t: "whoami" }],
      [{ c: "tk", t: "Nitish Shakya" }, { c: "to", t: " — Backend Developer (PHP · Laravel)" }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "education" }],
      [{ c: "to", t: "B.Sc. CSIT · Amrit Campus, Tribhuvan University" }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "experience" }],
      [{ c: "to", t: "PHP & Laravel Developer (1 yr) · Longtail E-Media" }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "skills" }],
      [{ c: "to", t: "PHP  Laravel  MySQL  Python  Django  Express  MongoDB" }],
      [{ c: "to", t: "React  REST APIs  TensorFlow  OpenCV" }],
      [{ c: "tp", t: "$ " }, { c: "tc", t: "projects" }],
      [{ c: "to", t: "Brain-Tumor-CNN  MediaPipe-Vision  Nepali-Chatbot" }],
      [{ c: "to", t: "Django-CMS  Developer-Portfolio" }]
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
      window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent("Portfolio enquiry from " + name) + "&body=" + encodeURIComponent(body);
      say("Opening your email app… if nothing happens, write to " + TO + " directly.");
      return;
    }

    submitBtn.disabled = true;
    say("Sending…");
    fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, message: message })
    })
      .then(function (res) {
        if (res.ok) { say("Thanks! Your message has been sent — I'll reply soon."); form.reset(); }
        else { say("Something went wrong. Please email me directly at " + TO + "."); }
      })
      .catch(function () { say("Network error. Please email me directly at " + TO + "."); })
      .then(function () { submitBtn.disabled = false; });
  });

  /* ---- footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- experience duration (auto) ---- */
  var expEl = document.getElementById("exp-duration");
  if (expEl && expEl.dataset.start) {
    var startStr = expEl.dataset.start;
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

    expEl.textContent = "Internship · " + parts.join(" ");
  }
})();
