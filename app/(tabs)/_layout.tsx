import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "@/context/theme-context";
import { Home, Tv2, Heart, Settings, Search } from "lucide-react-native";
import { isTVDevice, isGoogleTV } from "@/utils/tv-utils";
import { TVTabSidebar } from "@/components/TVTabSidebar";

export default function TabLayout() {
  const { theme, colors } = useTheme();
  const isTV = isTVDevice() || isGoogleTV();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: isTV ? { display: "none" } : {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
      tabBar={isTV ? (props) => <TVTabSidebar {...props} /> : undefined}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: "Channels",
          tabBarIcon: ({ color, size }) => <Tv2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}