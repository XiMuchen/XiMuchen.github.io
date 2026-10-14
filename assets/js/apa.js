/*
  apa.js: writes an APA 7 reference for one BibTeX entry.
  Needs bibtex.js to be loaded first.

  Nothing to edit here. Titles are used exactly as written in the .bib file
  (sentence case), so fix capitalization there, not here.

  Gives other scripts:
    APA.format(entry, options) -> { html, text }
      options.isSelf(person) -> true to show that author in bold (website only)
    APA.authorsHtml(entry, options) -> just the author list, as HTML
*/
var APA = (function () {
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function get(entry, name) { return Bib.clean(entry.fields[name] || ""); }

  // Adds a period unless the text already ends in . ? or !
  function stop(s) { return /[.?!]$/.test(s) ? s : s + "."; }

  // "Joshua James" -> "J. J."   "Jean-Paul" -> "J.-P."   "E. L." stays "E. L."
  function initials(first) {
    if (!first) return "";
    return first.split(/\s+/).filter(Boolean).map(function (word) {
      return word.split("-").map(function (part) {
        var letter = part.replace(/[^A-Za-zÀ-ɏ]/g, "").charAt(0);
        return letter ? letter.toUpperCase() + "." : "";
      }).filter(Boolean).join("-");
    }).filter(Boolean).join(" ");
  }

  // Author style: "Vail, K. E., III"
  function asAuthor(p) {
    if (p.group) return p.group;
    var s = p.last;
    var i = initials(p.first);
    if (i) s += ", " + i;
    if (p.suffix) s += ", " + p.suffix;
    return s;
  }
  // Editor style: "K. E. Vail III"
  function asEditor(p) {
    if (p.group) return p.group;
    var i = initials(p.first);
    return (i ? i + " " : "") + p.last + (p.suffix ? " " + p.suffix : "");
  }

  function mark(p, text, options) {
    var t = esc(text);
    return options && options.isSelf && options.isSelf(p) ? "<strong>" + t + "</strong>" : t;
  }

  // APA author list: 1, 2, up to 20 in full; 21 or more: first 19, ". . .", last.
  function authorList(people, options) {
    var shown = people.map(function (p) { return mark(p, asAuthor(p), options); });
    var n = shown.length;
    if (n === 0) return "";
    if (n === 1) return shown[0];
    if (n === 2) return shown[0] + ", &amp; " + shown[1];
    if (n <= 20) return shown.slice(0, -1).join(", ") + ", &amp; " + shown[n - 1];
    return shown.slice(0, 19).join(", ") + ", . . . " + shown[n - 1];
  }

  function editorList(people) {
    var shown = people.map(function (p) { return esc(asEditor(p)); });
    var n = shown.length;
    if (n === 1) return shown[0];
    if (n === 2) return shown[0] + " &amp; " + shown[1];
    return shown.slice(0, -1).join(", ") + ", &amp; " + shown[n - 1];
  }

  function yearPart(entry) {
    var y = get(entry, "year");
    if (/press/i.test(y)) return "in press";
    return y || "n.d.";
  }

  function link(entry) {
    var doi = get(entry, "doi");
    if (doi) {
      doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
      return "https://doi.org/" + doi;
    }
    return get(entry, "url");
  }

  // What kind of unpublished work this is, if any.
  function unpublishedKind(entry) {
    var status = get(entry, "status").toLowerCase();
    var repo = get(entry, "howpublished") || get(entry, "publisher") || get(entry, "archiveprefix");
    if (status.indexOf("prep") !== -1) return { label: "Manuscript in preparation", repo: "" };
    if (entry.type === "unpublished" || status.indexOf("review") !== -1 || status.indexOf("submitted") !== -1) {
      return repo ? { label: "Preprint", repo: repo } : { label: "Manuscript submitted for publication", repo: "" };
    }
    if (entry.type === "misc" && repo) return { label: "Preprint", repo: repo };
    return null;
  }

  // Volume(issue), pages or Article number
  function locator(entry) {
    var s = "";
    var vol = get(entry, "volume"), num = get(entry, "number"), pages = get(entry, "pages"), eid = get(entry, "eid");
    if (vol) s += ", <i>" + esc(vol) + "</i>";
    if (num) s += vol ? "(" + esc(num) + ")" : ", (" + esc(num) + ")";
    if (pages) s += ", " + esc(pages);
    else if (eid) s += ", Article " + esc(eid);
    return s;
  }

  // The part after the title: journal, book, publisher, and so on.
  function source(entry, title) {
    var t = entry.type;
    var italicTitle = "<i>" + esc(stop(title)) + "</i>";
    var plainTitle = esc(stop(title));
    var kind = unpublishedKind(entry);

    if (kind) {
      var bracket = "<i>" + esc(title) + "</i> [" + kind.label + "].";
      return { title: bracket, rest: kind.repo ? esc(stop(kind.repo)) : "" };
    }
    if (t === "article") {
      var journal = get(entry, "journal");
      return { title: plainTitle, rest: journal ? "<i>" + esc(journal) + "</i>" + locator(entry) + "." : "" };
    }
    if (t === "incollection" || t === "inbook" || (t === "inproceedings" && !get(entry, "volume"))) {
      var editors = Bib.names(entry.fields.editor);
      var book = get(entry, "booktitle");
      var pages = get(entry, "pages");
      var parts = "";
      if (editors.length) parts += "In " + editorList(editors) + (editors.length > 1 ? " (Eds.), " : " (Ed.), ");
      else if (book) parts += "In ";
      if (book) parts += "<i>" + esc(book) + "</i>";
      if (pages) parts += " (pp. " + esc(pages) + ")";
      parts = parts ? stop(parts) : "";
      var pub = get(entry, "publisher");
      return { title: plainTitle, rest: parts + (pub ? (parts ? " " : "") + esc(stop(pub)) : "") };
    }
    if (t === "inproceedings") {   // published proceedings with a volume, cited like a journal
      return { title: plainTitle, rest: "<i>" + esc(get(entry, "booktitle")) + "</i>" + locator(entry) + "." };
    }
    if (t === "phdthesis" || t === "mastersthesis") {
      var label = t === "phdthesis" ? "Doctoral dissertation" : "Master's thesis";
      var school = get(entry, "school");
      return { title: "<i>" + esc(title) + "</i> [" + label + (school ? ", " + esc(school) : "") + "].", rest: esc(get(entry, "publisher") ? stop(get(entry, "publisher")) : "") };
    }
    // book, misc, and anything else: italic title, then publisher
    var publisher = get(entry, "publisher") || get(entry, "howpublished");
    return { title: italicTitle, rest: publisher ? esc(stop(publisher)) : "" };
  }

  function format(entry, options) {
    var people = Bib.names(entry.fields.author);
    var title = get(entry, "title") || "[Untitled]";
    var src = source(entry, title);
    var date = "(" + esc(yearPart(entry)) + ").";
    var url = link(entry);
    var pieces;

    if (people.length) {
      pieces = [stop(authorList(people, options)), date, src.title, src.rest];
    } else {
      pieces = [src.title, date, src.rest];   // no author: the title moves to the front
    }
    var html = pieces.filter(Boolean).join(" ");
    if (url) html += ' <a href="' + esc(url) + '">' + esc(url) + "</a>";
    var text = html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    return { html: html, text: text };
  }

  function authorsHtml(entry, options) {
    return authorList(Bib.names(entry.fields.author), options);
  }

  return { format: format, authorsHtml: authorsHtml, initials: initials };
})();
