import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";

const storedTheme = localStorage.getItem("reposketch-theme");
const dark = storedTheme ? storedTheme === "dark" : true;
document.documentElement.classList.toggle("dark", dark);
document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
