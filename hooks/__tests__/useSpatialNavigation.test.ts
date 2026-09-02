import { renderHook, act } from "@testing-library/react-native";
import { useSpatialNavigation } from "../useSpatialNavigation";

jest.mock("@/utils/tv-utils", () => ({
  isTVDevice: jest.fn().mockReturnValue(true),
  isGoogleTV: jest.fn().mockReturnValue(false),
}));

describe("useSpatialNavigation hook", () => {
  const mockOnSelect00 = jest.fn();
  const mockOnSelect01 = jest.fn();
  const mockOnSelect10 = jest.fn();
  const mockOnBack = jest.fn();

  const testRows = [
    { row: 0, itemCount: 3, onSelects: [mockOnSelect00, mockOnSelect01, jest.fn()] },
    { row: 1, itemCount: 2, onSelects: [mockOnSelect10, jest.fn()] },
  ];

  it("should initialize at [0, 0] and report isItemFocused correctly", () => {
    const { result } = renderHook(() =>
      useSpatialNavigation({
        enabled: true,
        rows: testRows,
        onBack: mockOnBack,
      })
    );

    expect(result.current.focusedRow).toBe(0);
    expect(result.current.focusedCol).toBe(0);
    expect(result.current.isItemFocused(0, 0)).toBe(true);
    expect(result.current.isItemFocused(0, 1)).toBe(false);
  });

  it("should navigate right and left across columns", () => {
    const { result } = renderHook(() =>
      useSpatialNavigation({
        enabled: true,
        rows: testRows,
      })
    );

    act(() => {
      result.current.handleRight();
    });
    expect(result.current.focusedCol).toBe(1);
    expect(result.current.isItemFocused(0, 1)).toBe(true);

    act(() => {
      result.current.handleLeft();
    });
    expect(result.current.focusedCol).toBe(0);
    expect(result.current.isItemFocused(0, 0)).toBe(true);
  });

  it("should navigate down and up across rows", () => {
    const { result } = renderHook(() =>
      useSpatialNavigation({
        enabled: true,
        rows: testRows,
      })
    );

    act(() => {
      result.current.handleDown();
    });
    expect(result.current.focusedRow).toBe(1);
    expect(result.current.isItemFocused(1, 0)).toBe(true);

    act(() => {
      result.current.handleUp();
    });
    expect(result.current.focusedRow).toBe(0);
    expect(result.current.isItemFocused(0, 0)).toBe(true);
  });

  it("should trigger onSelect for currently focused item on handleSelect", () => {
    const { result } = renderHook(() =>
      useSpatialNavigation({
        enabled: true,
        rows: testRows,
      })
    );

    act(() => {
      result.current.handleSelect();
    });
    expect(mockOnSelect00).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleRight();
      result.current.handleSelect();
    });
    expect(mockOnSelect01).toHaveBeenCalledTimes(1);
  });
});
