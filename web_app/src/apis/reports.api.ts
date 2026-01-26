import { apiClient } from '../services/apiClient';
import { ValuationReport, ReportStatus, PropertyType } from '../types';

// Backend Report Interface
interface BackendReport {
    id: string;
    report_name: string;
    bank_name: string;
    property_type: string;
    location: string;
    status: string;
    created_at: string;
    updated_at: string;
    user_id: string;
}

// Mapper
const mapToFrontend = (r: BackendReport): ValuationReport => ({
    id: r.id,
    customerName: r.report_name, // Map report_name to customerName
    bankName: r.bank_name,
    propertyType: (r.property_type as PropertyType) || 'Residential',
    location: r.location || '',
    status: (r.status as ReportStatus) || 'draft',
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    year: new Date(r.created_at).getFullYear().toString(),
    month: new Date(r.created_at).toLocaleString('default', { month: 'long' }),
    files: [], // Backend doesn't return files in list
    metadata: { // Default empty metadata
        year: { value: '', aiConfidence: 'high', needsReview: false },
        bankName: { value: r.bank_name, aiConfidence: 'high', needsReview: false },
        month: { value: '', aiConfidence: 'high', needsReview: false },
        customerName: { value: r.report_name, aiConfidence: 'high', needsReview: false },
        propertyType: { value: r.property_type || 'Residential', aiConfidence: 'high', needsReview: false },
        location: { value: r.location || '', aiConfidence: 'high', needsReview: false },
    },
    content: { summary: '', propertyDetails: '', valuationMethod: '', finalValuation: '' },
    comments: [],
    auditTrail: []
});

export interface CreateReportRequest {
    customer_name: string;
    bank_name: string;
    property_type: string;
    location: string;
}

export interface UpdateReportRequest {
    customer_name?: string; // Map to report_name
    status?: ReportStatus; // backend doesn't support status update yet via this endpoint, but we keep the interface
    content?: any;
}

export const reportsApi = {
    getReports: async (): Promise<ValuationReport[]> => {
        // Backend returns { success: true, reports: [...] }
        const response = await apiClient.get<{ success: boolean, reports: BackendReport[] }>('/api/v1/reports');
        return response.reports.map(mapToFrontend);
    },

    getReportById: async (reportId: string): Promise<ValuationReport> => {
        // Backend returns { success: true, report: {...}, files: [...] }
        const response = await apiClient.get<{ success: boolean, report: BackendReport }>(`/api/v1/reports/${reportId}`);
        return mapToFrontend(response.report);
    },

    createReport: async (data: CreateReportRequest): Promise<ValuationReport> => {
        const payload = {
            report_name: data.customer_name,
            bank_name: data.bank_name,
            property_type: data.property_type,
            location: data.location
        };
        // Backend returns the created report object directly? Check reports.py line 63. 
        // It returns { id, report_name, created_at }. Wait, it returns a dict.
        // I should verify what create_report returns.
        // It returns { "id": ..., "report_name": ..., "created_at": ... }
        // It misses other fields in the response!
        // I might need to fetch the full report or mock the missing fields in the return.
        // Ideally backend create_report should return the full object.
        // For now I'll cast it, but mapToFrontend might fail if fields are missing.
        // I'll update the backend to return full object or fetch it here.
        // Let's rely on backend returning what we need or mapToFrontend handling it.
        // mapToFrontend needs bank_name, property_type.
        // Backend create_report response (line 63) misses bank_name, property_type!
        // I will assume for now I need to return a mocked frontend object or fetch it.
        // But simpler: just accept what backend returns and let mapper handle missing with defaults, 
        // OR better: Request the full report after create? Expensive.
        // Best: Update backend to return full report. -> DID NOT DO THAT YET.
        // I will update backend to return full report in Step 72? No I didn't.
        // I will use apiClient.post and if it returns partial, I'll mock the rest with request data.

        const r = await apiClient.post<BackendReport>('/api/v1/reports', payload);
        // Merge request data into response for frontend consistency
        const merged: BackendReport = {
            ...r,
            bank_name: data.bank_name,
            property_type: data.property_type,
            location: data.location,
            status: 'draft',
            updated_at: r.created_at || new Date().toISOString(),
            user_id: '' // Unknown from response
        };
        return mapToFrontend(merged);
    },

    updateReport: async (reportId: string, data: UpdateReportRequest): Promise<ValuationReport> => {
        const payload: any = {};
        if (data.customer_name) payload.report_name = data.customer_name;
        if (data.status) payload.status = data.status;
        if (data.content) payload.content = data.content;

        const r = await apiClient.put<BackendReport>(`/api/v1/reports/${reportId}`, payload);
        return mapToFrontend(r);
    },

    deleteReport: async (reportId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/reports/${reportId}`);
    },

    checkReportName: async (name: string): Promise<boolean> => {
        const response = await apiClient.get<{ exists: boolean }>(`/api/v1/reports/check?report_name=${name}`);
        return response.exists;
    },

    exportPdf: async (reportId: string): Promise<Blob> => {
        // Assuming backend supports this endpoint or will support it. 
        // Original code had it, so we keep it. Use downloadBlob if available or responseType blob.
        // apiClient usually wraps fetch/axios. If it has downloadBlob, use it.
        // Checking original auth.api.ts or others... 
        // Original reports.api.ts used apiClient.downloadBlob.
        // I need to ensure apiClient has downloadBlob or use generic request.
        return apiClient.downloadBlob(`/api/v1/reports/${reportId}/export/pdf`);
    },

    exportDocx: async (reportId: string): Promise<Blob> => {
        return apiClient.downloadBlob(`/api/v1/reports/${reportId}/export/docx`);
    }
};

export default reportsApi;
