import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { toast } from "sonner";
import { AUTH_ROUTE_PATHS, DASHBOARD_ROUTE_PATHS } from "@/routes";

// Routes where "back" should offer to exit the app instead of navigating away.
const EXIT_ROUTES: string[] = [
  "/",
  AUTH_ROUTE_PATHS.login,
  DASHBOARD_ROUTE_PATHS.dashboard,
  DASHBOARD_ROUTE_PATHS.tutorDashboard,
  DASHBOARD_ROUTE_PATHS.viewDashboard,
];

const DOUBLE_TAP_WINDOW_MS = 2000;

/**
 * Wires the Android hardware back button on native builds.
 *
 * Priority:
 *   1. An open overlay (dialog / sheet / dropdown / select / popover) -> close it.
 *   2. Not on a root screen -> go back in history.
 *   3. On a root screen -> "press back again to exit", then exit.
 *
 * Without this the WebView ignores the back button entirely and Android kills
 * the activity on the first press.
 */
export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Kept in refs so the (single) native listener always sees fresh values
  // without being torn down and re-registered on every navigation.
  const pathnameRef = useRef(location.pathname);
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Radix marks its open overlays with data-state="open" and closes them on
    // Escape, so forwarding a synthetic Escape is the least invasive way to
    // dismiss whatever is on top.
    const closeTopOverlay = () => {
      const overlay = document.querySelector(
        '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-state="open"][role="menu"], [data-state="open"][role="listbox"]'
      );
      if (!overlay) return false;

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          bubbles: true,
          cancelable: true,
        })
      );
      return true;
    };

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (closeTopOverlay()) return;

      const onExitRoute = EXIT_ROUTES.includes(pathnameRef.current);

      if (canGoBack && !onExitRoute) {
        navigate(-1);
        return;
      }

      const now = Date.now();
      if (now - lastBackPressRef.current < DOUBLE_TAP_WINDOW_MS) {
        App.exitApp();
        return;
      }

      lastBackPressRef.current = now;
      toast("Press back again to exit");
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [navigate]);
}
