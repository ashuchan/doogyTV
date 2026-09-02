import React from "react";
import { render } from "@testing-library/react-native";
import HomeScreen from "../(tabs)/index";
import { usePlaylistStore } from "@/store/playlist-store";
import { useRecentlyWatchedStore } from "@/store/recently-watched-store";
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
      white: "#FFFFFF",
    },
  }),
}));

describe("HomeScreen integration tests", () => {
  beforeEach(() => {
    usePlaylistStore.setState({
      playlists: [],
      loading: false,
      error: null,
      fetchPlaylists: jest.fn(),
    });
    useRecentlyWatchedStore.setState({
      recentlyWatched: [],
    });
    jest.spyOn(tvUtils, "isTVDevice").mockReturnValue(false);
    jest.spyOn(tvUtils, "isGoogleTV").mockReturnValue(false);
    jest.spyOn(tvUtils, "isLargeScreen").mockReturnValue(false);
  });

  it("should render loading state when playlists are loading and empty", () => {
    usePlaylistStore.setState({
      loading: true,
      playlists: [],
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText("Loading channels...")).toBeTruthy();
  });

  it("should render error message and retry button on fetch failure", () => {
    usePlaylistStore.setState({
      loading: false,
      error: "Unable to reach IPTV server",
      playlists: [],
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText("Unable to reach IPTV server")).toBeTruthy();
    expect(getByText("Retry")).toBeTruthy();
  });

  it("should render featured channels and categories when data is available", () => {
    usePlaylistStore.setState({
      loading: false,
      error: null,
      playlists: [
        {
          id: "p1",
          name: "Main",
          url: "http://example.com/p.m3u",
          channels: [
            { id: "c1", name: "Channel Alpha", url: "http://example.com/1.m3u8", category: "News" },
            { id: "c2", name: "Channel Beta", url: "http://example.com/2.m3u8", category: "Sports" },
          ],
          lastUpdated: Date.now(),
        },
      ],
    });

    const { getAllByText, getByText } = render(<HomeScreen />);
    expect(getByText("Featured Channels")).toBeTruthy();
    expect(getAllByText("Channel Alpha").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("Channel Beta").length).toBeGreaterThanOrEqual(1);
  });
});
