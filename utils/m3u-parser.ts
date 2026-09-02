import { Channel } from "@/types/channel";
import { Playlist } from "@/types/playlist";

export async function fetchM3uPlaylist(url: string, name?: string): Promise<Playlist> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
    }
    
    const content = await response.text();
    const channels = parseM3u(content);
    
    return {
      id: generateId(),
      name: name || extractPlaylistName(url) || "My Playlist",
      url,
      channels,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching M3U playlist:", error);
    throw error;
  }
}

function parseM3u(content: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  
  if (lines.length === 0 || !lines[0].includes("#EXTM3U")) {
    throw new Error("Invalid M3U format");
  }
  
  let currentChannel: Partial<Channel> | null = null;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line.startsWith("#EXTINF:")) {
      currentChannel = parseExtInf(line);
    } else if (line.startsWith("#EXTGRP:") && currentChannel) {
      currentChannel.category = line.substring(8).trim() || "Uncategorized";
    } else if (!line.startsWith("#") && currentChannel) {
      currentChannel.url = line.replace(/[\r\n]/g, "").trim();
      currentChannel.id = generateId();
      if (!currentChannel.category) {
        currentChannel.category = "General";
      }
      if (!currentChannel.name) {
        currentChannel.name = "Live Stream " + (channels.length + 1);
      }
      channels.push(currentChannel as Channel);
      currentChannel = null;
    }
  }
  
  return channels;
}

function parseExtInf(line: string): Partial<Channel> {
  const channel: Partial<Channel> = {
    name: "",
    category: "General",
  };
  
  // Extract channel name (text after the last comma)
  const commaIndex = line.lastIndexOf(",");
  if (commaIndex !== -1) {
    channel.name = line.substring(commaIndex + 1).trim();
  }
  
  // Fast attribute extraction
  const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
  let match;
  
  while ((match = attrRegex.exec(line)) !== null) {
    const [, key, value] = match;
    switch (key.toLowerCase()) {
      case "tvg-logo":
      case "logo":
        channel.logo = value;
        break;
      case "group-title":
        channel.category = value.trim() || "General";
        break;
      case "tvg-id":
        channel.tvgId = value;
        break;
      case "tvg-name":
        channel.tvgName = value;
        break;
    }
  }
  
  return channel;
}

function extractPlaylistName(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const filename = pathParts[pathParts.length - 1];
    
    if (filename) {
      // Remove extension and replace underscores/hyphens with spaces
      return filename
        .replace(/\.(m3u|m3u8)$/i, "")
        .replace(/[_-]/g, " ")
        .trim();
    }
    
    return urlObj.hostname;
  } catch (error) {
    return null;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}