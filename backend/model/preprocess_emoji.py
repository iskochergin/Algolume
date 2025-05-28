"""
1. strip comments & blank lines
2. drop docstrings
3. drop I/O & debug statements
4. rename all user identifiers to var0, var1, ...
5. unparse back to source code
6. on SyntaxError, try to auto-wrap generator args; if still failing, return stripped code
7. NEW: treat emoji-style identifiers as ordinary names
"""

import ast
import builtins
import io
import keyword
import re
import tokenize
from token import tok_name


# ──────────────── 0) PRE-PASS: EMOJI → _emoji_k ──────────────── #

def _replace_emojis(src: str) -> str:
    """
    Collapse every run of ERRORTOKEN-ов (эмодзи, символы «So/Mn/Sk» и т.п.)
    в валидный идентификатор _emoji_<n>.  Делается до любого парсинга,
    чтобы ast.parse не валился на U+2661, ZWJ-секвенциях и т.д.
    """
    mapping, counter, out = {}, 0, []
    toks = list(tokenize.generate_tokens(io.StringIO(src).readline))
    i = 0
    while i < len(toks):
        tok = toks[i]
        if tok.type == tokenize.ERRORTOKEN and tok.string.strip():
            start = tok
            name = tok.string
            j = i + 1
            # склеиваем непрерывные ERRORTOKEN без пробелов
            while (j < len(toks) and toks[j].type == tokenize.ERRORTOKEN
                   and toks[j].start[0] == toks[j - 1].end[0]
                   and toks[j].start[1] == toks[j - 1].end[1]):
                name += toks[j].string
                j += 1
            ident = mapping.setdefault(name, f"_emoji_{counter}")
            if ident == f"_emoji_{counter}":
                counter += 1
            new_tok = tokenize.TokenInfo(
                tokenize.NAME, ident, start.start, toks[j - 1].end, start.line
            )
            out.append(new_tok)
            i = j
        else:
            out.append(tok)
            i += 1
    return tokenize.untokenize(out)


# ───────────────────────── 1) LEXICAL STRIP ───────────────────────── #

def _remove_comments_blanks(src: str) -> str:
    out, prev_row = [], -2
    for tok in tokenize.generate_tokens(io.StringIO(src).readline):
        ttype, tstr, (row, _), _, _ = tok
        if ttype == tokenize.COMMENT:
            continue
        if ttype == tokenize.NL:           # пустые строки
            continue
        out.append(tok)
    return tokenize.untokenize(out)


# ─────────────────────── 2) AST CLEAN-UP PASSES ───────────────────── #

class _DocstringRemover(ast.NodeTransformer):
    def _strip(self, node):
        if (node.body and isinstance(node.body[0], ast.Expr)
                and isinstance(node.body[0].value, ast.Constant)
                and isinstance(node.body[0].value.value, str)):
            node.body.pop(0)
        return node
    visit_FunctionDef = visit_AsyncFunctionDef = visit_ClassDef = _strip
    def visit_Module(self, node):
        self.generic_visit(node)
        return self._strip(node)


class _IOremover(ast.NodeTransformer):
    _IO_FUNCS = {"print", "input"}
    _LOG_MODS = {"logging", "pdb", "ipdb"}

    def visit_Expr(self, node):
        if isinstance(node.value, ast.Call):
            fn = node.value.func
            if isinstance(fn, ast.Name) and fn.id in self._IO_FUNCS:
                return None
            if (isinstance(fn, ast.Attribute) and isinstance(fn.value, ast.Name)
                    and fn.value.id in self._LOG_MODS):
                return None
        return self.generic_visit(node)

    def visit_Import(self, node):
        if any(alias.name in self._LOG_MODS for alias in node.names):
            return None
        return node


# ───────────────────── 3) ИМПОРТЫ + КАНОН РЕНЕЙМА ─────────────────── #

class _ImportCollector(ast.NodeVisitor):
    def __init__(self):
        self.imported = set()
    def visit_Import(self, node):
        for a in node.names:
            alias = a.asname or a.name.split('.')[0]
            if not alias.startswith("_emoji_"):     # НЕ считаем псевдо-эмодзи «импортом»
                self.imported.add(alias)
        self.generic_visit(node)
    def visit_ImportFrom(self, node):
        for a in node.names:
            if a.name != '*':
                alias = a.asname or a.name
                if not alias.startswith("_emoji_"):
                    self.imported.add(alias)
        self.generic_visit(node)


