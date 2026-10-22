"""Build one paste-in block per page for a GoHighLevel Custom Code element.

GHL's Custom Code element takes HTML, CSS and JavaScript together, so each
output file holds the page's <body> markup with styles.css and main.js inlined.

    python3 ghl/build.py index.html      # writes ghl/home.html
    python3 ghl/build.py                 # every page

Links between pages are rewritten to GHL page paths (about.html -> /about),
and photos point at their Unsplash originals because GHL can't serve the
repo's assets/ folder.
"""
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'ghl')

PAGES = {
    'index.html': 'home',
    'end-of-lease-cleaning-perth.html': 'end-of-lease-cleaning-perth',
    'regular-house-cleaning-perth.html': 'regular-house-cleaning-perth',
    'office-cleaning-perth.html': 'office-cleaning-perth',
    'carpet-deep-cleaning-perth.html': 'carpet-deep-cleaning-perth',
    'about.html': 'about',
    'contact.html': 'contact',
    'thank-you.html': 'thank-you',
    'privacy.html': 'privacy',
}

# GHL page path for each page. Must match the "Path" set on each GHL page.
PATHS = {f: '/' if f == 'index.html' else '/' + f[:-5] for f in PAGES}

UNSPLASH = {
    'eol-kitchen': 'photo-1484154218962-a197022b5858',
    'eol-bathroom': 'photo-1584622650111-993a426fbf0a',
    'eol-living': 'photo-1560448204-e02f11c3d0e2',
    'regular-living': 'photo-1600607687939-ce8a6c25118c',
    'regular-kitchen': 'photo-1556911220-bff31c812dba',
    'regular-bathroom': 'photo-1620626011761-996317b8d101',
    'office-desks': 'photo-1462826303086-329426d1aef5',
    'office-kitchen': 'photo-1497366216548-37526070297c',
    'office-reception': 'photo-1524758631624-e2822e304c36',
    'carpet-closeup': 'photo-1600166898405-da9535204843',
    'carpet-room': 'photo-1600121848594-d8644e57abab',
    'carpet-stain': 'photo-1527515637462-cff94eecc1ac',
    'about-home': 'photo-1554995207-c18c203602cb',
}


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def photo_url(match):
    return ('https://images.unsplash.com/%s?w=1200&h=800&fit=crop&auto=format&q=75'
            % UNSPLASH[match.group(1)])


def svg_data_uri(name):
    return 'data:image/svg+xml;base64,' + base64.b64encode(read('assets/img/' + name).encode()).decode()


def rewrite_links(html):
    def repl(match):
        attr, page, rest = match.group(1), match.group(2), match.group(3) or ''
        return '%s="%s%s"' % (attr, PATHS[page], rest)
    pattern = r'(href|action)="(%s)([?#][^"]*)?"' % '|'.join(re.escape(p) for p in PAGES)
    return re.sub(pattern, repl, html)


def strip_css_comments(css):
    # Keep the brand-colour comments in :root so the owner can still find them.
    return re.sub(r'/\*(?![^*]*\{\{)[\s\S]*?\*/', '', css)


def build(page):
    src = read(page)
    open_tag = re.search(r'<body([^>]*)>', src)
    head = src[:open_tag.start()]
    body = src[open_tag.end():src.index('</body>')]
    # GHL owns <body>, so copy the page's body attributes onto it (thank-you
    # needs data-thank-you to fire the conversion).
    body_attrs = re.findall(r'([\w-]+)(?:="([^"]*)")?', open_tag.group(1))
    title = re.search(r'<title>(.*?)</title>', head).group(1)
    ld = re.findall(r'<script type="application/ld\+json">.*?</script>', head, re.S)

    body = re.sub(r'assets/img/photos/([a-z-]+)\.jpg', photo_url, body)
    body = body.replace('assets/img/logo.svg', svg_data_uri('logo.svg'))
    body = rewrite_links(body).strip()

    css = strip_css_comments(read('assets/css/styles.css'))
    css = re.sub(r'\n\s*\n+', '\n', css).strip()
    js = read('assets/js/main.js').replace(
        "THANK_YOU_URL: 'thank-you.html'", "THANK_YOU_URL: '%s'" % PATHS['thank-you.html'])

    parts = [
        '<!-- All Reliable Cleaning: %s -->' % title,
        '<!-- Paste into a GHL Custom Code element (full width, no section padding). -->',
        "<script>document.documentElement.classList.add('js')%s</script>" % ''.join(
            ";document.body.classList.add('%s')" % v if k == 'class' else
            ";document.body.setAttribute('%s','%s')" % (k, v) for k, v in body_attrs),
        '<style>',
        GHL_CSS,
        css,
        '</style>',
        body,
    ]
    parts += ld
    parts += ['<script>', js.strip(), '</script>', '']
    # GHL reads {{ }} as its own merge fields, so unfilled placeholders use [[ ]].
    parts = [x.replace('{{', '[[').replace('}}', ']]') for x in parts]

    name = PAGES[page] + '.html'
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        f.write('\n'.join(parts))
    print('ghl/%s  %d KB' % (name, len('\n'.join(parts).encode()) // 1024))


# GHL wraps Custom Code in its own section/row/column with padding and a
# max width. These rules let the site run edge to edge and use its own font.
GHL_CSS = """/* GHL wrapper reset */
.c-custom-code, .c-custom-code > div, [class*="custom-code"] { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; }
.c-section:has(.c-custom-code), .c-row:has(.c-custom-code), .c-column:has(.c-custom-code), .c-section:has(.c-custom-code) .inner, .c-row:has(.c-custom-code) .inner, .c-column:has(.c-custom-code) .inner { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; }"""


if __name__ == '__main__':
    for page in sys.argv[1:] or PAGES:
        build(page)
