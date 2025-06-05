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


from math import cos, sin, tau


def decode_hex_color(value):
    """ Decode a hex color string into red, green and blue components,
    optionally also including an alpha value if provided. Returns a tuple of
    either (red, green, blue) or (red, green, blue, alpha) where all component
    values are integers within the range 0..255 inclusive.

    Input values may include or omit a leading hash symbol, and can be of any
    of the following formats: `RGB`, `RGBA`, `RRGGBB`, or `RRGGBBAA`.

    :param value: hex color value string, with or without a leading
        '#' symbol, e.g. `'#FF8000'`
    """
    value = str(value).lstrip("#")
    code_len = len(value)
    if code_len in {3, 4}:
        # '#RGB' or '#RGBA'
        r = int(value[0], 16) * 17
        g = int(value[1], 16) * 17
        b = int(value[2], 16) * 17
        if code_len == 4:
            a = int(value[3], 16) * 17
            return r, g, b, a
        else:
            return r, g, b
    elif code_len in {6, 8}:
        # '#RRGGBB' or '#RRGGBBAA'
        r = int(value[0:2], 16)
        g = int(value[2:4], 16)
        b = int(value[4:6], 16)
        if code_len == 8:
            a = int(value[6:8], 16)
            return r, g, b, a
        else:
            return r, g, b
    else:
        raise ValueError(f"Unusable hex color code {value!r}")


def rgb(red, green, blue, alpha=None) -> str:
    r""" Generate a hex colour value string from component RGB values.

    The red, green and blue values represent their respective colour
    channels. Each value can be represented as a number between 0 and
    255, a percentage string between '0%' and '100%', the keyword 'none',
    or an actual None value (the latter two of which are equivalent to 0).

    The alpha value represents the alpha channel (transparency). This can
    be supplied as a number between 0 and 1, a percentage string between
    '0%' and '100%', the keyword 'none' or a None value. Here, 'none' can
    be used to explicitly specify no alpha channel (which in effect gives
    100% opacity).

    :param red: red channel
    :param green: green channel
    :param blue: blue channel
    :param alpha: alpha channel (transparency)
    :return: RGB hex color value string in either '#RRGGBB' or
        '#RRGGBBAA' form
    """
    red = round(scalar(red, scale=255, clamp=True))
    green = round(scalar(green, scale=255, clamp=True))
    blue = round(scalar(blue, scale=255, clamp=True))
    if str(alpha).lower() == "none":
        return f"#{red:02X}{green:02X}{blue:02X}"
    else:
        alpha = round(255 * scalar(alpha, scale=1.0, clamp=True))
        return f"#{red:02X}{green:02X}{blue:02X}{alpha:02X}"


def hsl(hue, saturation, lightness, alpha=None) -> str:
    """ Generate a hex colour value string from component RGB values.

    .. todo::
        Not yet implemented
    """
    raise NotImplementedError


def hwb(hue, whiteness, blackness, alpha=None) -> str:
    """ Generate a hex colour value string from component HWB values.

    .. todo::
        Not yet implemented
    """
    raise NotImplementedError


def lab(lightness, a, b, alpha=None) -> str:
    """ Generate a hex colour value string from component CIE Lab values.

    .. todo::
        Not yet implemented
    """
    raise NotImplementedError


def lch(lightness, chroma, hue, alpha=None) -> str:
    """ Generate a hex colour value string from component CIE LCH values.

    .. todo::
        Not yet implemented
    """
    raise NotImplementedError


def oklab(lightness, a, b, alpha=None) -> str:
    r""" Generate a hex colour value string from component OkLab values.

    :param lightness:
    :param a:
    :param b:
    :param alpha:
    :returns:
    """
    lightness = scalar(lightness, scale=1.0, clamp=True)
    a = scalar(a, scale=0.4)
    b = scalar(b, scale=0.4)

    l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3

    # Convert linear RGB to sRGB
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    # Gamma-adjust RGB values and hand off to rgb function
    return rgb(255 * linear_to_gamma(r),
               255 * linear_to_gamma(g),
               255 * linear_to_gamma(b),
               alpha=alpha)


