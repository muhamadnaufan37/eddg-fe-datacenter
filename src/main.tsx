import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AlertProvider } from "./contexts/AlertContext";
import { routes } from "./routes";
import { PrimeReactProvider } from "primereact/api";

const router = createBrowserRouter(routes, {
  basename: "/",
});

const setupAntiInspect = () => {
  const preventContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  const preventDevtoolsShortcuts = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const blocked =
      key === "f12" ||
      (event.ctrlKey && event.shiftKey && ["i", "j", "c", "k"].includes(key)) ||
      (event.ctrlKey && key === "u");

    if (blocked) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  document.addEventListener("contextmenu", preventContextMenu);
  document.addEventListener("keydown", preventDevtoolsShortcuts);
};

setupAntiInspect();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrimeReactProvider
      value={{
        unstyled: false,
      }}
    >
      <ThemeProvider>
        <AlertProvider>
          <RouterProvider router={router} />
        </AlertProvider>
      </ThemeProvider>
    </PrimeReactProvider>
  </StrictMode>,
);
