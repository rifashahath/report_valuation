// app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";

import DashboardPage from "../pages/DashboardPage";
import UploadPage from "../pages/UploadPage";
import ReportsPage from "../pages/ReportsPage";
import ReportEditorPage from "../pages/ReportEditorPage";
import ReviewApprovalPage from "../pages/ReviewApprovalPage";
import UsersPage from "../pages/UsersPage";
import LoginPage from "../pages/LoginPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "upload", element: <UploadPage /> },
      { path: "files", element: <ReportsPage /> },
      { path: "reports/:id/edit", element: <ReportEditorPage /> },
      { path: "reports/:id/review", element: <ReviewApprovalPage /> },
      { path: "users", element: <UsersPage /> },
    ],
  },
]);

export default router;
