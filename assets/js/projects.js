/*
  projects.js: shows research projects from content/projects.json on the
  Research page, inside each <div data-projects="AREA"> (dynamics,
  measurement, or ai). Each project gets its figure, or an icon if it has
  no figure, and short links to its papers from content/publications.bib.

  Nothing to edit here. To add or change a project, edit content/projects.json.
  Needs bibtex.js and site.js to be loaded first.
*/
(function () {
  var areas = document.querySelectorAll("[data-projects]");
  if (!areas.length || !window.site) return;

  // "Xi & Jackson (2025)" or "Xi et al. (2026)", APA in-text style
  function shortCite(entry) {
    var people = Bib.names(entry.fields.author).map(function (p) { return p.group || p.last; });
    var who = people.length === 1 ? people[0]
      : people.length === 2 ? people[0] + " & " + people[1]
      : people[0] + " et al.";
    var status = Bib.clean(entry.fields.status).toLowerCase();
    var when = status.indexOf("prep") !== -1 ? "in preparation"
      : status ? Bib.clean(entry.fields.year) + ", preprint" : Bib.clean(entry.fields.year);
    return who + " (" + (when || "n.d.") + ")";
  }

  function paperLink(entry, root) {
    var doi = Bib.clean(entry.fields.doi || "");
    if (doi) return "https://doi.org/" + doi;
    return Bib.clean(entry.fields.url || "") || root + "publications.html";
  }

  // Text starting with "DRAFT:" is shown with a dashed outline until approved.
  function text(value, esc) {
    var s = String(value || "");
    return /^DRAFT:\s*/.test(s)
      ? '<span class="draft">' + esc(s.replace(/^DRAFT:\s*/, "")) + "</span>"
      : esc(s);
  }

  function project(p, bib, site) {
    var esc = site.esc, root = site.root;
    var papers = (p.papers || []).map(function (key) {
      var entry = bib[key];
      if (!entry) return "";
      var status = Bib.clean(entry.fields.status).toLowerCase();
      if (status.indexOf("prep") !== -1) return esc(shortCite(entry));
      return '<a href="' + esc(paperLink(entry, root)) + '">' + esc(shortCite(entry)) + "</a>";
    }).filter(Boolean);

    var head = '<h3 class="project__title">' +
      (p.figure ? "" : '<span class="tile tile--small">' + site.icon(p.icon || "paper") + "</span>") +
      esc(p.title) + "</h3>";
    var body = '<div class="project__text">' + head +
      "<p>" + text(p.summary, esc) + "</p>" +
      (papers.length ? '<p class="project__papers">' + site.icon("paper") + "<span>" + papers.join("; ") + "</span></p>" : "") +
      "</div>";

    if (!p.figure) return '<article class="project">' + body + "</article>";

    var fig = p.figure;
    return '<article class="project project--figure">' + body +
      '<figure class="project__figure">' +
      '<a href="' + esc(root + fig.src) + '"><img src="' + esc(root + fig.src) + '" alt="' + esc(fig.alt || "") + '" loading="lazy"></a>' +
      (fig.caption ? "<figcaption>" + text(fig.caption, esc) + "</figcaption>" : "") +
      "</figure></article>";
  }

  window.site.then(function (site) {
    return Promise.all([
      fetch(site.root + "content/projects.json").then(function (r) {
        if (!r.ok) throw new Error("Could not load content/projects.json");
        return r.json();
      }),
      fetch(site.root + "content/publications.bib").then(function (r) { return r.ok ? r.text() : ""; })
    ]).then(function (results) {
      var bib = {};
      Bib.parse(results[1]).forEach(function (e) { bib[e.key] = e; });
      areas.forEach(function (area) {
        var name = area.getAttribute("data-projects");
        area.innerHTML = results[0].projects
          .filter(function (p) { return p.area === name; })
          .map(function (p) { return project(p, bib, site); })
          .join("");
      });
    });
  }).catch(function (error) {
    console.warn(error.message);
  });
})();
