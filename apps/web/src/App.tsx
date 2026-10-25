import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/HomePage";
import { DashboardPlaceholderPage } from "./pages/DashboardPlaceholderPage";
import { SystemStatusPage } from "./pages/SystemStatusPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPlaceholderPage />} />
          <Route path="system-status" element={<SystemStatusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
