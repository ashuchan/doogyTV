import React, { useEffect, useState } from "react";
import { View, StyleSheet, ViewStyle, Dimensions } from "react-native";
import { isLargeScreen, getContentMaxWidth, isTVDevice, isGoogleTV } from "@/utils/tv-utils";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ResponsiveLayout({ children, style }: ResponsiveLayoutProps) {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const isLarge = isLargeScreen();
  const isTV = isTVDevice() || isGoogleTV();
  const isLandscape = dimensions.width > dimensions.height;
  
  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription.remove();
  }, []);
  
  // For TV devices, we want to use the full width but shift content right to fit the collapsed vertical sidebar
  const tvStyle: ViewStyle = {
    width: "100%",
    maxWidth: "100%",
    paddingLeft: 70, // Clear the collapsed sidebar space
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  };
  
  return (
    <View style={[
      styles.container,
      isLarge && !isTV && styles.largeContainer,
      isTV && tvStyle,
      style
    ]}>
      <View style={[
        styles.content,
        isLarge && !isTV && { maxWidth: getContentMaxWidth() },
        isTV && { width: "100%" },
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  largeContainer: {
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
  },
});

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
}

export function ResponsiveGrid({ children, style, itemStyle }: ResponsiveGridProps) {
  const isLarge = isLargeScreen();
  const isTV = isTVDevice() || isGoogleTV();
  
  // Convert children to array
  const childrenArray = React.Children.toArray(children);
  
  const gridStyles = StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    largeGrid: {
      justifyContent: "flex-start",
    },
    tvGrid: {
      justifyContent: "space-between",
    },
    gridItem: {
      padding: 8,
    },
    tvGridItem: {
      padding: 12,
    }
  });
  
  return (
    <View style={[
      gridStyles.grid,
      isLarge && gridStyles.largeGrid,
      isTV && gridStyles.tvGrid,
      style
    ]}>
      {childrenArray.map((child, index) => (
        <View 
          key={index} 
          style={[
            gridStyles.gridItem, 
            isTV && gridStyles.tvGridItem,
            itemStyle
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}