class _Renamer(ast.NodeTransformer):
    def __init__(self, imported):
        self.imported = imported
        self.builtins = set(dir(builtins))
        self.kw = set(keyword.kwlist)
        self.map, self.counter = {}, 0

    # --- helpers ---------------------------------------------------- #
    def _is_user(self, name):
        return (name not in self.imported and
                name not in self.builtins and
                name not in self.kw)

    def _canon(self, name):
        if name not in self.map:
            self.map[name] = f"var{self.counter}"
            self.counter += 1
        return self.map[name]

    # --- nodes ------------------------------------------------------ #
    def visit_Import(self, node):
        for a in node.names:
            if a.asname and self._is_user(a.asname):
                a.asname = self._canon(a.asname)
        return node
    def visit_ImportFrom(self, node):
        for a in node.names:
            if a.asname and self._is_user(a.asname):
                a.asname = self._canon(a.asname)
            elif a.name != '*' and self._is_user(a.name):
                a.name = self._canon(a.name)
        return node
    def visit_FunctionDef(self, n):
        if self._is_user(n.name): n.name = self._canon(n.name)
        self.generic_visit(n.args)
        n.body = [self.visit(b) for b in n.body];  return n
    visit_AsyncFunctionDef = visit_FunctionDef
    def visit_ClassDef(self, n):
        if self._is_user(n.name): n.name = self._canon(n.name)
        n.body = [self.visit(b) for b in n.body];  return n
    def visit_arg(self, n):
        if self._is_user(n.arg): n.arg = self._canon(n.arg)
        return n
    def visit_Name(self, n):
        if isinstance(n.ctx, (ast.Load, ast.Store, ast.Del)) and self._is_user(n.id):
            n.id = self._canon(n.id)
        return n


# ─────────────────────── 4) TOP-LEVEL DRIVER ──────────────────────── #

_GEN_FIX = re.compile(
    r'(\b[\w\.]+\s*\([^,]+,\s*)([^,()]+?\s+for\s+[^)]+?\))', re.S
)  # matches f(a, b for ...)

def preprocess_and_canonicalize(src: str) -> str:
    """Return a cleaned & canonicalised version of src. Never raises."""
    # 0. emoji-replace BEFORE всего остального
    src = _replace_emojis(src)

    # 1. lexical strip
    stripped = _remove_comments_blanks(src)

    for attempt in (0, 1):         # at most 2 parse attempts
        try:
            tree = ast.parse(stripped)
            break
        except SyntaxError:
            if attempt == 1:       # final failure → fallback
                # still drop leading docstring with regex, return stripped code
                return re.sub(r'^\s*""".*?"""', '', stripped, 1, re.S)
            # first failure → quick autopatch: wrap generator arg in ()
            stripped = _GEN_FIX.sub(lambda m: f"{m.group(1)}({m.group(2)})", stripped)

    # 2. docstring & I/O strip
    tree = _DocstringRemover().visit(tree)
    tree = _IOremover().visit(tree)
    ast.fix_missing_locations(tree)

    # 3. canonical rename
    coll = _ImportCollector(); coll.visit(tree)
    tree = _Renamer(coll.imported).visit(tree)
    ast.fix_missing_locations(tree)

    # 4. unparse
    try:                # Python 3.9+
        return ast.unparse(tree)
    except AttributeError:
        import astor    # pip install astor for <3.9
        return astor.to_source(tree)


if __name__ == "__main__":
    raw_code = '''
from heapq import heappop as ♡, heappush as 💔
from collections import deque as 🌀
from math import log1p as 💀, cos as 👻
from random import shuffle as 🎲

🩸 = lambda: [[(i^j, ((i*j)%6+1)) for j in range(7) if j!=i] for i in range(7)]
💣 = [999]*7; 💣[0] = 0
☢️ = [(0, 0)]
🧃 = lambda x: x if x < 3 else 🧃(x-1)+🧃(x-2)
🫀 = [🧃(i%5) for i in range(13)]
🧠 = [0]*7
🧤 = [False]*7

def 🕷(x):
 for i in range(x):
  for j in range(x):
   _=i^j if i&1 else (i|j)
   💀(_**2+1)

def 🍄(): [👻(i)*i%5 for i in range(7)]

def 🐛():
 🧟 = 🌀([3])
 while 🧟:
  👁 = 🧟.popleft()
  if not 🧤[👁]: 🧤[👁]=True; 🧟.extend(range(👁))

A = 🩸(); 🍄(); 🕷(3); 🐛()
while ☢️:
 🦴, 🔮 = ♡(☢️)
 if 💣[🔮] < 🦴: continue
 for 🧱, 🔊 in A[🔮]:
  if 💣[🧱] > 🦴 + 🔊 or 👻(🔊)&1: 💣[🧱] = 🦴 + 🔊; 💔(☢️, (💣[🧱], 🧱))

🎲(💣); 🧠[:]=💣[::-1]; 💣=list(map(lambda x: x//2 if x%2==0 else x*3+1, 🧠))
set(map(lambda x: x**0.5+💀(x+1), 💣 if sum(💣)%2==0 else range(6)))
'''
    print("=== ORIGINAL ===")
    print(raw_code)
    print("=== PREPROCESSED ===")
    print(preprocess_and_canonicalize(raw_code))
