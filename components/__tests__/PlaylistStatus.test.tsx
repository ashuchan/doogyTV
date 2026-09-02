import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PlaylistStatus } from "../PlaylistStatus";
import { usePlaylistStore } from "@/store/playlist-store";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    colors: {
      text: "#FFFFFF",
      textSecondary: "#94A3B8",
      primary: "#06B6D4",
      card: "#1E293B",
      white: "#FFFFFF",
    },
  }),
}));

describe("PlaylistStatus component", () => {
  beforeEach(() => {
    mockPush.mockClear();
    usePlaylistStore.setState({
      playlists: [],
      loading: false,
      error: null,
    });
  });

  it("should render 'No playlists found' and 'Add Playlist' when playlists is empty", () => {
    usePlaylistStore.setState({
      playlists: [],
    });

    const { getByText } = render(<PlaylistStatus />);
    expect(getByText("No playlists found")).toBeTruthy();
    expect(getByText("Add Playlist")).toBeTruthy();
  });

  it("should navigate to add-playlist screen when Add Playlist button is clicked", () => {
    usePlaylistStore.setState({
      playlists: [],
    });

    const { getByText } = render(<PlaylistStatus />);
    fireEvent.press(getByText("Add Playlist"));
    expect(mockPush).toHaveBeenCalledWith("/settings/add-playlist");
  });

  it("should render nothing (null) when playlists exist", () => {
    usePlaylistStore.setState({
      playlists: [
        {
          id: "p1",
          name: "Main",
          url: "http://example.com/p.m3u",
          channels: [],
          lastUpdated: Date.now(),
        },
      ],
    });

    const { toJSON } = render(<PlaylistStatus />);
    expect(toJSON()).toBeNull();
  });
});
