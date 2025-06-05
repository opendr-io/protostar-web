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


from fcntl import ioctl
from sys import stdin, stdout
from termios import tcgetattr, tcsetattr, TCSAFLUSH, TIOCGWINSZ
from tty import setcbreak

from pansi.codes import ESC, CSI


class Screen:

    @classmethod
    def wrapper(cls, func, *args, **kwargs):
        with Screen() as screen:
            return func(screen, *args, **kwargs)

    def __init__(self, cout=stdout, cin=stdin, cbreak=True, cursor=False):
        self.cout = cout
        self.cin = cin
        self.cbreak = cbreak
        self.cursor = cursor
        self.original_mode = None

    def __enter__(self):
        if not self.cursor:
            self.hide_cursor()
        self.show()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.hide()
        self.show_cursor()

    def _read_ss3(self, seq):
        while True:
            ch = self.cin.read(1)
            seq += ch
            if 0x40 <= ord(ch) <= 0x7E:
                break
        return seq

    def _read_csi(self, seq):
        while True:
            ch = self.cin.read(1)
            seq += ch
            if 0x40 <= ord(ch) <= 0x7E:
                break
        return seq

    def _read_esc(self, seq):
        ch = self.cin.read(1)
        seq += ch
        if ch == "[":
            return self._read_csi(seq)
        elif ch == "O":
            return self._read_ss3(seq)
        else:
            raise OSError(f"Unknown input sequence {seq!r}")

    def read_key(self):
        seq = ""
        ch = self.cin.read(1)
        seq += ch
        if ch == ESC:
            return self._read_esc(seq)
        else:
            return seq

    def read_response(self):
        seq = self.read_key()
        if seq.startswith(f"{ESC}["):
            args = tuple(map(int, seq[2:-1].split(";")))
            function = seq[-1]
            return args, function
        else:
            raise OSError(f"Unexpected response {seq!r}")

    @property
    def size_px(self):
        self.cout.write(f"{CSI}14t")
        self.cout.flush()
        args, function = self.read_response()
        if function == "t":
            if args[0] == 4:
                return args[1:]
            else:
                raise OSError(f"Unexpected response {function!r} {args[0]!r}")
        else:
            raise OSError(f"Unexpected response {function!r}")

    @property
    def cell_size(self):
        self.cout.write(f"{CSI}16t")
        self.cout.flush()
        args, function = self.read_response()
        if function == "t":
            if args[0] == 6:
                return args[1:]
            else:
                raise OSError(f"Unexpected response {function!r} {args[0]!r}")
        else:
            raise OSError(f"Unexpected response {function!r}")

    @property
    def size(self):
        import struct
        import os
        try:
            # Create a buffer for the ioctl call
            buf = struct.pack('HHHH', 0, 0, 0, 0)

            # Make the ioctl call
            fd = os.open(os.ctermid(), os.O_RDONLY)
            result = ioctl(fd, TIOCGWINSZ, buf)
            os.close(fd)

            # Unpack the result
            rows, cols, _, _ = struct.unpack('HHHH', result)

            return rows, cols
        except OSError:
            # Fallback method using environment variables
            return (int(os.environ.get('LINES', 24)),
                    int(os.environ.get('COLUMNS', 80)))

    @property
    def cur_pos(self):
        self.cout.write(f"{CSI}6n")
        self.cout.flush()
        args, function = self.read_response()
        if function == "R":
            return args
        else:
            raise OSError(f"Unexpected response {function!r}")

    @cur_pos.setter
    def cur_pos(self, row_column):
        row, column = row_column
        self.cout.write(f"{CSI}{row};{column}H")

    def cursor_forward_tab(self, stops=1):
        self.cout.write(f"{CSI}{stops}I")

    def clear(self):
        self.cout.write(f"{CSI}H{CSI}2J")

    def show(self):
        self.cout.write(f"{CSI}?1049h")
        self.cout.flush()
        self.original_mode = tcgetattr(self.cout)
        setcbreak(self.cout)
        # self.keypad_on()

    def hide(self):
        # self.keypad_off()
        tcsetattr(self.cout, TCSAFLUSH, self.original_mode)
        self.cout.write(f"{CSI}?1049l")
        self.cout.flush()

    def show_cursor(self):
        self.cout.write(f"{CSI}?25h")
        self.cout.flush()

    def hide_cursor(self):
        self.cout.write(f"{CSI}?25l")
        self.cout.flush()

    # def keypad_on(self):
    #     self.cout.write(f"{CSI}?1h{ESC}=")
    #     self.cout.flush()

    # def keypad_off(self):
    #     self.cout.write(f"{CSI}?1l{ESC}>")
    #     self.cout.flush()

    def write(self, *values):
        for value in values:
            self.cout.write(str(value))

    def flush(self):
        self.cout.flush()
