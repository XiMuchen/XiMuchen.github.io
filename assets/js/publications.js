/*
  publications.js: shows papers from content/publications.bib on any page
  that has one of these empty lists:
    <ol id="pub-published">, <ol id="pub-review">, <ol id="pub-prep">  (Publications page)
    <ol id="selected-pubs">                                            (home page)
    <ol data-pubs-theme="dynamics">                                    (Research page)
  Each paper gets its links and a Cite box (APA 7 and BibTeX, with Copy buttons).

  Nothing to edit here. To add or change a paper, edit content/publications.bib.
  Needs bibtex.js, apa.js, and site.js to be loaded first.
*/
(function () {
  if (!window.site) return;
  var lists = document.querySelectorAll("#pub-published, #pub-review, #pub-prep, #selected-pubs, [data-pubs-theme]");
  if (!lists.length) return;

  var counter = 0;

  function statusOf(entry) {
    var s = Bib.clean(entry.fields.status).toLowerCase();
    if (s.indexOf("prep") !== -1) return "prep";
    if (s) return "review";
    return "published";
  }

  // Newest first; papers without a year go last.
  function byYear(a, b) {
    return (parseInt(Bib.clean(b.fields.year), 10) || 0) - (parseInt(Bib.clean(a.fields.year), 10) || 0);
  }

  function venue(entry, esc) {
    var f = function (name) { return Bib.clean(entry.fields[name] || ""); };
    var status = statusOf(entry);
    if (status === "prep") return "Manuscript in preparation.";
    if (status === "review") {
      var repo = f("howpublished");
      return repo ? "Preprint on " + esc(repo) + ". Under review." : "Under review.";
    }
    if (entry.type === "article") {
      var vol = f("volume") ? ", " + esc(f("volume")) + (f("number") ? "(" + esc(f("number")) + ")" : "") : "";
      return "<i>" + esc(f("journal")) + "</i>" + vol + ".";
    }
    if (entry.type === "incollection" || entry.type === "inbook") {
      return "Chapter in <i>" + esc(f("booktitle")) + "</i>" + (f("publisher") ? ", " + esc(f("publisher")) : "") + ".";
    }
    if (entry.type === "inproceedings") return "<i>" + esc(f("booktitle")) + "</i>" + (f("volume") ? ", " + esc(f("volume")) : "") + ".";
    return esc(f("howpublished") || f("publisher") || f("school"));
  }

  // Adds a period after the author list unless it already ends with one ("J. J.")
  function endStop(html) {
    return /\.(<\/strong>)?$/.test(html) ? html : html + ".";
  }

  function linkItem(href, label, iconName, icon, esc) {
    return '<li><a href="' + esc(href) + '">' + icon(iconName) + esc(label) + "</a></li>";
  }

  function citeBox(entry, apa, esc, icon) {
    var id = "cite-" + (++counter);
    return '<li><details class="cite">' +
      "<summary>" + icon("cite") + "Cite</summary>" +
      '<div class="cite__panel">' +
      '<p class="cite__label">APA 7</p>' +
      '<p class="cite__apa" id="' + id + '-apa">' + apa.html + "</p>" +
      '<button class="button cite__copy" type="button" data-copy="' + id + '-apa">Copy APA</button>' +
      '<p class="cite__label">BibTeX</p>' +
      '<pre class="cite__bib" id="' + id + '-bib">' + esc(Bib.toBibtex(entry)) + "</pre>" +
      '<button class="button cite__copy" type="button" data-copy="' + id + '-bib">Copy BibTeX</button>' +
      '<span class="visually-hidden" aria-live="polite"></span>' +
      "</div></details></li>";
  }

  function item(entry, site) {
    var esc = site.esc, icon = site.icon, root = site.root;
    var self = (site.data && site.data.self) || {};
    var isSelf = function (p) {
      return p.last === self.last && APA.initials(p.first).charAt(0) === self.first_initial;
    };
    var f = function (name) { return Bib.clean(entry.fields[name] || ""); };
    var status = statusOf(entry);
    var apa = APA.format(entry);   // the copy version, without bold
    var year = status === "prep" ? "In prep" : (f("year") || "n.d.");

    var links = "";
    if (status !== "prep") {
      if (f("doi")) links += linkItem("https://doi.org/" + f("doi").replace(/^https?:\/\/(dx\.)?doi\.org\//, ""), status === "review" ? "Preprint" : "DOI", status === "review" ? "preprint" : "paper", icon, esc);
      else if (f("url") && status === "review") links += linkItem(f("url"), "Preprint", "preprint", icon, esc);
      else if (f("url")) links += linkItem(f("url"), "Paper", "paper", icon, esc);
      if (f("preprint") && status !== "review" && f("preprint") !== f("url")) links += linkItem(f("preprint"), "Preprint", "preprint", icon, esc);
      if (f("pdf")) links += linkItem(root + f("pdf"), "PDF", "download", icon, esc);
      if (f("code")) links += linkItem(f("code"), "Code", "code", icon, esc);
      if (f("data")) links += linkItem(f("data"), "Data", "dataset", icon, esc);
      if (f("osf")) links += linkItem(f("osf"), "OSF", "dataset", icon, esc);
      links += citeBox(entry, apa, esc, icon);
    }

    return '<li class="pub">' +
      '<span class="pub__year">' + esc(year) + "</span>" +
      "<div>" +
      '<p class="pub__title">' + esc(f("title")) + "</p>" +
      '<p class="pub__meta">' + endStop(APA.authorsHtml(entry, { isSelf: isSelf })) + " " + venue(entry, esc) +
      (f("note_web") ? " " + esc(f("note_web")) : "") + "</p>" +
      (links ? '<ul class="pub__links">' + links + "</ul>" : "") +
      "</div></li>";
  }

  // ----- Copy buttons: clipboard if available, otherwise select-and-copy -----
  function copyText(el) {
    var text = el.innerText;
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(el); });
    }
    return Promise.resolve(fallback(el));
  }
  function fallback(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    if (ok) sel.removeAllRanges();   // if copying failed, the text stays selected so it can be copied by hand
    return ok;
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy]");
    if (!button) return;
    var target = document.getElementById(button.getAttribute("data-copy"));
    var label = button.textContent;
    var live = button.parentNode.querySelector("[aria-live]");
    copyText(target).then(function (ok) {
      button.textContent = ok ? "Copied" : "Press Ctrl+C or Cmd+C to copy";
      if (live) live.textContent = ok ? "Copied to clipboard" : "Text selected. Press Control C or Command C to copy.";
      setTimeout(function () { button.textContent = label; }, 2500);
    });
  });

  // ----- Load the .bib file and fill the lists -----
  window.site.then(function (site) {
    return fetch(site.root + "content/publications.bib")
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load content/publications.bib");
        return response.text();
      })
      .then(function (text) {
        var entries = Bib.parse(text).sort(byYear);
        lists.forEach(function (list) {
          var chosen = entries.filter(function (e) {
            if (list.id === "selected-pubs") return Bib.clean(e.fields.selected) === "true";
            if (list.dataset.pubsTheme) return Bib.clean(e.fields.theme) === list.dataset.pubsTheme && statusOf(e) !== "prep";
            return "pub-" + statusOf(e) === list.id;
          });
          list.innerHTML = chosen.map(function (e) { return item(e, site); }).join("") ||
            '<li class="pub"><p>None yet.</p></li>';
        });
      });
  }).catch(function (error) {
    console.warn(error.message);
  });
})();
