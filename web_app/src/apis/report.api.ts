import { apiClient } from '../services/apiClient';

/* =========================
   Types
========================= */

export interface ApiReport {
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
  reports: ApiReport[];
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
  createReport: (name: string, bank_name: string) =>
    apiClient.post<GetReportsResponse>('/api/v1/reports', { report_name: name, bank_name }),

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
      `/api/v1/reports/check?report_name=${encodeURIComponent(name)}`
    ),

  /**
   * Get report by ID
   * GET /api/v1/reports/{report_id}
   */
  getReportById: (reportId: string) =>
    apiClient.get<ApiReport>(`/api/v1/reports/${reportId}`),

  /**
   * Update report
   * PUT /api/v1/reports/{report_id}
   */
  updateReport: (reportId: string, data: UpdateReportRequest) =>
    apiClient.put<ApiReport>(`/api/v1/reports/${reportId}`, data),

  /**
   * Delete report
   * DELETE /api/v1/reports/{report_id}
   */
  deleteReport: (reportId: string) =>
    apiClient.delete<void>(`/api/v1/reports/${reportId}`),

  /**
   * Import files to a report
   * POST /api/v1/reports/{report_id}/import
   */
  importFiles: (reportId: string) =>
    apiClient.post<{ success: boolean }>(
      `/api/v1/reports/${reportId}/import`
    ),

  /**
   * Analyze report
   * POST /api/v1/reports/analysis
   */
  analyzeReport: (reportId: string) =>
    apiClient.post<{ id: string; analysis: string }>(
      '/api/v1/reports/analysis',
      { report_id: reportId }
    ),

  /**
   * Download report PDF
   * GET /api/v1/reports/{report_id}/download
   */
  downloadReport: (reportId: string) =>
    apiClient.downloadBlob(`/api/v1/reports/${reportId}/download`),

  /**
   * Download original file
   * GET /api/v1/files/{file_id}
   */
  downloadFile: (fileId: string) =>
    apiClient.downloadBlob(`/api/v1/files/${fileId}`),

  /**
   * Delete original file
   * DELETE /api/v1/files/{file_id}
   */
  deleteFile: (fileId: string) =>
    apiClient.delete<void>(`/api/v1/files/${fileId}`),

  /**
   * Upload files to a report
   * POST /api/v1/reports/{report_id}/files
   */
  uploadFiles: (reportId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return apiClient.post<{ success: boolean; files: any[] }>(
      `/api/v1/reports/${reportId}/files`,
      formData
    );
  },
};

export default reportsApi;
