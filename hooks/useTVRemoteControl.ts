import { useEffect } from "react";
import { Platform, TVEventHandler } from "react-native";

interface RemoteControlConfig {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onSelect?: () => void;
  onBack?: () => void;
  active?: boolean;
}

export function useTVRemoteControl({
  onUp,
  onDown,
  onLeft,
  onRight,
  onSelect,
  onBack,
  active = true,
}: RemoteControlConfig) {
  useEffect(() => {
    if (!active) return;

    if (Platform.OS === "web") {
      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowUp":
            if (onUp) {
              e.preventDefault();
              onUp();
            }
            break;
          case "ArrowDown":
            if (onDown) {
              e.preventDefault();
              onDown();
            }
            break;
          case "ArrowLeft":
            if (onLeft) {
              e.preventDefault();
              onLeft();
            }
            break;
          case "ArrowRight":
            if (onRight) {
              e.preventDefault();
              onRight();
            }
            break;
          case "Enter":
            if (onSelect) {
              e.preventDefault();
              onSelect();
            }
            break;
          case "Escape":
          case "Backspace":
            if (onBack) {
              e.preventDefault();
              onBack();
            }
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      // Prevent crash on standard react-native where TVEventHandler is undefined
      if (typeof TVEventHandler !== "undefined" && TVEventHandler !== null) {
        try {
          const tvEventHandler = new TVEventHandler();
          tvEventHandler.enable(null, (_cmp, evt) => {
            if (!evt) return;
            switch (evt.eventType) {
              case "up":
                onUp?.();
                break;
              case "down":
                onDown?.();
                break;
              case "left":
                onLeft?.();
                break;
              case "right":
                onRight?.();
                break;
              case "select":
                onSelect?.();
                break;
              case "back":
                onBack?.();
                break;
            }
          });

          return () => {
            tvEventHandler.disable();
          };
        } catch (e) {
          console.warn("Failed to initialize TVEventHandler", e);
        }
      }
    }
  }, [onUp, onDown, onLeft, onRight, onSelect, onBack, active]);
}
