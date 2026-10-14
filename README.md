# How to update my site

This is the source for **https://ximuchen.github.io**. It is plain HTML, CSS, and
JavaScript: no build step, nothing to install. Edit a file, save it, publish it.

## Where things live

| I want to change… | Edit this file |
|---|---|
| Name, job title, email, menu, footer links | `content/site.json` |
| Home page text (About, Interests, Education, research blurbs) | `index.html` (look for `EDIT HERE`) |
| Research page introductions | `research.html` (look for `EDIT HERE`) |
| Research projects, their summaries and figures | `content/projects.json` |
| Papers (all lists and Cite boxes) | `content/publications.bib` |
| Tools and datasets | `content/tools.json` |
| Recent updates on the home page | `content/news.json` |
| Colors, fonts, sizes | `assets/css/tokens.css` |
| CV | replace `files/cv.pdf` |
| Photo | replace `assets/img/muchen-xi.jpg` |
| Icons | `assets/img/icons.svg` |

Every file starts with a short note saying what it does and what is safe to edit.

## Preview on my computer

1. Open Terminal in this folder (in VS Code: Terminal → New Terminal).
2. Run: `python3 -m http.server 8000`
3. Open **http://localhost:8000** in a browser. Press Ctrl+C in Terminal to stop.

Always preview this way. If you double-click `index.html` instead, the lists
(papers, projects, tools) will not load, because browsers block that for files
opened directly.

## Add a paper

Open `content/publications.bib`, copy an existing entry, paste it at the top of
its group, and change the values. Write titles in sentence case; they appear
exactly as written. Extra fields that only control the website:

- `selected = {true}`: also show it on the home page
- `status = {under review}` or `status = {in preparation}`: leave out once published
- `theme = {dynamics}`, `{measurement}`, or `{ai}`: the research area
- `preprint`, `pdf`, `code`, `data`, `osf`: links (only add `pdf` if you may share it)

These fields are removed automatically when visitors copy the BibTeX.

## Add a research project, tool, or dataset

Open `content/projects.json` or `content/tools.json`, copy one block (from `{`
to `},`), paste it, and change the values. Instructions are at the top of each
file. In `tools.json`, `"type": "tool"` or `"type": "data"` picks the section.

**JSON is strict:** keep the quotes, and put a comma between blocks but not
after the last one. If a list disappears after an edit, paste the file into
https://jsonlint.com to find the mistake.

## Add a recent update

In `content/news.json`, add an item at the top of `items`, shaped like
`_example`. The section stays hidden while the list is empty.

## Change colors or fonts

All colors are in `assets/css/tokens.css`: the day theme first, then the night
theme twice (change both copies). The font is Bricolage Grotesque, stored in
`assets/fonts/`.

## Give a tool its own page

Make a folder `tools/<tool-name>/` with an `index.html` inside (copy
`tools/index.html` as a starting point), then add `"page": "tools/<tool-name>/index.html"`
to that tool in `content/tools.json`. GitHub Pages cannot run a server or store
data, so a tool that needs to save responses needs an outside service.

## Check the citations still work

Open **http://localhost:8000/tests/citations.html** while previewing. Every row
should say "pass".

## Publish changes

Open Terminal in this folder and run:

```
git add -A
git commit -m "Describe the change in a few words"
git push
```

GitHub rebuilds the site in about a minute. Before pushing, `git status` lists
every file that will become public. The `_private/` folder is never published.
