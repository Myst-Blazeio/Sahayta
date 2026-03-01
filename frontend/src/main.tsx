import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { HashRouter } from "react-router-dom";


import { SnackbarProvider } from "./context/SnackbarContext";

// Activate mock API interceptor (prevents ECONNREFUSED proxy errors)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <SnackbarProvider>
        <App />
      </SnackbarProvider>
    </HashRouter>
  </React.StrictMode>,
);
