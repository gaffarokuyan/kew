import re
def to_arabic(s):
    """Latin Kurmancî -> Arabic-script Kurmancî (Badînî style), word by word."""
    M = {"a": "ا", "b": "ب", "c": "ج", "ç": "چ", "d": "د", "e": "ە", "ê": "ێ", "f": "ف", "g": "گ", "h": "ه", "i": "", "î": "ی", "j": "ژ",
         "k": "ک", "l": "ل", "m": "م", "n": "ن", "o": "ۆ", "p": "پ", "q": "ق", "r": "ر", "s": "س", "ş": "ش", "t": "ت", "u": "و", "û": "وو",
         "v": "ڤ", "w": "و", "x": "خ", "y": "ی", "z": "ز"}
    def word(w):
        lw = w.lower(); out = ""
        for k, ch in enumerate(lw):
            if ch not in M: out += {"?": "؟", ",": "،"}.get(ch, ch); continue
            if k == 0 and ch in "aeêiîouû": out += "ئ" + (M[ch] if ch != "i" else "")
            elif ch == "r" and k == 0: out += "ڕ"
            else: out += M[ch]
        return out
    return re.sub(r"[A-Za-zÇçÊêÎîŞşÛû]+", lambda m: word(m.group()), s)
