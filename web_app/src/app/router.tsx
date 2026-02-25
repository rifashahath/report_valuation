// app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";

import DashboardPage from "../pages/DashboardPage";
import UploadPage from "../pages/UploadPage";
import ReportsPage from "../pages/ReportsPage";
import ReportEditorPage from "../pages/ReportEditorPage";
import ReviewApprovalPage from "../pages/ReviewApprovalPage";
import UsersPage from "../pages/UsersPage";
import BankManagementPage from "../pages/BankManagementPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ProcessingPage from "../pages/ProcessingPage";

// Placeholder components for missing files
const ErrorBoundary = () => (
  <div className="flex items-center justify-center h-screen bg-red-50 text-red-600">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p>Please try refreshing the page.</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-600">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p>Page not found</p>
    </div>
  </div>
);
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "upload/:reportId?", element: <UploadPage /> },
      { path: "processing/:reportId", element: <ProcessingPage /> },
      { path: "files", element: <ReportsPage /> },
      { path: "reports/:id/edit", element: <ReportEditorPage /> },
      { path: "reports/:id/review", element: <ReviewApprovalPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "banks", element: <BankManagementPage /> },
      { path: "*", element: <NotFound /> }, // Catch-all 404 route
    ],
  },
  {
    path: "*",
    element: <NotFound />, // Top-level catch-all
  },
]);

export default router;
