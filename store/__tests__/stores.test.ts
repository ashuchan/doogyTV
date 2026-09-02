import { useRecentlyWatchedStore } from "../recently-watched-store";
import { useFavoritesStore } from "../favorites-store";
import { usePlaylistStore } from "../playlist-store";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null),
}));

describe("Store Tests", () => {
  beforeEach(() => {
    useRecentlyWatchedStore.setState({ recentlyWatched: [] });
    useFavoritesStore.setState({ favorites: [] });
    usePlaylistStore.setState({
      playlists: [],
      loading: false,
      error: null,
    });
  });

  describe("useRecentlyWatchedStore", () => {
    it("should start with an empty recently watched list", () => {
      const state = useRecentlyWatchedStore.getState();
      expect(state.recentlyWatched).toEqual([]);
    });

    it("should add a channel to the beginning of the list", () => {
      const { addToRecentlyWatched } = useRecentlyWatchedStore.getState();
      addToRecentlyWatched("channel-1");
      expect(useRecentlyWatchedStore.getState().recentlyWatched).toEqual(["channel-1"]);

      addToRecentlyWatched("channel-2");
      expect(useRecentlyWatchedStore.getState().recentlyWatched).toEqual(["channel-2", "channel-1"]);
    });

    it("should move existing channel to front without creating duplicate entries", () => {
      const { addToRecentlyWatched } = useRecentlyWatchedStore.getState();
      addToRecentlyWatched("channel-1");
      addToRecentlyWatched("channel-2");
      addToRecentlyWatched("channel-3");
      addToRecentlyWatched("channel-1");

      expect(useRecentlyWatchedStore.getState().recentlyWatched).toEqual([
        "channel-1",
        "channel-3",
        "channel-2",
      ]);
    });

    it("should cap items at MAX_RECENT_ITEMS (10)", () => {
      const { addToRecentlyWatched } = useRecentlyWatchedStore.getState();
      for (let i = 1; i <= 15; i++) {
        addToRecentlyWatched(`channel-${i}`);
      }

      const list = useRecentlyWatchedStore.getState().recentlyWatched;
      expect(list.length).toBe(10);
      expect(list[0]).toBe("channel-15");
      expect(list[9]).toBe("channel-6");
    });

    it("should clear recently watched items", () => {
      const { addToRecentlyWatched, clearRecentlyWatched } = useRecentlyWatchedStore.getState();
      addToRecentlyWatched("channel-1");
      addToRecentlyWatched("channel-2");
      clearRecentlyWatched();

      expect(useRecentlyWatchedStore.getState().recentlyWatched).toEqual([]);
    });
  });

  describe("useFavoritesStore", () => {
    it("should start with an empty favorites list", () => {
      const state = useFavoritesStore.getState();
      expect(state.favorites).toEqual([]);
    });

    it("should add and remove favorite when toggled", () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      toggleFavorite("channel-1");
      expect(useFavoritesStore.getState().favorites).toContain("channel-1");

      toggleFavorite("channel-1");
      expect(useFavoritesStore.getState().favorites).not.toContain("channel-1");
    });

    it("should add unique favorite items", () => {
      const { addFavorite } = useFavoritesStore.getState();
      addFavorite("channel-1");
      addFavorite("channel-1");

      expect(useFavoritesStore.getState().favorites).toEqual(["channel-1"]);
    });

    it("should remove existing favorite item", () => {
      const { addFavorite, removeFavorite } = useFavoritesStore.getState();
      addFavorite("channel-1");
      addFavorite("channel-2");
      removeFavorite("channel-1");

      expect(useFavoritesStore.getState().favorites).toEqual(["channel-2"]);
    });
  });

  describe("usePlaylistStore", () => {
    it("should have initial state with empty playlists", () => {
      const state = usePlaylistStore.getState();
      expect(state.playlists).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should add a playlist", () => {
      const { addPlaylist } = usePlaylistStore.getState();
      const mockPlaylist = {
        id: "p1",
        name: "Test Playlist",
        url: "http://example.com/playlist.m3u",
        channels: [
          { id: "c1", name: "News 24", url: "http://example.com/stream1.m3u8", category: "News" }
        ],
        lastUpdated: Date.now(),
      };

      addPlaylist(mockPlaylist);
      expect(usePlaylistStore.getState().playlists).toHaveLength(1);
      expect(usePlaylistStore.getState().playlists[0].name).toBe("Test Playlist");
    });

    it("should remove a playlist", () => {
      const { addPlaylist, removePlaylist } = usePlaylistStore.getState();
      const mockPlaylist = {
        id: "p1",
        name: "Test Playlist",
        url: "http://example.com/playlist.m3u",
        channels: [],
        lastUpdated: Date.now(),
      };

      addPlaylist(mockPlaylist);
      expect(usePlaylistStore.getState().playlists).toHaveLength(1);

      removePlaylist("p1");
      expect(usePlaylistStore.getState().playlists).toHaveLength(0);
    });

    it("should reset to default demo playlist", () => {
      const { resetToDefaultPlaylist } = usePlaylistStore.getState();
      resetToDefaultPlaylist();
      const playlists = usePlaylistStore.getState().playlists;
      expect(playlists).toHaveLength(1);
      expect(playlists[0].id).toBe("default-iptv-org");
      expect(playlists[0].url).toBe("https://iptv-org.github.io/iptv/index.m3u");
    });
  });
});
