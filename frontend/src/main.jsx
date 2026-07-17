import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { SiteContentProvider } from "./context/SiteContentContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <SiteContentProvider>
        <App />
      </SiteContentProvider>
    </AdminAuthProvider>
  </React.StrictMode>,
);
