import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StackProvider, StackTheme } from "@stackframe/react";
import { stackClientApp } from "@/stack/client"; // make sure the path matches your project
import App from "./App";
import "./index.css"; // your global styles

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <BrowserRouter>
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <App />
          </StackTheme>
        </StackProvider>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
);
