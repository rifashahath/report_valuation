import { apiClient } from '../services/apiClient';

/* =========================
   Types
========================= */

export interface Report {
  id: string;
  name: string;
  customer_name: string;
  bank_name: string;
  property_type: string;
  location: string;
  status: 'draft' | 'review' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface GetReportsResponse {
  reports: Report[];
}

export interface CheckReportNameResponse {
  exists: boolean;
}

export interface UpdateReportRequest {
  name?: string;
  content?: Record<string, any>;
  status?: 'draft' | 'review' | 'approved';
}

/* =========================
   API
========================= */

export const reportsApi = {
  /**
   * Get all reports
   * GET /api/v1/reports
   */
  getReports: () =>
    apiClient.get<GetReportsResponse>('/api/v1/reports'),

  /**
   * Check report name availability
   * GET /api/v1/reports/check?name=ReportName
   */
  checkReportName: (name: string) =>
    apiClient.get<CheckReportNameResponse>(
      `/api/v1/reports/check`,
      { params: { name } }
    ),

  /**
   * Get report by ID
   * GET /api/v1/reports/{report_id}
   */
  getReportById: (reportId: string) =>
    apiClient.get<Report>(`/api/v1/reports/${reportId}`),

  /**
   * Update report
   * PUT /api/v1/reports/{report_id}
   */
  updateReport: (reportId: string, data: UpdateReportRequest) =>
    apiClient.put<Report>(`/api/v1/reports/${reportId}`, data),

  /**
   * Delete report
   * DELETE /api/v1/reports/{report_id}
   */
  deleteReport: (reportId: string) =>
    apiClient.delete<void>(`/api/v1/reports/${reportId}`),
};

export default reportsApi;
