import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CuteEmptyState } from "../CuteEmptyState";
import { CuteLoadingIndicator } from "../CuteLoadingIndicator";
import * as tvUtils from "@/utils/tv-utils";

jest.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    colors: {
      background: "#12131C",
      surface: "#1E1F2E",
      card: "#1E1F2E",
      primary: "#FFB338",
      accent: "#FF7582",
      text: "#FFF8F0",
      textInverted: "#12131C",
      textSecondary: "#A59E98",
    },
  }),
}));

describe("Cute Components Suite", () => {
  beforeEach(() => {
    jest.spyOn(tvUtils, "isTVDevice").mockReturnValue(false);
    jest.spyOn(tvUtils, "isGoogleTV").mockReturnValue(false);
  });

  describe("CuteEmptyState", () => {
    it("should render title and description correctly", () => {
      const { getByText } = render(
        <CuteEmptyState
          icon="🐶"
          title="Ruff day! No channels found."
          description="Try checking for typos."
        />
      );

      expect(getByText("🐶")).toBeTruthy();
      expect(getByText("Ruff day! No channels found.")).toBeTruthy();
      expect(getByText("Try checking for typos.")).toBeTruthy();
    });

    it("should render and trigger action button when provided", () => {
      const onActionMock = jest.fn();
      const { getByText } = render(
        <CuteEmptyState
          title="Empty list"
          actionLabel="Add Playlist"
          onAction={onActionMock}
        />
      );

      const actionBtn = getByText("Add Playlist");
      expect(actionBtn).toBeTruthy();
      fireEvent.press(actionBtn);
      expect(onActionMock).toHaveBeenCalledTimes(1);
    });

    it("should render focusable action button on TV device", () => {
      (tvUtils.isTVDevice as jest.Mock).mockReturnValue(true);
      const onActionMock = jest.fn();
      const { getByTestId, getByText } = render(
        <CuteEmptyState
          title="TV Empty"
          actionLabel="Go to Settings"
          onAction={onActionMock}
          testID="custom-empty"
        />
      );

      expect(getByTestId("custom-empty")).toBeTruthy();
      expect(getByText("Go to Settings")).toBeTruthy();
    });
  });

  describe("CuteLoadingIndicator", () => {
    it("should render loading message and mascot icon", () => {
      const { getByText, getByTestId } = render(
        <CuteLoadingIndicator message="Tuning into channel..." />
      );

      expect(getByTestId("cute-loading-indicator")).toBeTruthy();
      expect(getByText("🐶")).toBeTruthy();
      expect(getByText("🐾")).toBeTruthy();
      expect(getByText("Tuning into channel...")).toBeTruthy();
    });
  });
});
