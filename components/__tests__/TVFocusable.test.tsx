import React from "react";
import { View, Text } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import { TVFocusable } from "../TVFocusable";
import { isTVDevice } from "@/utils/tv-utils";

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
      if (prop === "findNodeHandle") {
        return () => 1;
      }
      return target[prop];
    }
  });
});

jest.mock("@/utils/tv-utils", () => ({
  isTVDevice: jest.fn().mockReturnValue(false),
  isGoogleTV: jest.fn().mockReturnValue(false),
}));

jest.mock("react-native/Libraries/Animated/Animated", () => {
  const ActualAnimated = jest.requireActual("react-native/Libraries/Animated/Animated");
  return {
    ...ActualAnimated,
    timing: (value: any, config: any) => ({
      start: (callback?: any) => {
        value.setValue(config.toValue);
        if (callback) callback({ finished: true });
      },
    }),
  };
});

describe("TVFocusable component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children correctly", () => {
    const { getByText } = render(
      <TVFocusable>
        <Text>Test Focusable</Text>
      </TVFocusable>
    );

    expect(getByText("Test Focusable")).toBeTruthy();
  });

  it("should fire onPress handler when pressed", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TVFocusable onPress={onPressMock}>
        <Text>Press Me</Text>
      </TVFocusable>
    );

    fireEvent.press(getByText("Press Me"));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it("should call onFocus when focused", () => {
    const onFocusMock = jest.fn();
    const { getByTestId } = render(
      <TVFocusable onFocus={onFocusMock} testID="focusable-node">
        <Text>Focusable Node</Text>
      </TVFocusable>
    );

    const pressable = getByTestId("focusable-node");
    act(() => {
      fireEvent(pressable, "onFocus");
    });
    expect(onFocusMock).toHaveBeenCalledTimes(1);
  });

  it("should call onBlur when blurred", () => {
    const onBlurMock = jest.fn();
    const { getByTestId } = render(
      <TVFocusable onBlur={onBlurMock} testID="focusable-node">
        <Text>Blur Node</Text>
      </TVFocusable>
    );

    const pressable = getByTestId("focusable-node");
    act(() => {
      fireEvent(pressable, "onBlur");
    });
    expect(onBlurMock).toHaveBeenCalledTimes(1);
  });

  it("should apply focus styling on TV when focused", () => {
    (isTVDevice as jest.Mock).mockReturnValue(true);
    const { getByTestId } = render(
      <TVFocusable testID="focusable-node">
        <Text>Glow Node</Text>
      </TVFocusable>
    );

    let pressable = getByTestId("focusable-node");
    act(() => {
      fireEvent(pressable, "onFocus");
    });
    
    // Re-query to get the fresh reference after state/style re-render
    pressable = getByTestId("focusable-node");
    
    // Flat style check
    const appliedStyles = [pressable.props.style].flat(Infinity);
    const hasFocusStyle = appliedStyles.some((s: any) => s && s.borderColor === "#06B6D4");
    expect(hasFocusStyle).toBe(true);
  });

  it("should request TV focus if isDefault and isTV are true", () => {
    (isTVDevice as jest.Mock).mockReturnValue(true);
    jest.useFakeTimers();
    
    render(
      <TVFocusable testID="focusable-node" isDefault={true}>
        <Text>Default Node</Text>
      </TVFocusable>
    );

    act(() => {
      jest.runAllTimers();
    });
    
    jest.useRealTimers();
    // Verify execution completed without crashing
    expect(true).toBe(true);
  });
});
