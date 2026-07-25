import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import appIcon from "@logos/app-icon/app-icon.png";
import App from "./App";
import "./i18n";
import "./index.css";

document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href = appIcon;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
