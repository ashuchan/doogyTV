import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Playlist } from "@/types/playlist";
import { fetchM3uPlaylist } from "@/utils/m3u-parser";

export const DEFAULT_DEMO_PLAYLIST: Playlist = {
  id: "doggytv-demo-playlist",
  name: "doggyTV Demo Channels",
  url: "https://iptv-org.github.io/iptv/index.m3u",
  lastUpdated: Date.now(),
  channels: [
    {
      id: "demo-1",
      name: "Big Buck Bunny 1080p",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      category: "Movies & Animation",
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
    },
    {
      id: "demo-2",
      name: "Sintel 4K Movie Stream",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      category: "Movies & Animation",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Sintel_poster.jpg",
    },
    {
      id: "demo-3",
      name: "Tears of Steel Sci-Fi Stream",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      category: "Sci-Fi & Action",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Tears_of_Steel_poster.jpg",
    },
    {
      id: "demo-4",
      name: "Elephants Dream HD",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      category: "Documentary & Tech",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Elephants_Dream_poster.jpg",
    },
    {
      id: "demo-5",
      name: "For Bigger Blazes 4K",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      category: "Sports & Action",
      logo: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
    },
  ],
};

interface PlaylistState {
  playlists: Playlist[];
  loading: boolean;
  error: string | null;
  addPlaylist: (playlist: Playlist) => void;
  removePlaylist: (id: string) => void;
  fetchPlaylists: (playlistId?: string) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [DEFAULT_DEMO_PLAYLIST],
      loading: false,
      error: null,
      
      addPlaylist: (playlist) => {
        set((state) => ({
          playlists: [...state.playlists, playlist],
        }));
      },
      
      removePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter((playlist) => playlist.id !== id),
        }));
      },
      
      fetchPlaylists: async (playlistId) => {
        set({ loading: true, error: null });
        
        try {
          const { playlists } = get();
          
          if (playlistId) {
            // Update a specific playlist
            const playlist = playlists.find((p) => p.id === playlistId);
            if (playlist) {
              const updatedPlaylist = await fetchM3uPlaylist(playlist.url, playlist.name);
              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === playlistId ? updatedPlaylist : p
                ),
                loading: false,
              }));
            }
          } else {
            // Update all playlists
            const updatedPlaylists = await Promise.all(
              playlists.map(async (playlist) => {
                try {
                  return await fetchM3uPlaylist(playlist.url, playlist.name);
                } catch (error) {
                  console.error(`Failed to update playlist ${playlist.id}:`, error);
                  return playlist;
                }
              })
            );
            
            set({ playlists: updatedPlaylists, loading: false });
          }
        } catch (error) {
          console.error("Error fetching playlists:", error);
          set({ 
            error: "Failed to fetch playlists. Please try again later.",
            loading: false 
          });
        }
      },
    }),
    {
      name: "doggytv-playlists",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);