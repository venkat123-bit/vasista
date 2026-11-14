/* Vasista animated-logo intro. Plays full-screen when the site opens, then fades away.
   Add as the FIRST thing inside <body>:   <script src="assets/intro-logo.js"></script>
   Needs intro-logo.jpg in the same folder. Shows once per browser session (open the site with
   ?intro=1 on the end of the address to force it again). Tap anywhere or press Skip to close. */
(function () {
  var SRC = document.currentScript ? document.currentScript.src : "";
  var BASE = SRC ? SRC.replace(/[^\/]*$/, "") : "assets/";
  var SHOW_MS = 4600;                       // how long it plays before fading out

  /* Retire the old "VASISTA / Choose Natural. Live Better. / TAP TO CONTINUE" intro (#site-intro),
     whether it is written in the page or added by another script, so only this one plays. */
  var oldCss = document.createElement("style");
  oldCss.textContent = "#site-intro{display:none!important}";
  document.head.appendChild(oldCss);
  function killOld() {
    var o = document.getElementById("site-intro");
    if (o) o.remove();
    if (document.body) document.body.classList.remove("intro-active");
  }
  killOld();
  try {
    var mo = new MutationObserver(killOld);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 6000);
  } catch (e) {}

  var force = /[?&]intro=1\b/.test(location.search);
  try { if (!force && sessionStorage.getItem("vasista-intro-seen")) return; } catch (e) {}
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches && !force) return;
  try { sessionStorage.setItem("vasista-intro-seen", "1"); } catch (e) {}

  var css =
    "#vi-root{position:fixed;inset:0;z-index:3000;overflow:hidden;" +
    "background:radial-gradient(circle at 50% 45%,#0e5a32 0%,#06301b 55%,#021509 100%);" +
    "transition:opacity .55s ease,visibility 0s .55s;opacity:1;font-family:system-ui,sans-serif}" +
    "#vi-root.vi-out{opacity:0;visibility:hidden;pointer-events:none}" +
    "#vi-root canvas{position:absolute;inset:0;width:100%;height:100%}" +
    ".vi-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;perspective:1000px}" +
    ".vi-stage{--s:min(74vw,52vh,480px);width:var(--s);height:var(--s);position:relative;transform-style:preserve-3d;transition:transform .15s}" +
    ".vi-ring,.vi-orbit,.vi-glow{position:absolute;border-radius:50%;opacity:0}" +
    ".vi-glow{inset:-18%;background:radial-gradient(circle,rgba(140,220,50,.55),transparent 65%)}" +
    ".vi-ring{inset:0;border:2px solid rgba(160,230,70,.8)}" +
    ".vi-orbit{inset:-7%;border:2px dashed rgba(190,240,110,.7)}" +
    ".vi-logo{position:absolute;inset:0;border-radius:50%;overflow:hidden;opacity:0;box-shadow:0 0 60px rgba(120,200,40,.45)}" +
    ".vi-logo img{position:absolute;width:103%;height:auto;left:-1.5%;top:-1%;max-width:none}" +
    ".vi-logo::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.9) 50%,transparent 62%);transform:translateX(-130%)}" +
    ".vi-play .vi-logo{animation:vi-spin 2s cubic-bezier(.17,.9,.25,1.1) forwards,vi-breathe 3.5s ease-in-out 2.4s infinite}" +
    ".vi-play .vi-logo::after{animation:vi-shine 1.3s ease-in-out 2s forwards}" +
    ".vi-play .vi-glow{animation:vi-glow 3.5s ease-in-out 1.4s infinite}" +
    ".vi-play .vi-orbit{animation:vi-orbitin .8s ease 1.8s forwards,vi-rot 14s linear 1.8s infinite}" +
    ".vi-play .vi-ring{animation:vi-pulse 2.4s ease-out 1.1s 3}" +
    ".vi-play .vi-ring.r2{animation-delay:1.7s}.vi-play .vi-ring.r3{animation-delay:2.3s}" +
    "@keyframes vi-spin{0%{opacity:0;transform:rotateY(-720deg) scale(0)}30%{opacity:1}100%{opacity:1;transform:rotateY(0) scale(1)}}" +
    "@keyframes vi-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}" +
    "@keyframes vi-shine{to{transform:translateX(130%)}}" +
    "@keyframes vi-glow{0%,100%{opacity:.15}50%{opacity:1}}" +
    "@keyframes vi-orbitin{to{opacity:1}}@keyframes vi-rot{to{rotate:360deg}}" +
    "@keyframes vi-pulse{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.9)}}" +
    ".vi-skip{position:absolute;bottom:calc(24px + env(safe-area-inset-bottom,0px));left:50%;translate:-50% 0;" +
    "font:600 14px system-ui,sans-serif;padding:10px 24px;border:1px solid rgba(255,255,255,.4);border-radius:99px;" +
    "background:rgba(255,255,255,.1);color:#fff;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}" +
    "body.vi-lock{overflow:hidden}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var root = document.createElement("div");
  root.id = "vi-root";
  root.setAttribute("role", "presentation");
  root.innerHTML =
    '<canvas id="vi-c"></canvas>' +
    '<div class="vi-wrap"><div class="vi-stage" id="vi-s">' +
      '<div class="vi-glow"></div><div class="vi-ring"></div><div class="vi-ring r2"></div><div class="vi-ring r3"></div><div class="vi-orbit"></div>' +
      '<div class="vi-logo"><img alt="Vasista Food and Traders logo" src="' + BASE + 'intro-logo.jpg"></div>' +
    "</div></div>" +
    '<button type="button" class="vi-skip">Skip</button>';
  document.body.insertBefore(root, document.body.firstChild);
  document.body.classList.add("vi-lock");

  var c = root.querySelector("#vi-c"), x = c.getContext("2d"), s = root.querySelector("#vi-s");
  var W, H, D = Math.min(window.devicePixelRatio || 1, 2), P = [], T, raf, timers = [], done = false;
  function size() { W = innerWidth; H = innerHeight; c.width = W * D; c.height = H * D; x.setTransform(D, 0, 0, D, 0, 0); }
  addEventListener("resize", size); size();

  var cols = ["#7ed321", "#a6e22e", "#4caf1a", "#c5f06a", "#2e8b2e"];
  function leaf(p) {
    x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.globalAlpha = p.o; x.fillStyle = p.c;
    x.beginPath(); x.moveTo(0, -p.z); x.quadraticCurveTo(p.z * .8, 0, 0, p.z); x.quadraticCurveTo(-p.z * .8, 0, 0, -p.z); x.fill();
    x.strokeStyle = "rgba(0,50,10,.5)"; x.beginPath(); x.moveTo(0, -p.z); x.lineTo(0, p.z); x.stroke(); x.restore();
  }
  function add(o) {
    P.push(Object.assign({ x: W / 2, y: H / 2, vx: 0, vy: 0, a: Math.random() * 6.28, va: (Math.random() - .5) * .1,
      z: 6 + Math.random() * 10, o: 1, c: cols[Math.random() * 5 | 0], life: 1, decay: .01, sway: 0, t: Math.random() * 9 }, o));
  }
  function burst() {
    for (var i = 0; i < 70; i++) {
      var an = Math.random() * 6.28, sp = 3 + Math.random() * 9;
      add({ vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, decay: .008 + Math.random() * .008, drag: .97 });
    }
  }
  function ambient() { add({ x: Math.random() * W, y: H + 20, vy: -(.6 + Math.random() * 1.2), decay: .0015, sway: 1, z: 5 + Math.random() * 9, o: .7 }); }
  function loop() {
    if (done) return;
    x.clearRect(0, 0, W, H);
    if (T && performance.now() - T > 2200 && Math.random() < .15) ambient();
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i];
      p.t += .03; p.x += p.vx + (p.sway ? Math.sin(p.t) * .8 : 0); p.y += p.vy;
      if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
      p.a += p.va; p.life -= p.decay; p.o = Math.max(0, Math.min(p.life * 1.3, p.sway ? .7 : 1));
      if (p.life <= 0 || p.y < -30) { P.splice(i, 1); continue; }
      leaf(p);
    }
    raf = requestAnimationFrame(loop);
  }

  function tilt(e) {
    var dx = (e.clientX / W - .5) * 16, dy = (e.clientY / H - .5) * -16;
    s.style.transform = "rotateY(" + dx + "deg) rotateX(" + dy + "deg)";
  }
  addEventListener("pointermove", tilt);

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout); cancelAnimationFrame(raf);
    removeEventListener("pointermove", tilt); removeEventListener("resize", size);
    root.classList.add("vi-out");
    document.body.classList.remove("vi-lock");
    setTimeout(function () { root.remove(); style.remove(); }, 800);
  }
  root.addEventListener("click", finish);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") finish(); });

  // start once the logo is loaded (so the spin never shows an empty circle), but never wait long
  var img = root.querySelector("img"), started = false;
  function start() {
    if (started || done) return;
    started = true;
    s.classList.add("vi-play");
    T = performance.now();
    timers.push(setTimeout(burst, 900), setTimeout(burst, 1900), setTimeout(finish, SHOW_MS));
    loop();
  }
  if (img.complete) start(); else { img.addEventListener("load", start); img.addEventListener("error", finish); setTimeout(start, 1500); }
})();
