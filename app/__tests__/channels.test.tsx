import React from "react";
import { render } from "@testing-library/react-native";
import ChannelsScreen from "../(tabs)/channels";
import { usePlaylistStore } from "@/store/playlist-store";
import * as tvUtils from "@/utils/tv-utils";

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    colors: {
      background: "#0F172A",
      text: "#FFFFFF",
      primary: "#06B6D4",
      card: "#1E293B",
      border: "#334155",
      error: "#EF4444",
      info: "#38BDF8",
      white: "#FFFFFF",
    },
  }),
}));

describe("ChannelsScreen integration tests", () => {
  const mockPlaylist = {
    id: "p1",
    name: "Main",
    url: "http://example.com/p.m3u",
    channels: [
      { id: "c1", name: "Alpha News", url: "http://example.com/1.m3u8", category: "News" },
      { id: "c2", name: "Beta Sports", url: "http://example.com/2.m3u8", category: "Sports" },
    ],
    lastUpdated: Date.now(),
  };

  beforeEach(() => {
    usePlaylistStore.setState({
      playlists: [mockPlaylist],
      loading: false,
      error: null,
    });
    jest.spyOn(tvUtils, "isTVDevice").mockReturnValue(false);
    jest.spyOn(tvUtils, "isGoogleTV").mockReturnValue(false);
    jest.spyOn(tvUtils, "isLargeScreen").mockReturnValue(false);
  });

  it("should render mobile category tabs and channels list", () => {
    const { getAllByText, getByText } = render(<ChannelsScreen />);
    expect(getAllByText("News").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Sports")).toBeTruthy();
    expect(getByText("Alpha News")).toBeTruthy();
  });

  it("should render Tivimate split layout when in TV mode", () => {
    jest.spyOn(tvUtils, "isTVDevice").mockReturnValue(true);
    jest.spyOn(tvUtils, "isLargeScreen").mockReturnValue(true);

    const { getByText } = render(<ChannelsScreen />);
    expect(getByText("Categories")).toBeTruthy();
    expect(getByText("Live Program Broadcast")).toBeTruthy();
  });
});
