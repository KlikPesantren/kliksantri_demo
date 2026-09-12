from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
WALI_ASSETS = ROOT / "wali-app" / "assets"
KHODIMUL_ASSETS = ROOT / "frontend" / "public"
ARTIFACTS = ROOT / "artifacts"
SOURCE = WALI_ASSETS / "universal-walisantri-symbol-source.png"

CANVAS = 1024
SYMBOL_MAX = 553  # 54.0% of the canvas; conservative across launcher masks.
GREEN = (7, 138, 70, 255)
OFF_WHITE = (247, 250, 248, 255)


def extract_symbol_mask(source):
    rgba = source.convert("RGBA")
    source_alpha = rgba.getchannel("A")
    if source_alpha.getextrema() != (255, 255):
        bbox = source_alpha.point(lambda value: 255 if value > 10 else 0).getbbox()
        if not bbox:
            raise RuntimeError("Universal WaliSantri symbol was not found")
        return source_alpha.crop(bbox)
    rgb = source.convert("RGB")
    red = rgb.getchannel("R")
    # The approved source is bimodal: green background R<=10, white mark R>=21.
    # Preserve its anti-aliased edge while removing only the green background.
    alpha = red.point(lambda value: max(0, min(255, round((value - 10) * 255 / 245))))
    bbox = alpha.point(lambda value: 255 if value > 10 else 0).getbbox()
    if not bbox:
        raise RuntimeError("Universal WaliSantri symbol was not found")
    return alpha.crop(bbox)


def centered_mark(mask, color):
    width, height = mask.size
    scale = SYMBOL_MAX / max(width, height)
    size = (round(width * scale), round(height * scale))
    resized = mask.resize(size, Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", size, color)
    layer.putalpha(resized)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(layer, ((CANVAS - size[0]) // 2, (CANVAS - size[1]) // 2))
    return canvas


def composite(background, foreground):
    canvas = Image.new("RGBA", (CANVAS, CANVAS), background)
    canvas.alpha_composite(foreground)
    return canvas


def save_resized(image, path, size):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.Resampling.LANCZOS).save(path, optimize=True)


def mask_preview(wali_icon, khodimul_icon):
    tile = 256
    gap = 24
    label_height = 28
    preview = Image.new("RGBA", (tile * 3 + gap * 4, (tile + label_height) * 2 + gap * 3), (226, 232, 228, 255))
    draw = ImageDraw.Draw(preview)
    labels = ("Circle", "Rounded square", "Squircle")

    def shape_mask(kind):
        mask = Image.new("L", (tile, tile), 0)
        shape = ImageDraw.Draw(mask)
        if kind == "Circle":
            shape.ellipse((0, 0, tile - 1, tile - 1), fill=255)
        elif kind == "Rounded square":
            shape.rounded_rectangle((0, 0, tile - 1, tile - 1), radius=56, fill=255)
        else:
            # Superellipse x^4 + y^4 <= 1, representative of a launcher squircle.
            pixels = mask.load()
            center = (tile - 1) / 2
            radius = center
            for y in range(tile):
                for x in range(tile):
                    if abs((x - center) / radius) ** 4 + abs((y - center) / radius) ** 4 <= 1:
                        pixels[x, y] = 255
        return mask

    for row, icon in enumerate((wali_icon, khodimul_icon)):
        small = icon.resize((tile, tile), Image.Resampling.LANCZOS)
        for col, label in enumerate(labels):
            x = gap + col * (tile + gap)
            y = gap + row * (tile + label_height + gap)
            masked = Image.new("RGBA", (tile, tile), (0, 0, 0, 0))
            masked.paste(small, (0, 0), shape_mask(label))
            preview.alpha_composite(masked, (x, y))
            draw.text((x, y + tile + 7), label, fill=(23, 52, 37, 255))
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    preview.save(ARTIFACTS / "universal-icon-mask-preview.png", optimize=True)


def main():
    source = Image.open(SOURCE)
    white_mark = centered_mark(extract_symbol_mask(source), (255, 255, 255, 255))
    green_mark = centered_mark(extract_symbol_mask(source), GREEN)

    wali_icon = composite(GREEN, white_mark)
    khodimul_icon = composite(OFF_WHITE, green_mark)

    wali_icon.save(WALI_ASSETS / "universal-walisantri-icon-1024.png", optimize=True)
    white_mark.save(WALI_ASSETS / "universal-walisantri-foreground-1024.png", optimize=True)
    white_mark.save(WALI_ASSETS / "universal-walisantri-splash-1024.png", optimize=True)
    white_mark.save(WALI_ASSETS / "universal-walisantri-monochrome-1024.png", optimize=True)

    save_resized(khodimul_icon, KHODIMUL_ASSETS / "branding-khodimul-mahad-icon-192.png", 192)
    save_resized(khodimul_icon, KHODIMUL_ASSETS / "branding-khodimul-mahad-icon-512.png", 512)
    mask_preview(wali_icon, khodimul_icon)

    print("Universal icon family generated from the existing WaliSantri symbol.")


if __name__ == "__main__":
    main()
