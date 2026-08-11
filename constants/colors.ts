export const lightColors = {
  primary: "#4361ee",
  secondary: "#3f37c9",
  background: "#f8f9fa",
  card: "#ffffff",
  text: "#212529",
  textSecondary: "#6c757d",
  border: "#e9ecef",
  notification: "#ff4d6d",
  error: "#dc3545",
  success: "#28a745",
  warning: "#ffc107",
  info: "#17a2b8",
  white: "#ffffff",
  black: "#000000",
};

export const darkColors = {
  primary: "#4F46E5", // Indigo accent
  secondary: "#3f37c9",
  background: "#090D16", // Charcoal black gradient start
  backgroundEnd: "#111827", // Slate blue gradient end
  card: "#1E293B", // Solid dark slate fallback for low-end SOCs
  cardTranslucent: "rgba(255, 255, 255, 0.03)", // Translucent panel for high-end web/devices
  border: "rgba(255, 255, 255, 0.05)", // Glassmorphism borders
  text: "#F3F4F6", // High-contrast grey/white
  textSecondary: "#9CA3AF", // Dimmed metadata text
  notification: "#ff4d6d",
  error: "#f44336",
  success: "#4caf50",
  warning: "#ff9800",
  info: "#06B6D4", // Neon Cyan highlight
  white: "#ffffff",
  black: "#000000",
};

export default {
  light: lightColors,
  dark: darkColors,
};