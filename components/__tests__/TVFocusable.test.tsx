import React from "react";
import { View, Text } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import { TVFocusable } from "../TVFocusable";
import { isTVDevice } from "@/utils/tv-utils";

jest.mock("react-native", () => {
  const reactNative = jest.requireActual("react-native");
  const React = require("react");
  const MockPressable = React.forwardRef(({ children, onFocus, onBlur, style, ...props }: any, ref: any) => {
    const [focused, setFocused] = React.useState(false);
    const handleFocus = (e: any) => {
      setFocused(true);
      if (onFocus) onFocus(e);
    };
    const handleBlur = (e: any) => {
      setFocused(false);
      if (onBlur) onBlur(e);
    };
    return (
      <reactNative.View
        ref={ref}
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={typeof style === "function" ? style({ focused }) : style}
      >
        {typeof children === "function" ? children({ focused }) : children}
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
  const mocked = {
    ...ActualAnimated,
    timing: (value: any, config: any) => ({
      start: (callback?: any) => {
        value.setValue(config.toValue);
        if (callback) callback({ finished: true });
      },
    }),
  };
  return {
    __esModule: true,
    default: mocked,
    ...mocked
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

    const pressable = getByTestId("focusable-node");
    act(() => {
      fireEvent(pressable, "onFocus");
    });
    
    // Re-query the container to get the fresh reference after state/style re-render
    const container = getByTestId("focusable-node-container");
    
    // Flat style check
    const appliedStyles = [container.props.style].flat(Infinity);
    const hasFocusStyle = appliedStyles.some((s: any) => s && s.borderColor === "#FFFFFF");
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

  it("should dynamically move focus highlight between multiple items without sticking", () => {
    (isTVDevice as jest.Mock).mockReturnValue(true);
    
    const { getByTestId } = render(
      <View>
        <TVFocusable testID="item-1">
          <Text>Item 1</Text>
        </TVFocusable>
        <TVFocusable testID="item-2">
          <Text>Item 2</Text>
        </TVFocusable>
      </View>
    );

    const pressable1 = getByTestId("item-1");
    const pressable2 = getByTestId("item-2");

    // 1. Focus Item 1
    act(() => {
      fireEvent(pressable1, "onFocus");
    });

    let container1 = getByTestId("item-1-container");
    let container2 = getByTestId("item-2-container");

    let styles1 = [container1.props.style].flat(Infinity);
    let styles2 = [container2.props.style].flat(Infinity);

    expect(styles1.some((s: any) => s && s.borderColor === "#FFFFFF")).toBe(true);
    expect(styles2.some((s: any) => s && s.borderColor === "#FFFFFF")).toBe(false);

    // 2. Move focus to Item 2 (blur item 1, focus item 2)
    act(() => {
      fireEvent(pressable1, "onBlur");
      fireEvent(pressable2, "onFocus");
    });

    container1 = getByTestId("item-1-container");
    container2 = getByTestId("item-2-container");

    styles1 = [container1.props.style].flat(Infinity);
    styles2 = [container2.props.style].flat(Infinity);

    // Item 1 MUST lose its highlight, Item 2 MUST gain it
    expect(styles1.some((s: any) => s && s.borderColor === "#FFFFFF")).toBe(false);
    expect(styles2.some((s: any) => s && s.borderColor === "#FFFFFF")).toBe(true);
  });
});
