#!/usr/bin/env python3
"""Compile CSS sources (Nu -> calc(N * var(--u))).
src/theme.src.css -> assets/theme.css
src/r3.src.css    -> assets/theme-r3.css  (Figma gap fixes, loaded after theme.css)
"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
for src_name, out_name in [('theme.src.css', 'theme.css'), ('r3.src.css', 'theme-r3.css')]:
    src = (root / 'src' / src_name).read_text()
    out = re.sub(r'(?<![\w.#-])(-?\d+(?:\.\d+)?)u\b', lambda m: f'calc({m.group(1)} * var(--u))', src)
    (root / 'assets' / out_name).write_text(out)
    print('built', out_name, len(out), 'bytes')
