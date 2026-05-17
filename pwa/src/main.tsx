import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false });
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: "#FDFCF8" });
}

const root = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(root).render(<App />);
