import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CategoryList } from "../CategoryList";
import { Channel } from "@/types/channel";

jest.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    colors: {
      text: "#FFFFFF",
      primary: "#06B6D4",
      card: "#1E293B",
      border: "#334155",
    },
  }),
}));

jest.mock("@/utils/tv-utils", () => ({
  isTVDevice: () => false,
  isLargeScreen: () => false,
  getFontSize: (s: number) => s,
  getSpacing: (s: number) => s,
  isGoogleTV: () => false,
}));

describe("CategoryList component", () => {
  const mockChannels: Channel[] = [
    {
      id: "c1",
      name: "Channel 1",
      url: "http://example.com/c1.m3u8",
      category: "Sports",
    },
    {
      id: "c2",
      name: "Channel 2",
      url: "http://example.com/c2.m3u8",
      category: "Sports",
    },
  ];

  it("should render category title and channels", () => {
    const onChannelPress = jest.fn();
    const { getAllByText, getByText } = render(
      <CategoryList
        category="Sports"
        channels={mockChannels}
        onChannelPress={onChannelPress}
        categoryIndex={1}
      />
    );

    expect(getAllByText("Sports").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Channel 1")).toBeTruthy();
    expect(getByText("Channel 2")).toBeTruthy();
  });

  it("should call onChannelPress when a channel card is clicked", () => {
    const onChannelPress = jest.fn();
    const { getByText } = render(
      <CategoryList
        category="Sports"
        channels={mockChannels}
        onChannelPress={onChannelPress}
        categoryIndex={1}
      />
    );

    fireEvent.press(getByText("Channel 1"));
    expect(onChannelPress).toHaveBeenCalledWith("c1");
  });
});
