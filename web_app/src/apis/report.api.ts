import { apiClient } from '../services/apiClient';

/* =========================
   Types
========================= */

export interface ApiReport {
  id: string;
  report_name: string;
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

export interface GetReportByIdResponse {
  success: boolean;
  report: ApiReport;
  files: any[];
}

export interface CreateReportResponse {
  id: string;
  report_name: string;
  created_at: string;
}

export const reportsApi = {
  /**
   * Get all reports
   * GET /api/v1/reports
   */
  createReport: (name: string, bank_name: string) =>
    apiClient.post<CreateReportResponse>('/api/v1/reports', { report_name: name, bank_name }),

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
    apiClient.get<GetReportByIdResponse>(`/api/v1/reports/${reportId}`),

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
   * Import files to a report — dispatches Celery tasks and returns immediately
   * POST /api/v1/reports/{report_id}/import
   */
  importFiles: (reportId: string) =>
    apiClient.post<{
      success: boolean;
      report_id: string;
      job_ids: string[];
      queued_jobs: { file_id: string; job_id: string; file_name: string; status_url: string }[];
      skipped_files: { file_id: string; reason: string }[];
      message: string;
    }>(
      `/api/v1/reports/${reportId}/import`
    ),

  /**
   * Poll a single async job status
   * GET /api/v1/jobs/{job_id}
   */
  pollJobStatus: (jobId: string) =>
    apiClient.get<{
      job_id: string;
      celery: { state: string; ready: boolean; succeeded: boolean; failed: boolean; error?: string };
      details: {
        processing_status: string;
        current_page: number | null;
        total_pages: number | null;
        output_pdf_path: string | null;
        error_message: string | null;
        completed_at: string | null;
        summary: string | null;
      } | null;
      download_url?: string;
    }>(`/api/v1/jobs/${jobId}`),

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
  /**
   * Get full extracted/translated content for all files in a report
   * GET /api/v1/reports/{report_id}/files/content
   */
  getFileContents: (reportId: string) =>
    apiClient.get<{ report_id: string; files: { file_id: string; file_name: string; content: string }[] }>(
      `/api/v1/reports/${reportId}/files/content`
    ),

  /**
   * Get stored LLM analysis for a report
   * GET /api/v1/reports/{report_id}/analysis
   */
  getReportAnalysis: (reportId: string) =>
    apiClient.get<{ report_id: string; report_name: string; analysis: string | null }>(
      `/api/v1/reports/${reportId}/analysis`
    ),
};

export default reportsApi;
