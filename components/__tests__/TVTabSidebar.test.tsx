import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { TVTabSidebar } from "../TVTabSidebar";

jest.mock("react-native", () => {
  const reactNative = jest.requireActual("react-native");
  const React = require("react");
  const MockPressable = React.forwardRef(({ children, onFocus, onBlur, style, ...props }: any, ref: any) => {
    return (
      <reactNative.View
        ref={ref}
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}
      >
        {children}
      </reactNative.View>
    );
  });
  MockPressable.displayName = "Pressable";
  
  return new Proxy(reactNative, {
    get(target, prop) {
      if (prop === "Pressable") {
        return MockPressable;
      }
      return target[prop];
    }
  });
});

jest.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    colors: {
      background: "#090D16",
      border: "rgba(255, 255, 255, 0.05)",
      info: "#06B6D4",
      text: "#F3F4F6",
    },
  }),
}));

// Mock tv-utils to force TV layout
jest.mock("@/utils/tv-utils", () => ({
  isTVDevice: jest.fn().mockReturnValue(true),
  isGoogleTV: jest.fn().mockReturnValue(false),
}));

describe("TVTabSidebar component", () => {
  const mockState = {
    routes: [
      { key: "index-tab", name: "index" },
      { key: "channels-tab", name: "channels" },
    ],
    index: 0,
  };

  const mockDescriptors = {
    "index-tab": { options: { title: "Home" } },
    "channels-tab": { options: { title: "Channels" } },
  };

  const mockNavigation = {
    emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render collapsed sidebar routes correctly", () => {
    const { getByText, queryByText } = render(
      <TVTabSidebar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigation}
      />
    );

    expect(getByText("dTV")).toBeTruthy();
    expect(queryByText("Home")).toBeNull();
  });

  it("should expand on focus and call navigation emit on item press", () => {
    const { getByTestId, getByText } = render(
      <TVTabSidebar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigation}
      />
    );

    const indexItem = getByTestId("sidebar-nav-index");
    
    // Simulate focus
    act(() => {
      fireEvent(indexItem, "onFocus");
    });

    // Sidebar should expand and show logo title "doggyTV"
    expect(getByText("doggyTV")).toBeTruthy();
    expect(getByText("Home")).toBeTruthy();

    // Click index nav item
    fireEvent.press(indexItem);
    expect(mockNavigation.emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "index-tab",
      canPreventDefault: true,
    });
  });

  it("should collapse after blur timeout", () => {
    jest.useFakeTimers();

    const { getByTestId, getByText, queryByText } = render(
      <TVTabSidebar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigation}
      />
    );

    const indexItem = getByTestId("sidebar-nav-index");
    
    // First focus to expand
    act(() => {
      fireEvent(indexItem, "onFocus");
    });
    expect(getByText("doggyTV")).toBeTruthy();

    // Now blur
    act(() => {
      fireEvent(indexItem, "onBlur");
    });

    // Fast-forward timers for sidebar collapse timeout
    act(() => {
      jest.runAllTimers();
    });

    // Should be collapsed now
    expect(getByText("dTV")).toBeTruthy();
    expect(queryByText("Home")).toBeNull();

    jest.useRealTimers();
  });
});
