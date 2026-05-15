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
