"""Records the dashboard preview into public/screenshots/dashboard-demo.gif and static PNGs.

Usage: python3 scripts/record-demo.py [base_url]   (default http://localhost:3100, the site dev server)
Needs Google Chrome and Pillow.
"""
import os
import subprocess
import sys
import tempfile
import time

from PIL import Image

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100") + "/extension-preview/dashboard.html"
CHROME = os.environ.get("CHROME_BIN", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "screenshots")
STEPS = 6
WIDTH, HEIGHT = 520, 1180


def shoot(url: str, path: str, height: int = HEIGHT) -> None:
    """Chrome writes the screenshot but its updater keeps the process alive, so wait for the file instead."""
    if os.path.exists(path):
        os.remove(path)
    with tempfile.TemporaryDirectory() as profile:
        proc = subprocess.Popen(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
             "--use-mock-keychain", "--password-store=basic", "--no-first-run", "--no-default-browser-check",
             f"--window-size={WIDTH},{height}", f"--screenshot={path}", url],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        try:
            deadline = time.time() + 45
            last = -1
            while time.time() < deadline:
                size = os.path.getsize(path) if os.path.exists(path) else 0
                if size and size == last:
                    return
                last = size
                time.sleep(0.5)
            raise TimeoutError(f"no screenshot for {url}")
        finally:
            proc.kill()


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        frames = []
        for step in range(STEPS):
            path = os.path.join(tmp, f"step{step}.png")
            shoot(f"{BASE}?theme=dark&demo={step}", path)
            frames.append(Image.open(path).convert("RGB"))
        palette = frames[0].quantize(colors=128, method=Image.Quantize.MEDIANCUT)
        frames = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
        gif = os.path.join(OUT, "dashboard-demo.gif")
        frames[0].save(gif, save_all=True, append_images=frames[1:], duration=2200, loop=0, optimize=True)
        print(f"wrote {gif} ({os.path.getsize(gif) // 1024} KB)")
    for theme in ("dark", "light"):
        png = os.path.join(OUT, f"dashboard-{theme}.png")
        shoot(f"{BASE}?theme={theme}&demo=0&caption=0", png, 1450)
        print(f"wrote {png}")


if __name__ == "__main__":
    main()
