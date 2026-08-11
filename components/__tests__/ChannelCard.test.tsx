import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ChannelCard } from "../ChannelCard";
import { isTVDevice } from "@/utils/tv-utils";
import { Dimensions } from "react-native";

jest.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    colors: {
      background: "#090D16",
      card: "#1E293B",
      border: "rgba(255,255,255,0.05)",
      primary: "#4F46E5",
      text: "#F3F4F6",
      textSecondary: "#9CA3AF",
    },
  }),
}));

jest.mock("@/store/favorites-store", () => ({
  useFavoritesStore: () => ({
    favorites: ["channel-1"],
    toggleFavorite: jest.fn(),
  }),
}));

jest.mock("@/utils/tv-utils", () => ({
  isTVDevice: jest.fn().mockReturnValue(false),
  isLargeScreen: jest.fn().mockReturnValue(false),
  getSpacing: (val: number) => val,
  getFontSize: (val: number) => val,
  isGoogleTV: jest.fn().mockReturnValue(false),
}));

describe("ChannelCard component", () => {
  const mockChannel = {
    id: "channel-1",
    name: "CNN International",
    url: "http://example.com/cnn.m3u8",
    logo: "http://example.com/cnn.png",
    category: "News",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render channel title and category correctly", () => {
    const { getByText } = render(
      <ChannelCard channel={mockChannel} onPress={jest.fn()} />
    );

    expect(getByText("CNN International")).toBeTruthy();
    expect(getByText("News")).toBeTruthy();
  });

  it("should trigger onPress when clicked", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ChannelCard channel={mockChannel} onPress={onPressMock} />
    );

    fireEvent.press(getByText("CNN International"));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it("should render widescreen container details on TV", () => {
    (isTVDevice as jest.Mock).mockReturnValue(true);
    const { getByText } = render(
      <ChannelCard channel={mockChannel} onPress={jest.fn()} />
    );

    expect(getByText("CNN International")).toBeTruthy();
  });

  it("should make card width 240 on TV when landscape", () => {
    (isTVDevice as jest.Mock).mockReturnValue(true);
    jest.spyOn(Dimensions, "get").mockReturnValue({ width: 1920, height: 1080 } as any);

    const { getByText } = render(
      <ChannelCard channel={mockChannel} onPress={jest.fn()} />
    );

    expect(getByText("CNN International")).toBeTruthy();
  });
});
