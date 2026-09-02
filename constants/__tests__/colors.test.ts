import colors, { lightColors, darkColors } from "../colors";

describe("colors constants", () => {
  it("should have correct lightColors theme details", () => {
    expect(lightColors.primary).toBe("#FFB338");
    expect(lightColors.background).toBe("#FFF8F0");
    expect(lightColors.text).toBe("#12131C");
  });

  it("should have correct darkColors cute and cozy theme values", () => {
    expect(darkColors.primary).toBe("#FFB338"); // Puppy Honey Gold (10.1:1 AAA)
    expect(darkColors.background).toBe("#12131C"); // Deep Midnight Charcoal
    expect(darkColors.card).toBe("#1E1F2E"); // Warm Slate Panel
    expect(darkColors.accent).toBe("#FF7582"); // Kitten Coral
    expect(darkColors.text).toBe("#FFF8F0"); // Warm Milk White (17.2:1 AAA)
    expect(darkColors.textInverted).toBe("#12131C"); // Dark Charcoal on Honey Gold
  });

  it("should export themes under default object", () => {
    expect(colors.light).toBe(lightColors);
    expect(colors.dark).toBe(darkColors);
  });
});
