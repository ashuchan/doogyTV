import { Platform, Dimensions } from "react-native";
import { 
  isTVDevice, 
  isLargeScreen, 
  isLandscapeMode, 
  isGoogleTV, 
  getFontSize, 
  getSpacing,
  getGridColumns,
  getContentMaxWidth,
  getLayoutDirection
} from "../tv-utils";

jest.mock("react-native", () => {
  const Platform = {
    OS: "android",
    isTV: false,
  };
  const Dimensions = {
    get: jest.fn().mockReturnValue({ width: 360, height: 640 }),
  };
  return { Platform, Dimensions };
});

describe("tv-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "android";
    Platform.isTV = false;
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 360, height: 640 });
  });

  describe("isTVDevice", () => {
    it("should return true if Platform.isTV is true", () => {
      Platform.isTV = true;
      expect(isTVDevice()).toBe(true);
    });

    it("should return true if OS is android and dimensions are large", () => {
      Platform.isTV = false;
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1920, height: 1080 });
      expect(isTVDevice()).toBe(true);
    });

    it("should return false on standard mobile device", () => {
      Platform.isTV = false;
      expect(isTVDevice()).toBe(false);
    });
  });

  describe("isLargeScreen", () => {
    it("should return true for large width", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 800, height: 600 });
      expect(isLargeScreen()).toBe(true);
    });

    it("should return false for mobile width", () => {
      expect(isLargeScreen()).toBe(false);
    });
  });

  describe("isLandscapeMode", () => {
    it("should return true when width > height", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 640, height: 360 });
      expect(isLandscapeMode()).toBe(true);
    });

    it("should return false when height > width", () => {
      expect(isLandscapeMode()).toBe(false);
    });
  });

  describe("isGoogleTV", () => {
    it("should return true for TV devices on Android", () => {
      Platform.OS = "android";
      Platform.isTV = true;
      expect(isGoogleTV()).toBe(true);
    });

    it("should return true if android and aspect ratio matches Google TV spec", () => {
      Platform.OS = "android";
      Platform.isTV = false;
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1280, height: 720 });
      expect(isGoogleTV()).toBe(true);
    });
  });

  describe("getFontSize", () => {
    it("should cap large font headers to 28px on TV device", () => {
      Platform.isTV = true;
      expect(getFontSize(24)).toBeCloseTo(27.6, 2);
      expect(getFontSize(32)).toBe(28);
    });

    it("should scale small body texts up to a minimum of 14px on TV", () => {
      Platform.isTV = true;
      expect(getFontSize(10)).toBe(14);
    });

    it("should behave normally on mobile", () => {
      Platform.isTV = false;
      expect(getFontSize(16)).toBe(16);
    });
  });

  describe("getSpacing", () => {
    it("should scale spacing up on TV", () => {
      Platform.isTV = true;
      expect(getSpacing(8)).toBe(12);
    });

    it("should return standard spacing on mobile", () => {
      Platform.isTV = false;
      expect(getSpacing(8)).toBe(8);
    });
  });

  describe("getGridColumns", () => {
    it("should return 6 columns on very large screens", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1700 });
      expect(getGridColumns()).toBe(6);
    });

    it("should return 2 columns on mobile screens", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 360 });
      expect(getGridColumns()).toBe(2);
    });
  });

  describe("getContentMaxWidth", () => {
    it("should center layout content max-width on large screens", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1300 });
      expect(getContentMaxWidth()).toBe(1100);
    });

    it("should use full width on small screens", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 500 });
      expect(getContentMaxWidth()).toBe(500);
    });
  });

  describe("getLayoutDirection", () => {
    it("should return row for large screens", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1000 });
      expect(getLayoutDirection()).toBe("row");
    });

    it("should return column for mobile", () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 360 });
      expect(getLayoutDirection()).toBe("column");
    });
  });
});