def oklch(lightness, chroma, hue, alpha=None) -> str:
    r""" Generate a hex colour value string from component Oklch values.

    :param lightness:
    :param chroma:
    :param hue: angular hue, measured in degrees
    :param alpha:
    :returns:
    """
    chroma = scalar(chroma, scale=0.4)
    hue_rad = hue * tau / 360  # Convert from degrees to radians (TODO: allow other angular units)
    a = chroma * cos(hue_rad)
    b = chroma * sin(hue_rad)
    return oklab(lightness, a, b, alpha=alpha)


def linear_to_gamma(c):
    if c >= 0.0031308:
        return 1.055 * (c ** (1 / 2.4)) - 0.055
    else:
        return 12.92 * c


def scalar(value, scale, clamp=False, reflect=False) -> int | float:
    """ Resolve a scalar numeric component value within the range (0..scale).
    The value can be supplied as a numeric value, a percentage string, or None
    (which evaluates to zero).

    If the `clamp` argument is set, the return value will be clamped to within
    the range, with lower values set to zero and higher values set to scale.

    If the `reflect` argument is also set, subzero values will be clamped to
    -scale instead of zero.
    """
    if not value:
        return 0
    str_value = str(value).lower()
    if str_value == "none":
        return 0
    if str_value.endswith("%"):
        percentage = True
        str_value = str_value.rstrip("%")
    else:
        percentage = False
    try:
        if "." in str_value:
            value = float(str_value)
        else:
            value = int(str_value)
    except ValueError:
        raise ValueError(f"Cannot interpret value {value!r}")
    if percentage:
        value = (value / 100.0) * scale
        int_value = int(value)
        if value == int_value:
            value = int_value
    if clamp:
        if value < 0:
            if reflect and value < -scale:
                value = -scale
            else:
                value = 0
        elif value > scale:
            value = scale
    return value


