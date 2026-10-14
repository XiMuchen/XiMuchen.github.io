/*
  site.js: builds the shared header (menu) and footer on every page from
  content/site.json, and runs the day/night switch.

  You should not need to edit this file:
  - To change the menu, name, or footer links, edit content/site.json.
  - To change how the header or footer looks, edit assets/css/layout.css.

  If this script cannot run (for example, the page was opened by
  double-clicking the file instead of through the local server), each page
  keeps its own plain backup menu and footer, so every link still works.
*/
(function () {
  // The site's main folder, worked out from where this script lives
  // (assets/js/site.js is two folders below it). This keeps links working
  // whether the site is at the root of a domain or in a subfolder.
  var ROOT = new URL("../../", document.currentScript.src).href;
  var ICONS = ROOT + "assets/img/icons.svg";

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function icon(name) {
    return '<svg class="icon" aria-hidden="true" focusable="false"><use href="' +
      ICONS + "#i-" + esc(name) + '"></use></svg>';
  }

  // "/site/" and "/site/index.html" are the same page.
  function samePage(href) {
    var clean = function (p) { return p.replace(/index\.html$/, ""); };
    return clean(new URL(href, ROOT).pathname) === clean(location.pathname);
  }

  function buildHeader(site) {
    var items = site.nav.map(function (item) {
      var current = samePage(item.href) ? ' aria-current="page"' : "";
      return '<li><a href="' + esc(ROOT + item.href) + '"' + current + ">" +
        esc(item.label) + "</a></li>";
    }).join("");

    return '<div class="site-header__inner">' +
      '<a class="site-name" href="' + esc(ROOT) + 'index.html">' + esc(site.name) + "</a>" +
      '<nav class="site-nav" aria-label="Main menu"><ul>' + items + "</ul></nav>" +
      '<button class="theme-toggle" type="button"></button>' +
      "</div>";
  }

  function buildFooter(site) {
    var links = site.links.map(function (link) {
      return '<li><a href="' + esc(link.href) + '">' + icon(link.icon) +
        "<span>" + esc(link.label) + "</span></a></li>";
    }).join("");
    links += '<li><a href="' + esc(ROOT) + 'content/publications.bib">' + icon("download") +
      "<span>All publications as BibTeX</span></a></li>";

    return '<div class="site-footer__inner">' +
      '<div><p class="site-footer__name">' + esc(site.name) + "</p>" +
      '<p class="site-footer__role">' + esc(site.role) + "<br>" + esc(site.department) +
      ", " + esc(site.institution) + "</p></div>" +
      '<ul class="site-footer__links">' + links + "</ul>" +
      "</div>";
  }

  // ----- Day and night switch -----
  var dark = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || (dark.matches ? "dark" : "light");
  }

  function paintToggle(button) {
    var isDark = currentTheme() === "dark";
    var label = isDark ? "Switch to day theme" : "Switch to night theme";
    button.innerHTML = icon(isDark ? "sun" : "moon");
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function setupToggle(button) {
    paintToggle(button);
    button.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked: choice lasts for this page only */ }
      paintToggle(button);
    });
    dark.addEventListener("change", function () { paintToggle(button); });
  }

  // ----- Load site.json, then replace the backup header and footer -----
  window.site = fetch(ROOT + "content/site.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load content/site.json");
      return response.json();
    })
    .then(function (site) {
      var header = document.querySelector(".site-header");
      var footer = document.querySelector(".site-footer");
      if (header) {
        header.innerHTML = buildHeader(site);
        setupToggle(header.querySelector(".theme-toggle"));
      }
      if (footer) footer.innerHTML = buildFooter(site);
      return { data: site, root: ROOT, icon: icon, esc: esc };
    })
    .catch(function (error) {
      console.warn(error.message + ". Showing the backup menu instead.");
      return { data: null, root: ROOT, icon: icon, esc: esc };
    });
})();
