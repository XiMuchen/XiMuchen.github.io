/*
  news.js: shows the latest items from content/news.json in the
  "Recent updates" list on the home page.

  Nothing to edit here. To add an update, edit content/news.json.
  To show more or fewer items, change "show_on_home" in that file.
  While there are no items, the Recent updates section is hidden.
*/
(function () {
  var list = document.getElementById("news-list");
  if (!list || !window.site) return;

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  // "2026-10" becomes "October 2026"; "2026-10-05" becomes "October 5, 2026".
  function niceDate(text) {
    var parts = String(text).split("-");
    var month = MONTHS[Number(parts[1]) - 1];
    if (!month) return text;
    return parts[2] ? month + " " + Number(parts[2]) + ", " + parts[0] : month + " " + parts[0];
  }

  window.site.then(function (site) {
    return fetch(site.root + "content/news.json")
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load content/news.json");
        return response.json();
      })
      .then(function (news) {
        var esc = site.esc;
        var items = (news.items || []).slice(0, news.show_on_home || 4);
        if (!items.length) {                 // no updates yet: hide the whole section
          var section = list.closest("section");
          if (section) section.hidden = true;
          return;
        }
        list.innerHTML = items.map(function (item) {
          var text = esc(item.text);
          if (item.link) text = '<a href="' + esc(item.link) + '">' + text + "</a>";
          return '<li class="news"><time class="news__date" datetime="' + esc(item.date) + '">' +
            esc(niceDate(item.date)) + "</time><p>" + text + "</p></li>";
        }).join("");
      });
  }).catch(function (error) {
    console.warn(error.message);
  });
})();
