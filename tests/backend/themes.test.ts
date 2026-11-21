import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateThemeCss } from "@termix-ssh/plugin-sdk/manifest";

const root = path.resolve(import.meta.dirname, "../..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);
const locale = JSON.parse(
  fs.readFileSync(path.join(root, "locales/en.json"), "utf8"),
);
const themes = manifest.contributes.themes as {
  id: string;
  label: string;
  mode: string;
  css: string;
}[];

describe("classic themes", () => {
  it("declares the ui:theme capability and nothing else", () => {
    expect(manifest.capabilities).toEqual(["ui:theme"]);
  });

  it("keeps the ids existing users already saved, dark first as it is the default", () => {
    expect(themes.map((theme) => theme.id)).toEqual([
      "dark",
      "light",
      "dracula",
      "catppuccin",
      "nord",
      "solarized",
      "tokyo-night",
      "one-dark",
      "gruvbox",
      "high-contrast-dark",
      "high-contrast-light",
      "colorblind-dark",
      "colorblind-light",
    ]);
  });

  it.each(themes)("$id has safe css scoped under its class", (theme) => {
    const css = fs.readFileSync(path.join(root, theme.css), "utf8");
    expect(validateThemeCss(css, theme.id)).toEqual([]);
    expect(css).toContain("--background:");
    expect(css).toContain("--foreground:");
    expect(css).toContain("--terminal-bg:");
  });

  it.each(themes)("$id has a label in the locale", (theme) => {
    const key = theme.label.replace(/^theme\./, "");
    expect(typeof locale.theme[key]).toBe("string");
  });
});

function tokens(id: string): Record<string, string> {
  const css = fs.readFileSync(path.join(root, `themes/${id}.css`), "utf8");
  return Object.fromEntries(
    [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("accessible themes", () => {
  it.each(["high-contrast-dark", "high-contrast-light"])(
    "%s meets WCAG AAA for text and 3:1 for borders",
    (id) => {
      const t = tokens(id);
      for (const fg of ["--foreground", "--muted-foreground"]) {
        expect(contrast(t[fg], t["--background"])).toBeGreaterThanOrEqual(7);
      }
      expect(contrast(t["--border"], t["--background"])).toBeGreaterThanOrEqual(
        3,
      );
    },
  );

  it.each(["colorblind-dark", "colorblind-light"])(
    "%s swaps green for blue and red for orange",
    (id) => {
      const t = tokens(id);
      const hue = (hex: string) => {
        const [r, g, b] = [1, 3, 5].map((i) =>
          parseInt(hex.slice(i, i + 2), 16),
        );
        return { r, g, b };
      };
      const good = hue(t["--color-green-500"]);
      const bad = hue(t["--color-red-500"]);
      expect(good.b).toBeGreaterThan(good.g);
      expect(bad.g).toBeGreaterThan(0x30);
      expect(t["--destructive"]).toBe(t["--color-red-500"]);
      expect(
        Math.abs(luminance(t["--warning"]) - luminance(t["--destructive"])),
      ).toBeGreaterThan(0.15);
    },
  );
});
