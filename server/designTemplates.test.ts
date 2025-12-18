import { describe, it, expect, vi } from "vitest";
import { designTemplates, colorPalettes } from "@shared/designTemplates";

describe("Design Templates", () => {
  it("should have 20+ design templates defined", () => {
    expect(designTemplates.length).toBeGreaterThanOrEqual(20);
  });

  it("should have all required properties in each template", () => {
    for (const template of designTemplates) {
      expect(template).toHaveProperty("id");
      expect(template).toHaveProperty("name");
      expect(template).toHaveProperty("category");
      expect(template).toHaveProperty("layout");
      expect(template).toHaveProperty("defaultStyle");
      expect(template.layout).toHaveProperty("image");
      expect(template.layout).toHaveProperty("text");
    }
  });

  it("should have color palettes defined", () => {
    expect(colorPalettes.length).toBeGreaterThan(0);
  });

  it("should have all required properties in each palette", () => {
    for (const palette of colorPalettes) {
      expect(palette).toHaveProperty("id");
      expect(palette).toHaveProperty("name");
      expect(palette).toHaveProperty("colors");
      expect(palette.colors).toHaveProperty("background");
      expect(palette.colors).toHaveProperty("text");
      expect(palette.colors).toHaveProperty("accent");
    }
  });

  it("should have different layout categories", () => {
    const categories = new Set(designTemplates.map(t => t.category));
    expect(categories.size).toBeGreaterThan(3);
  });

  it("should have templates with different image positions", () => {
    const positions = new Set(designTemplates.map(t => t.layout.image.position));
    expect(positions.size).toBeGreaterThan(2);
  });

  it("should have templates for split layouts", () => {
    const splitTemplates = designTemplates.filter(t => t.category === 'split');
    expect(splitTemplates.length).toBeGreaterThan(0);
  });

  it("should have templates for fullbleed layouts", () => {
    const fullbleedTemplates = designTemplates.filter(t => t.category === 'fullbleed');
    expect(fullbleedTemplates.length).toBeGreaterThan(0);
  });

  it("should have templates for card layouts", () => {
    const cardTemplates = designTemplates.filter(t => t.category === 'card');
    expect(cardTemplates.length).toBeGreaterThan(0);
  });

  it("should have templates for minimal layouts", () => {
    const minimalTemplates = designTemplates.filter(t => t.category === 'minimal');
    expect(minimalTemplates.length).toBeGreaterThan(0);
  });
});

describe("Color Palettes", () => {
  it("should have at least 10 color palettes", () => {
    expect(colorPalettes.length).toBeGreaterThanOrEqual(10);
  });

  it("should have dark palettes", () => {
    const darkPalettes = colorPalettes.filter(p => p.id.includes('dark'));
    expect(darkPalettes.length).toBeGreaterThan(0);
  });

  it("should have light palettes", () => {
    const lightPalettes = colorPalettes.filter(p => p.id.includes('light'));
    expect(lightPalettes.length).toBeGreaterThan(0);
  });

  it("should have valid colors (hex or gradient)", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    const gradientRegex = /^linear-gradient/;
    for (const palette of colorPalettes) {
      // Background pode ser hex ou gradient
      expect(
        hexRegex.test(palette.colors.background) || gradientRegex.test(palette.colors.background)
      ).toBe(true);
      // Text e accent devem ser hex
      expect(palette.colors.text).toMatch(hexRegex);
      expect(palette.colors.accent).toMatch(hexRegex);
    }
  });
});
