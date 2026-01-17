import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import reportsApi, {
  Report,
  UpdateReportRequest,
} from '../apis/reports.api';

/* =========================
   Query Keys
========================= */

const REPORTS_KEY = ['reports'];
const REPORT_KEY = (id: string) => ['reports', id];

/* =========================
   Hooks
========================= */

/**
 * Get all reports
 * GET /api/v1/reports
 */
export function useReports() {
  return useQuery({
    queryKey: REPORTS_KEY,
    queryFn: reportsApi.getReports,
  });
}

/**
 * Get single report by ID
 * GET /api/v1/reports/{id}
 */
export function useReport(reportId: string | undefined) {
  return useQuery({
    queryKey: reportId ? REPORT_KEY(reportId) : [],
    queryFn: () => reportsApi.getReportById(reportId as string),
    enabled: !!reportId,
  });
}

/**
 * Check report name availability
 * GET /api/v1/reports/check
 */
export function useCheckReportName(name: string) {
  return useQuery({
    queryKey: ['reports', 'check-name', name],
    queryFn: () => reportsApi.checkReportName(name),
    enabled: !!name,
  });
}

/**
 * Update report
 * PUT /api/v1/reports/{id}
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      data,
    }: {
      reportId: string;
      data: UpdateReportRequest;
    }) => reportsApi.updateReport(reportId, data),

    onSuccess: (updatedReport: Report) => {
      // Update single report cache
      queryClient.setQueryData(REPORT_KEY(updatedReport.id), updatedReport);

      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
}

/**
 * Delete report
 * DELETE /api/v1/reports/{id}
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) =>
      reportsApi.deleteReport(reportId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
}
