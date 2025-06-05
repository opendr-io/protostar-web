#!/usr/bin/env python3
# -*- encoding: utf-8 -*-

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


from argparse import ArgumentParser
from array import array
from base64 import b64encode
from fcntl import ioctl
from io import BytesIO
from math import ceil
from sys import stdin, stdout
from termios import TIOCGWINSZ, tcgetattr, TCSADRAIN, tcsetattr
from tty import setcbreak
from uuid import uuid4

from PIL import Image


class Terminal:

    @classmethod
    def query(cls, query, terminator):
        original_settings = tcgetattr(stdin)
        try:
            setcbreak(stdin.fileno())
            stdout.write(query)
            stdout.flush()
            response = []
            while True:
                char = stdin.read(1)
                response.append(char)
                if char == terminator:
                    break
            return "".join(response)
        finally:
            tcsetattr(stdin, TCSADRAIN, original_settings)

    @classmethod
    def supports_graphics_protocol(cls):
        return cls.query("\x1B_Gi=31,s=1,v=1,a=q,t=d,f=24;AAAA\x1B\\\x1B[c", "c").startswith("\x1B_G")

    def __init__(self):
        buf = array('H', [0, 0, 0, 0])
        ioctl(stdout, TIOCGWINSZ, buf)
        self.char_height = buf[0]
        self.char_width = buf[1]
        self.pixel_width = buf[2]
        self.pixel_height = buf[3]
        if self.pixel_width == 0 or self.pixel_height == 0:
            self._get_terminal_pixel_size()

    def _get_terminal_pixel_size(self):
        response = self.query("\x1b[14t", "t")
        _, self.pixel_height, self.pixel_width = map(int, response[2:-1].split(";"))

    @property
    def cell_width(self):
        return self.pixel_width // self.char_width

    @property
    def cell_height(self):
        return self.pixel_height // self.char_height

    def fit_image(self, image, reserved_lines=1):
        width, height = image.width, image.height
        aspect_ratio = width / height
        max_height = self.pixel_height - (reserved_lines * self.cell_height)
        resize = False
        if height > max_height:
            height = max_height
            width = height * aspect_ratio
            resize = True
        if width > self.pixel_width:
            width = self.pixel_width
            height = width / aspect_ratio
            resize = True
        if resize:
            width = int(round(width))
            height = int(round(height))
            return image.resize((width, height))
        else:
            return image


class TerminalImage:

    def __init__(self, image, uri=None):
        self.image = image
        self.uri = uri

    def _derived(self, new_image):
        return self.__class__(new_image, uri=self.uri)

    @property
    def width(self):
        return self.image.width

    @property
    def height(self):
        return self.image.height

    def print_pixels(self):
        data = BytesIO()
        self.image.save(data, format="PNG")
        # TODO: Windows support
        filename = f"/tmp/{uuid4()}.png"  # would use mkstemp here, but the mode isn't programmable :/
        with open(filename, "wb") as f:
            f.write(data.getvalue())
        payload = b64encode(filename.encode("utf-8")).decode("ascii")
        print(f"\x1B_Gf=100,t=t,a=T;{payload}\x1B\\")

    def print_blocks(self, screen):
        width, height = self.image.size
        lines = int(ceil(height / screen.cell_height))
        cols = int(ceil(width / screen.cell_width))
        image = BlockImage(self.image, lines=lines, cols=cols)
        for line in image.ansi_lines():
            print(line)

    def resize(self, size, resample=None, box=None, reducing_gap=None):
        return self._derived(self.image.resize(size, resample, box, reducing_gap))

    def to_fit(self, terminal, reserved_lines=1):
        width, height = self.width, self.height
        aspect_ratio = width / height
        max_height = terminal.pixel_height - (reserved_lines * terminal.cell_height)
        resize = False
        if height > max_height:
            height = max_height
            width = height * aspect_ratio
            resize = True
        if width > terminal.pixel_width:
            width = terminal.pixel_width
            height = width / aspect_ratio
            resize = True
        if resize:
            width = int(round(width))
            height = int(round(height))
            return self.resize((width, height))
        else:
            return self


