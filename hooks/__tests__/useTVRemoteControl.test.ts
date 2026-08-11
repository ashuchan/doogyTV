import { renderHook } from "@testing-library/react-native";
import { useTVRemoteControl } from "../useTVRemoteControl";
import { Platform } from "react-native";

// Mock the window global for react-native environment
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

beforeAll(() => {
  global.window = {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  } as any;
});

const mockEnable = jest.fn();
const mockDisable = jest.fn();

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  // Safely define TVEventHandler on actual to preserve lazy-load getters
  Object.defineProperty(actual, "TVEventHandler", {
    value: class MockTVEventHandler {
      enable = mockEnable;
      disable = mockDisable;
    },
    writable: true,
  });
  return actual;
});

describe("useTVRemoteControl", () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", {
      value: originalOS,
      configurable: true,
    });
  });

  it("should setup keydown event listener on Web", () => {
    Object.defineProperty(Platform, "OS", {
      value: "web",
      configurable: true,
    });

    const onUp = jest.fn();

    const { unmount } = renderHook(() =>
      useTVRemoteControl({ onUp, active: true })
    );

    expect(mockAddEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should handle keydown events on Web", () => {
    Object.defineProperty(Platform, "OS", {
      value: "web",
      configurable: true,
    });

    const onUp = jest.fn();
    const onDown = jest.fn();
    const onLeft = jest.fn();
    const onRight = jest.fn();
    const onSelect = jest.fn();
    const onBack = jest.fn();

    renderHook(() =>
      useTVRemoteControl({
        onUp,
        onDown,
        onLeft,
        onRight,
        onSelect,
        onBack,
        active: true,
      })
    );

    expect(mockAddEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
    const registeredCallback = mockAddEventListener.mock.calls[0][1];

    const keys = {
      ArrowUp: onUp,
      ArrowDown: onDown,
      ArrowLeft: onLeft,
      ArrowRight: onRight,
      Enter: onSelect,
      Escape: onBack,
    };

    Object.entries(keys).forEach(([key, callback]) => {
      const preventDefault = jest.fn();
      registeredCallback({ key, preventDefault });
      expect(callback).toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  it("should setup and trigger TVEventHandler on Native platforms", () => {
    Object.defineProperty(Platform, "OS", {
      value: "android",
      configurable: true,
    });

    const onUp = jest.fn();
    const onDown = jest.fn();
    const onLeft = jest.fn();
    const onRight = jest.fn();
    const onSelect = jest.fn();
    const onBack = jest.fn();

    const { unmount } = renderHook(() =>
      useTVRemoteControl({
        onUp,
        onDown,
        onLeft,
        onRight,
        onSelect,
        onBack,
        active: true,
      })
    );

    expect(mockEnable).toHaveBeenCalled();
    const eventHandlerCallback = mockEnable.mock.calls[0][1];

    const nativeEvents = {
      up: onUp,
      down: onDown,
      left: onLeft,
      right: onRight,
      select: onSelect,
      back: onBack,
    };

    Object.entries(nativeEvents).forEach(([eventType, callback]) => {
      eventHandlerCallback(null, { eventType });
      expect(callback).toHaveBeenCalled();
    });

    unmount();
    expect(mockDisable).toHaveBeenCalled();
  });
});
