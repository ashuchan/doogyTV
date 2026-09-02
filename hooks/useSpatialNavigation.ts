import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, ScrollView } from "react-native";
import { useTVRemoteControl } from "./useTVRemoteControl";
import { isTVDevice, isGoogleTV } from "@/utils/tv-utils";
import { useTVNavigationStore } from "@/store/tv-navigation-store";

export interface SpatialGridRow {
  row: number;
  itemCount: number;
  onSelects?: Array<() => void>;
}

export interface UseSpatialNavigationOptions {
  enabled?: boolean;
  rows?: SpatialGridRow[];
  initialRow?: number;
  initialCol?: number;
  onBack?: () => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  onNavigateToSidebar?: () => void;
}

export function useSpatialNavigation({
  enabled = true,
  rows = [],
  initialRow = 0,
  initialCol = 0,
  onBack,
  scrollViewRef,
  onNavigateToSidebar,
}: UseSpatialNavigationOptions) {
  const [focusState, setFocusState] = useState<{ row: number; col: number }>({
    row: initialRow,
    col: initialCol,
  });

  const { activeZone, setActiveZone } = useTVNavigationStore();

  const focusRef = useRef(focusState);
  focusRef.current = focusState;

  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const handleRight = useCallback(() => {
    const { row, col } = focusRef.current;
    const currentRow = rowsRef.current.find((r) => r.row === row);
    if (!currentRow) return;

    if (col < currentRow.itemCount - 1) {
      const next = { row, col: col + 1 };
      focusRef.current = next;
      setFocusState(next);
    }
  }, []);

  const handleLeft = useCallback(() => {
    const { row, col } = focusRef.current;
    if (col > 0) {
      const next = { row, col: col - 1 };
      focusRef.current = next;
      setFocusState(next);
    } else if (col === 0) {
      setActiveZone("sidebar");
      if (onNavigateToSidebar) {
        onNavigateToSidebar();
      }
    }
  }, [onNavigateToSidebar, setActiveZone]);

  const handleDown = useCallback(() => {
    const { row, col } = focusRef.current;
    const maxRow = rowsRef.current.reduce((max, r) => Math.max(max, r.row), 0);
    
    if (row < maxRow) {
      const nextRowIdx = row + 1;
      const targetRow = rowsRef.current.find((r) => r.row === nextRowIdx);
      if (targetRow && targetRow.itemCount > 0) {
        const nextCol = Math.min(col, targetRow.itemCount - 1);
        const next = { row: nextRowIdx, col: nextCol };
        focusRef.current = next;
        setFocusState(next);
        
        // Scroll row into view smoothly
        if (scrollViewRef?.current) {
          try {
            scrollViewRef.current.scrollTo({
              y: nextRowIdx * 250,
              animated: true,
            });
          } catch (e) {
            // Ignore scroll errors
          }
        }
      }
    }
  }, [scrollViewRef]);

  const handleUp = useCallback(() => {
    const { row, col } = focusRef.current;
    if (row > 0) {
      const prevRowIdx = row - 1;
      const targetRow = rowsRef.current.find((r) => r.row === prevRowIdx);
      if (targetRow && targetRow.itemCount > 0) {
        const nextCol = Math.min(col, targetRow.itemCount - 1);
        const next = { row: prevRowIdx, col: nextCol };
        focusRef.current = next;
        setFocusState(next);
        
        // Scroll up smoothly
        if (scrollViewRef?.current) {
          try {
            scrollViewRef.current.scrollTo({
              y: Math.max(0, prevRowIdx * 250),
              animated: true,
            });
          } catch (e) {
            // Ignore scroll errors
          }
        }
      }
    }
  }, [scrollViewRef]);

  const handleSelect = useCallback(() => {
    const { row, col } = focusRef.current;
    const currentRow = rowsRef.current.find((r) => r.row === row);
    if (currentRow && currentRow.onSelects && currentRow.onSelects[col]) {
      currentRow.onSelects[col]();
    }
  }, []);

  // TV Remote hook integration for Android TV / Fire TV & Web fallback
  useTVRemoteControl({
    active: enabled && activeZone === "content",
    onUp: handleUp,
    onDown: handleDown,
    onLeft: handleLeft,
    onRight: handleRight,
    onSelect: handleSelect,
    onBack: onBack,
  });

  const isItemFocused = useCallback(
    (rowIndex: number, colIndex: number) => {
      return enabled && activeZone === "content" && focusState.row === rowIndex && focusState.col === colIndex;
    },
    [enabled, activeZone, focusState.row, focusState.col]
  );

  const setItemFocus = useCallback((row: number, col: number) => {
    setFocusState({ row, col });
  }, []);

  return {
    focusedRow: focusState.row,
    focusedCol: focusState.col,
    isItemFocused,
    setItemFocus,
    handleUp,
    handleDown,
    handleLeft,
    handleRight,
    handleSelect,
  };
}
