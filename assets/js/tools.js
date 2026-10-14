/*
  tools.js: shows tools and datasets from content/tools.json.
    <ul id="tool-list">       items with "type": "tool" (Tools page)
    <ul id="data-list">       items with "type": "data" (Tools page)
    <ul id="featured-tools">  only items with "featured": true (home page)

  Nothing to edit here. To add or change a tool, edit content/tools.json.
  A "todo" note in that file is a reminder for you and is not shown on the page.
  Needs site.js to be loaded first.
*/
(function () {
  var tools = document.getElementById("tool-list");
  var data = document.getElementById("data-list");
  var featured = document.getElementById("featured-tools");
  if ((!tools && !data && !featured) || !window.site) return;

  function item(t, site) {
    var esc = site.esc, icon = site.icon, root = site.root;
    var links = (t.links || []).map(function (l) {
      return '<li><a href="' + esc(l.href) + '">' + icon(l.icon || "paper") + esc(l.label) + "</a></li>";
    });
    if (t.page) links.unshift('<li><a href="' + esc(root + t.page) + '">' + icon("code") + "Open the tool</a></li>");
    return '<li class="tool">' +
      '<span class="tile">' + icon(t.icon || "code") + "</span>" +
      "<div>" +
      '<h3 class="tool__name">' + esc(t.name) + "</h3>" +
      (t.kind ? '<p class="tool__kind">' + esc(t.kind) + "</p>" : "") +
      '<p class="tool__what">' + esc(t.summary || "") + "</p>" +
      (links.length ? '<ul class="pub__links">' + links.join("") + "</ul>" : "") +
      "</div></li>";
  }

  window.site.then(function (site) {
    return fetch(site.root + "content/tools.json")
      .then(function (r) {
        if (!r.ok) throw new Error("Could not load content/tools.json");
        return r.json();
      })
      .then(function (json) {
        function fill(list, keep) {
          if (!list) return;
          list.innerHTML = json.tools.filter(keep).map(function (t) { return item(t, site); }).join("") ||
            '<li class="tool"><p>None yet.</p></li>';
        }
        fill(tools, function (t) { return t.type !== "data"; });
        fill(data, function (t) { return t.type === "data"; });
        fill(featured, function (t) { return t.featured; });
      });
  }).catch(function (error) {
    console.warn(error.message);
  });
})();