#: RGB values for named web colours
#:
#: - https://drafts.csswg.org/css-color/#named-colors
WEB_PALETTE = {
    "aliceblue": (240, 248, 255),
    "antiquewhite": (250, 235, 215),
    "aqua": (0, 255, 255),
    "aquamarine": (127, 255, 212),
    "azure": (240, 255, 255),
    "beige": (245, 245, 220),
    "bisque": (255, 228, 196),
    "black": (0, 0, 0),
    "blanchedalmond": (255, 235, 205),
    "blue": (0, 0, 255),
    "blueviolet": (138, 43, 226),
    "brown": (165, 42, 42),
    "burlywood": (222, 184, 135),
    "cadetblue": (95, 158, 160),
    "chartreuse": (127, 255, 0),
    "chocolate": (210, 105, 30),
    "coral": (255, 127, 80),
    "cornflowerblue": (100, 149, 237),
    "cornsilk": (255, 248, 220),
    "crimson": (220, 20, 60),
    "cyan": (0, 255, 255),
    "darkblue": (0, 0, 139),
    "darkcyan": (0, 139, 139),
    "darkgoldenrod": (184, 134, 11),
    "darkgray": (169, 169, 169),
    "darkgreen": (0, 100, 0),
    "darkgrey": (169, 169, 169),
    "darkkhaki": (189, 183, 107),
    "darkmagenta": (139, 0, 139),
    "darkolivegreen": (85, 107, 47),
    "darkorange": (255, 140, 0),
    "darkorchid": (153, 50, 204),
    "darkred": (139, 0, 0),
    "darksalmon": (233, 150, 122),
    "darkseagreen": (143, 188, 143),
    "darkslateblue": (72, 61, 139),
    "darkslategray": (47, 79, 79),
    "darkslategrey": (47, 79, 79),
    "darkturquoise": (0, 206, 209),
    "darkviolet": (148, 0, 211),
    "deeppink": (255, 20, 147),
    "deepskyblue": (0, 191, 255),
    "dimgray": (105, 105, 105),
    "dimgrey": (105, 105, 105),
    "dodgerblue": (30, 144, 255),
    "firebrick": (178, 34, 34),
    "floralwhite": (255, 250, 240),
    "forestgreen": (34, 139, 34),
    "fuchsia": (255, 0, 255),
    "gainsboro": (220, 220, 220),
    "ghostwhite": (248, 248, 255),
    "gold": (255, 215, 0),
    "goldenrod": (218, 165, 32),
    "gray": (128, 128, 128),
    "green": (0, 128, 0),
    "greenyellow": (173, 255, 47),
    "grey": (128, 128, 128),
    "honeydew": (240, 255, 240),
    "hotpink": (255, 105, 180),
    "indianred": (205, 92, 92),
    "indigo": (75, 0, 130),
    "ivory": (255, 255, 240),
    "khaki": (240, 230, 140),
    "lavender": (230, 230, 250),
    "lavenderblush": (255, 240, 245),
    "lawngreen": (124, 252, 0),
    "lemonchiffon": (255, 250, 205),
    "lightblue": (173, 216, 230),
    "lightcoral": (240, 128, 128),
    "lightcyan": (224, 255, 255),
    "lightgoldenrodyellow": (250, 250, 210),
    "lightgray": (211, 211, 211),
    "lightgreen": (144, 238, 144),
    "lightgrey": (211, 211, 211),
    "lightpink": (255, 182, 193),
    "lightsalmon": (255, 160, 122),
    "lightseagreen": (32, 178, 170),
    "lightskyblue": (135, 206, 250),
    "lightslategray": (119, 136, 153),
    "lightslategrey": (119, 136, 153),
    "lightsteelblue": (176, 196, 222),
    "lightyellow": (255, 255, 224),
    "lime": (0, 255, 0),
    "limegreen": (50, 205, 50),
    "linen": (250, 240, 230),
    "magenta": (255, 0, 255),
    "maroon": (128, 0, 0),
    "mediumaquamarine": (102, 205, 170),
    "mediumblue": (0, 0, 205),
    "mediumorchid": (186, 85, 211),
    "mediumpurple": (147, 112, 219),
    "mediumseagreen": (60, 179, 113),
    "mediumslateblue": (123, 104, 238),
    "mediumspringgreen": (0, 250, 154),
    "mediumturquoise": (72, 209, 204),
    "mediumvioletred": (199, 21, 133),
    "midnightblue": (25, 25, 112),
    "mintcream": (245, 255, 250),
    "mistyrose": (255, 228, 225),
    "moccasin": (255, 228, 181),
    "navajowhite": (255, 222, 173),
    "navy": (0, 0, 128),
    "oldlace": (253, 245, 230),
    "olive": (128, 128, 0),
    "olivedrab": (107, 142, 35),
    "orange": (255, 165, 0),
    "orangered": (255, 69, 0),
    "orchid": (218, 112, 214),
    "palegoldenrod": (238, 232, 170),
    "palegreen": (152, 251, 152),
    "paleturquoise": (175, 238, 238),
    "palevioletred": (219, 112, 147),
    "papayawhip": (255, 239, 213),
    "peachpuff": (255, 218, 185),
    "peru": (205, 133, 63),
    "pink": (255, 192, 203),
    "plum": (221, 160, 221),
    "powderblue": (176, 224, 230),
    "purple": (128, 0, 128),
    "rebeccapurple": (102, 51, 153),
    "red": (255, 0, 0),
    "rosybrown": (188, 143, 143),
    "royalblue": (65, 105, 225),
    "saddlebrown": (139, 69, 19),
    "salmon": (250, 128, 114),
    "sandybrown": (244, 164, 96),
    "seagreen": (46, 139, 87),
    "seashell": (255, 245, 238),
    "sienna": (160, 82, 45),
    "silver": (192, 192, 192),
    "skyblue": (135, 206, 235),
    "slateblue": (106, 90, 205),
    "slategray": (112, 128, 144),
    "slategrey": (112, 128, 144),
    "snow": (255, 250, 250),
    "springgreen": (0, 255, 127),
    "steelblue": (70, 130, 180),
    "tan": (210, 180, 140),
    "teal": (0, 128, 128),
    "thistle": (216, 191, 216),
    "tomato": (255, 99, 71),
    "turquoise": (64, 224, 208),
    "violet": (238, 130, 238),
    "wheat": (245, 222, 179),
    "white": (255, 255, 255),
    "whitesmoke": (245, 245, 245),
    "yellow": (255, 255, 0),
    "yellowgreen": (154, 205, 50),
}
