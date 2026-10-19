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
