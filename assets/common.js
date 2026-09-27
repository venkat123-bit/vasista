(function(){
  // scroll reveal
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  document.querySelectorAll(".why-grid .reveal").forEach(function(el, i){
    el.style.transitionDelay = (i * 0.09) + "s";
  });
  if(reduceMotion || !("IntersectionObserver" in window)){
    revealEls.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.15, rootMargin:"0px 0px -40px 0px" });
    revealEls.forEach(function(el){ io.observe(el); });
  }

  // sticky nav shadow
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", function(){
    navbar.classList.toggle("scrolled", window.scrollY > 8);
  });

  // mobile nav toggle
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("mobile-panel");
  toggle.addEventListener("click", function(){
    const open = panel.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  panel.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    panel.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
})();
