import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./index.css";
import AppBoot from "./app/AppBoot";

import { useAuthStore } from "./store/auth";

const store = useAuthStore.getState();
store.init(); // kick off session bootstrap before first render

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppBoot>
      <RouterProvider router={router} />
    </AppBoot>
  </React.StrictMode>
);