class Fragment:

    def __init__(self):
        self.fg = None
        self.bg = None
        self.ch = []

    def append(self, ch, fg=None, bg=None):
        self.ch.append(ch)
        if fg:
            self.fg = fg
        if bg:
            self.bg = bg

    def pop(self):
        try:
            return "".join(self.ch), self.fg, self.bg
        finally:
            self.ch[:] = ()
            self.fg = self.bg = None

    @classmethod
    def to_ansi_text(cls, frag):
        text, fg, bg = frag
        style = []
        if fg:
            style.append(f"\x1b[38;2;{fg[0]};{fg[1]};{fg[2]}m")
        if bg:
            style.append(f"\x1b[48;2;{bg[0]};{bg[1]};{bg[2]}m")
        return "".join(style) + text


class BlockImage:

    blocks_per_char = 2

    def __init__(self, image, lines, cols):
        self.lines = int(ceil(lines))
        self.width = cols
        self.height = self.blocks_per_char * lines
        self.pixels = image.resize((self.width, self.height)).getdata()
        self.line_numbers = range(int(ceil(self.lines)))
        self._offset = (0, 0)
        self._fragments = {}

    @property
    def offset(self):
        return self._offset

    @offset.setter
    def offset(self, value):
        new_x, new_y = value
        old_x, old_y = self._offset
        if new_x != old_x:
            self._fragments.clear()
        self._offset = (new_x, new_y)

    def ansi_lines(self):
        for line_no in self.line_numbers:
            yield "".join(map(Fragment.to_ansi_text, self._get_line(line_no))) + "\x1b[0m"

    def _get_line(self, n):
        line_no = n + self._offset[1]  # convert relative line number 'n' to real line number
        if line_no in self.line_numbers:
            try:
                value = self._fragments[line_no]
            except KeyError:
                value = self._fragments[line_no] = self._create_line_fragments(line_no)
            return value
        else:
            return []

    def _create_line_fragments(self, line_no):
        hi = self.blocks_per_char * self.width * line_no + self._offset[0]
        lo = hi + ((self.blocks_per_char - 1) * self.width)
        fragments = []
        frag = Fragment()
        for offset in range(self.width - self._offset[0]):
            c0 = self.pixels[hi + offset]   # colour of top pixel
            c1 = self.pixels[lo + offset]   # colour of bottom pixel
            if frag.fg is None:
                # palette contains zero colours
                if c0 == c1:
                    frag.append("█", fg=c0)
                else:
                    frag.append("▀", fg=c0, bg=c1)
            elif frag.bg is None:
                # palette contains one colour
                if c0 == c1 == frag.fg:
                    frag.append("█")
                elif c0 == frag.fg:
                    frag.append("▀", bg=c1)
                elif c1 == frag.fg:
                    frag.append("▄", bg=c0)
                elif c0 == c1:
                    frag.append(" ", bg=c0)
                else:
                    fragments.append(frag.pop())
                    frag.append("▀", fg=c0, bg=c1)
            else:
                # palette contains two colours
                if c0 == c1 == frag.fg:
                    frag.append("█")
                elif c0 == frag.fg and c1 == frag.bg:
                    frag.append("▀")
                elif c1 == frag.fg and c0 == frag.bg:
                    frag.append("▄")
                elif c0 == c1 == frag.bg:
                    frag.append(" ")
                else:
                    fragments.append(frag.pop())
                    if c0 == c1:
                        frag.append("█", fg=c0)
                    else:
                        frag.append("▀", fg=c0, bg=c1)
        trailing = frag.pop()
        if trailing:
            fragments.append(trailing)
        return fragments


def main():
    parser = ArgumentParser()
    parser.add_argument("-B", "--force-blocks", action="store_true")
    parser.add_argument("filename")
    args = parser.parse_args()
    screen = Terminal()
    term_image = TerminalImage(Image.open(args.filename))
    if args.force_blocks or not Terminal.supports_graphics_protocol():
        term_image.to_fit(screen).print_blocks(screen)
    else:
        term_image.to_fit(screen).print_pixels()


if __name__ == '__main__':
    main()
