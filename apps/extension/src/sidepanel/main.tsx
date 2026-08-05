/**
 * Side panel entry: mounts the React application.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

/**
 * Root DOM node for the side panel UI.
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Decision Ledger side panel root element #root was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
