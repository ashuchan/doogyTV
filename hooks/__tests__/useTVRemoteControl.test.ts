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

describe("useTVRemoteControl", () => {
  const mockEnable = jest.fn();
  const mockDisable = jest.fn();
  const mockEventHandler = {
    enable: mockEnable,
    disable: mockDisable,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should setup keydown event listener on Web", () => {
    jest.replaceProperty(Platform, "OS", "web");

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

    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should not setup listeners when active is false", () => {
    jest.replaceProperty(Platform, "OS", "web");

    renderHook(() =>
      useTVRemoteControl({
        active: false,
        eventHandler: mockEventHandler,
      })
    );

    expect(mockAddEventListener).not.toHaveBeenCalled();
    expect(mockEnable).not.toHaveBeenCalled();
  });

  it("should setup and trigger TVEventHandler on Native platforms", () => {
    jest.replaceProperty(Platform, "OS", "android");

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
        eventHandler: mockEventHandler,
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
