import colors, { lightColors, darkColors } from "../colors";

describe("colors constants", () => {
  it("should have correct lightColors theme details", () => {
    expect(lightColors.primary).toBe("#4361ee");
    expect(lightColors.background).toBe("#f8f9fa");
  });

  it("should have correct darkColors cinematic theme values", () => {
    expect(darkColors.primary).toBe("#4F46E5"); // Indigo accent
    expect(darkColors.background).toBe("#090D16"); // Charcoal gradient bg
    expect(darkColors.backgroundEnd).toBe("#111827");
    expect(darkColors.info).toBe("#06B6D4"); // Neon cyan highlight
    expect(darkColors.card).toBe("#1E293B"); // Solid slate fallback
  });

  it("should export themes under default object", () => {
    expect(colors.light).toBe(lightColors);
    expect(colors.dark).toBe(darkColors);
  });
});
