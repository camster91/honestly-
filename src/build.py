#!/usr/bin/env python3
"""Compile src/theme.src.css -> assets/theme.css (Nu -> calc(N * var(--u)))."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'src' / 'theme.src.css').read_text()
out = re.sub(r'(?<![\w.#-])(-?\d+(?:\.\d+)?)u\b', lambda m: f'calc({m.group(1)} * var(--u))', src)
(root / 'assets' / 'theme.css').write_text(out)
print('built', len(out), 'bytes')
