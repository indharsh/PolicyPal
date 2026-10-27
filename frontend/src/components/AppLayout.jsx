import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DocumentsProvider } from "../DocumentsContext";
import Sidebar from "./Sidebar";

// The frame around every logged-in page: sidebar on the left, the current page on the right.
// The collapsed flag lives here (the parent of both) and is remembered in localStorage.
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("policypal_sidebar") === "closed"; } catch { return false; }
  });

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("policypal_sidebar", next ? "closed" : "open"); } catch { /* ignore */ }
  }

  return (
    <DocumentsProvider>
      <div className="app-shell">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </DocumentsProvider>
  );
}
