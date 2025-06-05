#!/usr/bin/env python3
# -*- encoding: utf-8 -*-
#
# Copyright 2020, Nigel Small
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""
``pansi.text`` – coloured and styled text
=========================================

The ``pansi.text`` module contains functions to enhance text with colours
and styles using ANSI escape sequences.
"""

from collections.abc import Sequence
from io import StringIO
from re import compile as re_compile
from typing import Iterable
from unicodedata import category, east_asian_width


from pansi.codes import (
    BS, HT, CR, LF, CRLF, UNICODE_NEWLINES,
    ESC, CSI, C1_CONTROL_TO_ESC_SEQUENCE,
    DEL, APC, SGR, reset, bold, light, italic,
    underline, double_underline, overline, line_through, blink,
)
from pansi.color import WEB_PALETTE, decode_hex_color, rgb


# Patterns
_PADDED_SEGMENT_BREAK = re_compile(r"[ \t]*(\r\n|\n|\r)[ \t]*")
_TWO_OR_MORE_SPACES = re_compile(r"  +")
_COLOR_FUNCTION = re_compile(r"(\w+)\((.*?)(/(.*?))?\)")


# Translation tables
_TEXT_TO_SUBSCRIPT = str.maketrans(dict(zip("()+-0123456789=aehklmnopst",
                                            "₍₎₊₋₀₁₂₃₄₅₆₇₈₉₌ₐₑₕₖₗₘₙₒₚₛₜ")))
_TEXT_TO_SUPERSCRIPT = str.maketrans(dict(zip("()+-0123456789=in",
                                              "⁽⁾⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹⁼ⁱⁿ")))

#: Dictionary mapping the original set of named web colors to a pair of ANSI
#: terminal colour codes corresponding to foreground and background selectors.
#:
#: The original sixteen web colours were derived from CGA, an IBM graphics
#: card that established a standard for colour palettes used in computer
#: displays. Within those sixteen colours were eight low intensity colours
#: and eight high intensity colours. These in turn map to the sixteen base
#: colours still used in terminal emulators today.
#:
#: In practice, terminal emulation software renders a range of different
#: shades for these colours, although the selector codes remain the same.
#:
#: +-----------+------------------------+------------------+----------+
#: | Selector  |                        |                  |          |
#: +-----+-----+                        |                  |          |
#: |  FG |  BG | Description            | Web color names  |    CGA   |
#: +=====+=====+========================+==================+==========+
#: |  30 |  40 | low intensity black    | black            | ``#000`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  31 |  41 | low intensity red      | maroon           | ``#A00`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  32 |  42 | low intensity green    | green            | ``#0A0`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  33 |  43 | low intensity yellow   | olive            | ``#A50`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  34 |  44 | low intensity blue     | navy             | ``#00A`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  35 |  45 | low intensity magenta  | purple           | ``#A0A`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  36 |  46 | low intensity cyan     | teal             | ``#0AA`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  37 |  47 | low intensity white    | silver           | ``#AAA`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  90 | 100 | high intensity black   | grey, gray       | ``#555`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  91 | 101 | high intensity red     | red              | ``#F55`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  92 | 102 | high intensity green   | lime             | ``#5F5`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  93 | 103 | high intensity yellow  | yellow           | ``#FF5`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  94 | 104 | high intensity blue    | blue             | ``#55F`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  95 | 105 | high intensity magenta | fuchsia, magenta | ``#F5F`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  96 | 106 | high intensity cyan    | aqua, cyan       | ``#5FF`` |
#: +-----+-----+------------------------+------------------+----------+
#: |  97 | 107 | high intensity white   | white            | ``#FFF`` |
#: +-----+-----+------------------------+------------------+----------+
#:
#: - https://en.wikipedia.org/wiki/Color_Graphics_Adapter#Color_palette
#: - https://int10h.org/blog/2022/06/ibm-5153-color-true-cga-palette/
#: - https://www.w3.org/TR/REC-html40/types.html#h-6.5
#:
CGA_PALETTE = {
    "aqua": (96, 106),      # alias for "cyan"
    "black": (30, 40),
    "blue": (94, 104),
    "cyan": (96, 106),      # alias for "aqua"
    "fuchsia": (95, 105),   # alias for "magenta"
    "gray": (90, 100),      # alias for "grey"
    "green": (32, 42),
    "grey": (90, 100),      # alias for "gray"
    "lime": (92, 102),
    "magenta": (95, 105),   # alias for "fuchsia"
    "maroon": (31, 41),
    "navy": (34, 44),
    "olive": (33, 43),
    "purple": (35, 45),
    "red": (91, 101),
    "silver": (37, 47),
    "teal": (36, 46),
    "white": (97, 107),
    "yellow": (93, 103),
}


def _color_sgr(value, background=False, web_palette_only=False) -> SGR:
    """ Construct an :py:class:`pansi.codes.SGR` object for a given color value. The input can be any
    of a hex colour value, a named colour, or an RGB tuple composed of numbers
    and/or percentages. The string value ``'default'`` can also be passed to
    explicitly select the terminal default colour.

    Note: alpha values are accepted, but ignored and discarded.

    :param value:
    :param background:
    :param web_palette_only: if true, use the web palette for all named
        colours instead of falling back to terminal palette for basic
        CGA colours
    :return: SGR
    """
    default = 49 if background else 39
    if isinstance(value, tuple):
        value = rgb(*value)
    else:
        value = str(value).strip()
    if value.startswith("#"):
        c = decode_hex_color(value)
        return SGR(48 if background else 38, 2,
                   c[0], c[1], c[2], reset=default)
    else:
        name = value.lower()
        if name == "default":
            return SGR(default)
        elif name in CGA_PALETTE and not web_palette_only:
            fg, bg = CGA_PALETTE[name]
            return SGR(bg if background else fg, reset=default)
        elif name in WEB_PALETTE:
            r, g, b = WEB_PALETTE[name]
            return SGR(48 if background else 38, 2, r, g, b, reset=default)
        else:
            raise ValueError(f"Unrecognised color name {value!r}")


def color(value, web_palette_only=False) -> str:
    """ Generate ANSI escape code string for given foreground colour value.
    """
    try:
        sgr = _color_sgr(value, web_palette_only=web_palette_only)
    except ValueError:
        return ""
    else:
        return str(sgr)


def background_color(value, web_palette_only=False) -> str:
    """ Generate ANSI escape code string for given background colour value.
    """
    try:
        sgr = _color_sgr(value, background=True, web_palette_only=web_palette_only)
    except ValueError:
        return ""
    else:
        return str(sgr)


def font_weight(value) -> str:
    r""" Generate ANSI escape sequence for the given font weight. Values
    correspond to CSS font-weight values 'bold' and 'normal' or numeric
    equivalents.

    >>> font_weight('bold')
    '\x1b[1m'

    """
    try:
        weight = int(value)
    except (ValueError, TypeError):
        # compare as string
        weight = str(value)
        if weight == "bold":
            return str(bold)
        elif value == "normal":
            return str(~bold)
        else:
            return ""
    else:
        # compare as integer
        if weight > 500:
            return str(bold)
        elif weight < 400:
            return str(light)
        else:
            return str(~bold)


def font_style(value) -> str:
    r""" Generate ANSI escape sequence for the given font style.
    """
    value = str(value)
    if value in {"italic", "oblique"}:
        return str(italic)
    elif value == "normal":
        return str(~italic)
    else:
        return ""


def text_decoration(value) -> str:
    r""" Generate ANSI escape sequence for the given text-decoration value.

    >>> text_decoration('underline')
    '\x1b[4m'

    """
    values = str(value).lower().split()
    codes = []
    if "underline" in values:
        if "double" in values:
            codes.append(double_underline)
        else:
            codes.append(underline)
    if "blink" in values:
        codes.append(blink)
    if "line-through" in values:
        codes.append(line_through)
    if "overline" in values:
        codes.append(overline)
    return "".join(map(str, codes))


def _apply_vertical_align(text, value):
    if value == "sub":
        return text.translate(_TEXT_TO_SUBSCRIPT)
    elif value == "super":
        return text.translate(_TEXT_TO_SUPERSCRIPT)
    else:
        return text


class Text(Sequence):

    def __init__(self, text, tab_size=8, encoding="utf-8", errors="strict"):
        if isinstance(text, self.__class__):
            self._raw = text._raw
            if tab_size == text._tab_size:
                self._units = text._units
                self._tab_size = text._tab_size
                self._measurements = text._measurements
            else:
                self._units: [str] = list(_iter_text_units(StringIO(self._raw)))
                self._tab_size: int = tab_size
                self._measurements: [(int, int)] = None
        else:
            try:
                text = text.read()
            except AttributeError:
                pass
            try:
                text = text.decode(encoding, errors)
            except AttributeError:
                pass
            self._raw: str = str(text).translate(C1_CONTROL_TO_ESC_SEQUENCE)
            self._units: [str] = list(_iter_text_units(StringIO(self._raw)))
            self._tab_size: int = tab_size
            self._measurements: [(int, int)] = None
        self._color = color
        self._background_color = background_color
        self._font_weight = font_weight
        self._font_style = font_style
        self._text_decoration = text_decoration

    @property
    def tab_size(self):
        return self._tab_size

    @property
    def measurements(self):
        if self._measurements is None:
            self._measurements = list(_iter_text_measurements(self._units, self._tab_size))
        return self._measurements

    def __repr__(self):
        return f"{self.__class__.__name__}({self._raw!r})"

    def __str__(self):
        return self._raw

    def __eq__(self, other):
        return self._raw == str(other)

    def __hash__(self):
        return hash(self._raw)

    def __iter__(self):
        return iter(self._units)

    def __len__(self):
        return len(self._units)

    def __getitem__(self, index):
        item = self._units.__getitem__(index)
        if isinstance(index, slice):
            return self.__class__("".join(item))
        else:
            return item

    def __contains__(self, item):
        return str(item) in self._raw

    def __add__(self, other):
        return self.__class__(self._raw + str(other))

    def __radd__(self, other):
        return self.__class__(str(other) + self._raw)

    def _copy_with(self, code):
        if code:
            if self._raw.endswith(f"{CSI}0m") or self._raw.endswith(f"{CSI}m"):
                return self.__class__(f"{code}{self._raw}")
            else:
                return self.__class__(f"{code}{self._raw}{reset}")
        else:
            return self

    def plain(self):
        raise NotImplementedError  # TODO: remove all style codes

    def style(self, /, color=None, background_color=None, font_weight=None, font_style=None,
              text_decoration=None, vertical_align=None):
        """

        >>> Text("H2O").style(color="blue", vertical_align="sub")
        Text('\x1b[94mH₂O\x1b[0m')

        :param color:
        :param background_color:
        :param font_weight:
        :param font_style:
        :param text_decoration:
        :param vertical_align:
        :return:
        """
        text = _apply_vertical_align(self._raw, vertical_align)
        seq = [
            self._color(color),
            self._background_color(background_color),
            self._font_weight(font_weight),
            self._font_style(font_style),
            self._text_decoration(text_decoration),
        ]
        prefix = ''.join(map(str, seq))
        if prefix:
            # If the text contains newlines (e.g. <pre>) then we should add
            # the style codes to each line. Without this, styled output
            # displayed in applications like `less` applies the style to
            # the first line only.
            units = []
            for line in text.splitlines(keepends=True):
                # Break the line into char sequences
                line_units = list(Text(line))
                # Separate out trailing newlines
                newlines = []
                while line_units and line_units[-1] in UNICODE_NEWLINES:
                    newlines.insert(0, line_units.pop(-1))
                # Store the prefix
                units.append(prefix)
                # Store the line content (without newlines)
                units.extend(line_units)
                # Store a reset if one does not already exist
                if line_units[-1] not in {f"{CSI}0m", f"{CSI}m"}:
                    units.append(reset)
                # Store the newlines
                units.extend(newlines)
            return self.__class__("".join(map(str, units)))
        else:
            return self

    def translate(self, table):
        """ Return a copy of the text in which each character has been
        mapped through the given translation table.
        """
        units = []
        for unit in self._units:
            try:
                b = ord(unit)
            except TypeError:
                units.append(unit)
            else:
                try:
                    translated = table[b]
                except KeyError:
                    units.append(unit)
                else:
                    units.append(translated)
        return self.__class__("".join(units))

    def render(self, /, white_space="normal") -> str:
        collapsible = white_space in {"normal", "nowrap", "pre-line"}

        units = []
        line = 0
        column = 0
        last_palpable_unit = None
        for unit, (advance, width) in zip(self._units, self.measurements):
            include = True
            if collapsible and unit == " " and last_palpable_unit == " ":
                include = False
            if include:
                units.append(unit)
                line += advance
                column += width
                if width > 0:
                    print(f"Setting LPU to {unit!r}")
                    last_palpable_unit = unit
        return "".join(units)

        # text = self._raw
        # if white_space in {"normal", "nowrap", "pre-line"}:
        #     text = _PADDED_SEGMENT_BREAK.sub("\n", text)
        #     text = text.replace("\t", " ")
        #     text = text.replace("\n", " ")
        #     text = _TWO_OR_MORE_SPACES.sub(" ", text)
        # return text


def _iter_text_units(sio: StringIO) -> Iterable[str]:
    r""" Read a text, yielding each character or character sequence
    in turn. Characters are yielded individually, except for the
    following:

    - CRLF
    - ANSI escape sequences
    - Characters followed by combining characters

    Notes:
        - C1 control characters will be automatically converted to
          escape sequences (e.g. `\x85` -> `\x1bE`)
        - combining characters following C0 controls or newlines
          will be discarded

    """
    ch = sio.read(1)
    while ch:
        if ch == ESC:
            # Escape sequence
            ch = sio.read(1)
            seq = [ESC, ch]
            if ch == '[' or ch == 'O':
                # CSI ('{ESC}[') or SS3 ('{ESC}O')
                while True:
                    ch = sio.read(1)
                    seq.append(ch)
                    if '@' <= ch <= '~':
                        break
            elif ch in {'P', 'X', ']', '^', '_'}:
                # Sequences terminated by ST
                while True:
                    ch = sio.read(1)
                    seq.append(ch)
                    if seq[-2:] == [ESC, '\\']:
                        break
            elif '@' <= ch <= '_':
                pass  # TODO: other type Fe
            elif '`' <= ch <= '~':
                pass  # TODO: type Fs
            elif '0' <= ch <= '?':
                pass  # TODO: type Fp
            elif ' ' <= ch <= '/':
                pass  # TODO: type nF
                while True:
                    ch = sio.read(1)
                    seq.append(ch)
                    if '0' <= ch <= '~':
                        break
            value = ''.join(seq)
        elif ch == CR:
            marker = sio.tell()
            if sio.read(1) == LF:
                value = CRLF
            else:
                sio.seek(marker)
                value = CR
        elif "\x80" <= ch <= "\x9F":
            value = ch.translate(C1_CONTROL_TO_ESC_SEQUENCE)
        else:
            value = ch
        # Check for combining characters
        combiners = []
        while True:
            marker = sio.tell()
            cc = sio.read(1)
            if not cc:
                break
            cat = category(cc)
            if cat[0] == "M":
                combiners.append(cc)
            else:
                sio.seek(marker)
                break
        # Yield the value, plus any combiners
        if combiners:
            yield value + "".join(combiners)
        else:
            yield value
        ch = sio.read(1)


def _iter_text_measurements(units: [str], tab_size: int) -> ((int, int), str):
    r""" Iterate through a text string or iterable sequence of characters,
    yielding a (line_advance, width) tuple for each.

    line_advance - change in vertical cursor position
    width        - change in horizontal cursor position
    char_seq     - the character or character sequence

    For width:
    - Regular characters occupy one cell
    - Non-printable characters and escape sequences occupy zero cells
    - Full width characters occupy two cells

    >>> text_width = lambda s: sum(width for ((_, width), _) in measure(s))
    >>> text_width("hello, world")
    12
    >>> text_width(f"hello, {ansi_green}world{reset}")
    [12]
    >>> measure_text("hello, ｗｏｒｌｄ")
    [17]
    >>> measure_text(f"hello, {ansi_green}ｗｏｒｌｄ{reset}")
    [17]
    >>> measure_text("hello\nworld")
    """
    # TODO tab, newline
    y = 0
    x = 0
    for char_seq in units:
        # Measurement can generally be taken by looking at only the
        # first character. But C1 control codes might be represented
        # in expanded ESC+X form, so we should normalise those.
        first_char = char_seq[0]
        if first_char == ESC and len(char_seq) > 1:
            second_char = char_seq[1]
            if "@" <= second_char <= "_":
                # collapse 7-bit C1 control codes to 8-bit equivalents
                first_char = chr(0x40 + ord(second_char))
        # For most values, no vertical movement occurs, so we can
        # save code by assuming a default of zero.
        line = 0
        # Now, check specific edge cases and fall back to checking the
        # Unicode general category.
        if first_char in UNICODE_NEWLINES:
            # This detects:
            # - CR, LF, CRLF (CRLF will be tested as CR, but whatever)
            # - NEL (both 7-bit and 8-bit representations)
            # - VT, FF
            # - LS, PS
            line = 1
            width = -x
        elif first_char == BS:
            width = -1
        elif first_char == HT:
            # Advance to next multiple of tab_size. This formula should
            # only ever return values between 1 and tab_size inclusive.
            width = tab_size - (x % tab_size)
        elif first_char < " ":
            # Other control characters do not affect the cursor:
            # - NUL, BEL, CAN, EM, SUB, ESC
            # - TC (SOH, STX, ETX, EOT, ENQ, ACK, DLE, NAK, SYN, ETB)
            # - LS (SI, SO)
            # - DC (DC1, DC2, DC3, DC4)
            # - IS (FS, GS, RS, US)
            width = 0
        elif first_char <= "~":
            # Anything else in ASCII range is printable and one cell wide.
            width = 1
        elif DEL <= first_char <= APC:
            # TODO: this isn't true for all of these
            width = 0
        else:
            # For everything else, check the Unicode general category.
            major, minor = category(first_char)
            is_printable = major in {'L', 'N', 'P', 'S'} or (major, minor) == ('Z', 's')
            if is_printable:
                width = (2 if east_asian_width(first_char) in {'F', 'W'} else 1)
            else:
                width = 0  # not printable, so no visible size
        yield line, width
        y += line
        x += width
