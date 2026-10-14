/*
  theme-init.js: applies the visitor's saved day or night choice before the
  page appears, so the page does not flash the wrong colors.

  Nothing to edit here. The theme colors live in assets/css/tokens.css.
  This file is loaded at the top of every page, before the CSS.
*/
(function () {
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {
    /* Private browsing can block storage. The page then follows the computer's setting. */
  }
})();
