/*
  bibtex.js: reads a BibTeX file (content/publications.bib) and turns each
  entry into a JavaScript object. Written for this site; no outside library.

  Nothing to edit here. To add or change a paper, edit content/publications.bib.

  Gives other scripts:
    Bib.parse(text)            -> list of entries
    Bib.clean(value)           -> plain text for display (removes {braces}, \& and so on)
    Bib.names(value)           -> list of people { last, first, suffix, group }
    Bib.toBibtex(entry)        -> the entry as written, minus the site-only fields
    Bib.SITE_FIELDS            -> the site-only fields that are never copied
*/
var Bib = (function () {
  // Fields that control the website only. They are removed from copied BibTeX.
  var SITE_FIELDS = ["selected", "pdf", "code", "data", "osf", "preprint", "status",
    "theme", "note_web", "project"];

  // ----- Reading the file -----
  function parse(text) {
    var entries = [];
    var i = 0;
    while ((i = text.indexOf("@", i)) !== -1) {
      var open = text.indexOf("{", i);
      if (open === -1) break;
      var type = text.slice(i + 1, open).trim().toLowerCase();
      var close = matchBrace(text, open);
      if (close === -1) break;
      if (type !== "comment" && type !== "string" && type !== "preamble") {
        var entry = parseBody(type, text.slice(open + 1, close));
        if (entry) entries.push(entry);
      }
      i = close + 1;
    }
    return entries;
  }

  // Finds the brace that closes the one at position `open`.
  function matchBrace(text, open) {
    var depth = 0;
    for (var j = open; j < text.length; j++) {
      if (text[j] === "\\") { j++; continue; }
      if (text[j] === "{") depth++;
      else if (text[j] === "}" && --depth === 0) return j;
    }
    return -1;
  }

  function parseBody(type, body) {
    var comma = body.indexOf(",");
    if (comma === -1) return null;
    var entry = { type: type, key: body.slice(0, comma).trim(), fields: {}, raw: [] };
    var rest = body.slice(comma + 1);
    var pos = 0;
    while (pos < rest.length) {
      var m = /^\s*,?\s*([A-Za-z_][\w:-]*)\s*=\s*/.exec(rest.slice(pos));
      if (!m) break;
      var name = m[1].toLowerCase();
      var start = pos + m[0].length;
      var end = readValue(rest, start);
      var value = rest.slice(start, end).trim();
      entry.fields[name] = stripOuter(value);
      entry.raw.push({ name: name, text: m[1] + " = " + value });
      pos = end;
    }
    return entry;
  }

  // A value is {braced}, "quoted", or a bare word or number.
  function readValue(s, start) {
    var c = s[start];
    if (c === "{") return matchBrace(s, start) + 1;
    if (c === '"') {
      var depth = 0;
      for (var j = start + 1; j < s.length; j++) {
        if (s[j] === "{") depth++;
        else if (s[j] === "}") depth--;
        else if (s[j] === '"' && depth === 0) return j + 1;
      }
      return s.length;
    }
    var m = /^[^,}\n]*/.exec(s.slice(start));
    return start + m[0].length;
  }

  function stripOuter(value) {
    if ((value[0] === "{" && value[value.length - 1] === "}") ||
        (value[0] === '"' && value[value.length - 1] === '"')) {
      return value.slice(1, -1);
    }
    return value;
  }

  // ----- Cleaning text for display -----
  var ACCENTS = { "'": "́", "`": "̀", "^": "̂", '"': "̈", "~": "̃", "=": "̄", ".": "̇", "c": "̧", "v": "̌", "u": "̆", "H": "̋" };

  function clean(value) {
    if (value == null) return "";
    var s = String(value);
    // Accents such as {\"o}, \'e, \c{c}
    s = s.replace(/\\([`'^"~=.]|[cvuH](?=[{\s]))\s*\{?\\?([A-Za-z])\}?/g, function (all, mark, letter) {
      return (letter + ACCENTS[mark]).normalize("NFC");
    });
    s = s.replace(/\\ss\b/g, "ß").replace(/\\o\b/g, "ø").replace(/\\O\b/g, "Ø")
      .replace(/\\ae\b/g, "æ").replace(/\\l\b/g, "ł").replace(/\\i\b/g, "i");
    s = s.replace(/\\(?:ldots|dots)\b\s?/g, "\u2026");
    s = s.replace(/\\([&%$#_{}])/g, "$1");
    s = s.replace(/---/g, "—").replace(/--/g, "–");
    s = s.replace(/~/g, " ");
    s = s.replace(/\\(?:textit|emph|textbf|mathrm|text)\s*/g, "");
    s = s.replace(/[{}]/g, "");
    return s.replace(/\s+/g, " ").trim();
  }

  // ----- People: "Last, First", "First Last", "Last, Jr, First", {Group Name} -----
  function splitTop(s, separator) {
    var parts = [], depth = 0, last = 0;
    var re = separator;
    for (var j = 0; j < s.length; j++) {
      if (s[j] === "{") depth++;
      else if (s[j] === "}") depth--;
      else if (depth === 0) {
        var m = re.exec(s.slice(j));
        if (m && m.index === 0) {
          parts.push(s.slice(last, j));
          j += m[0].length - 1;
          last = j + 1;
        }
      }
    }
    parts.push(s.slice(last));
    return parts.map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function names(value) {
    if (!value) return [];
    return splitTop(value, /^\s+and\s+/i).map(function (raw) {
      if (raw[0] === "{" && matchBrace(raw, 0) === raw.length - 1) {
        return { group: clean(raw) };                        // {World Health Organization}
      }
      var parts = splitTop(raw, /^,/);
      if (parts.length === 3) return { last: clean(parts[0]), suffix: clean(parts[1]), first: clean(parts[2]) };
      if (parts.length === 2) return { last: clean(parts[0]), first: clean(parts[1]) };
      var words = splitTop(raw, /^\s+/);
      if (words.length === 1) return { last: clean(words[0]), first: "" };
      return { last: clean(words.pop()), first: clean(words.join(" ")) };
    });
  }

  // ----- Copying BibTeX: as written, without the site-only fields -----
  function toBibtex(entry) {
    var kept = entry.raw.filter(function (f) { return SITE_FIELDS.indexOf(f.name) === -1; });
    return "@" + entry.type + "{" + entry.key + ",\n" +
      kept.map(function (f) { return "  " + f.text; }).join(",\n") + "\n}";
  }

  return { parse: parse, clean: clean, names: names, toBibtex: toBibtex, SITE_FIELDS: SITE_FIELDS };
})();
