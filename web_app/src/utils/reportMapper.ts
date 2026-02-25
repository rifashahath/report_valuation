import { ValuationReport } from '../types';

export function mapApiReportToValuation(apiData: any): ValuationReport {
    console.log('[reportMapper] apiData:', JSON.stringify({
        hasReport: !!apiData?.report,
        hasFiles: !!apiData?.files,
        hasAnalysis: !!apiData?.analysis,
        analysisKeys: apiData?.analysis ? Object.keys(apiData.analysis) : null,
        ai_report_content_type: typeof apiData?.analysis?.ai_report_content,
        ai_report_content_preview: String(apiData?.analysis?.ai_report_content || '').slice(0, 80),
    }));

    const { report, files, analysis } = apiData;

    // Default values for fields not yet in backend
    const metadata = {
        year: { value: '2024', aiConfidence: 'high' as const, needsReview: false },
        bankName: { value: report.bank_name || '', aiConfidence: 'high' as const, needsReview: false },
        month: { value: 'February', aiConfidence: 'high' as const, needsReview: false },
        customerName: { value: report.report_name || '', aiConfidence: 'high' as const, needsReview: false },
        propertyType: { value: 'Residential' as const, aiConfidence: 'high' as const, needsReview: false },
        location: { value: 'Chennai, Tamil Nadu', aiConfidence: 'high' as const, needsReview: false },
    };

    let summary = '';
    if (Array.isArray(analysis?.ai_report_content)) {
        summary = analysis.ai_report_content.map((item: any) => item.legal_english || item.simple_english || '').join('\n\n---\n\n');
    } else {
        summary = analysis?.ai_report_content || '';
    }

    const content = {
        summary,
        propertyDetails: 'Details extracted from document...',
        valuationMethod: 'Comparative Method',
        finalValuation: '₹ 45,00,000',
    };

    return {
        id: report.id,
        customerName: report.customer_name || report.report_name || 'Unknown',
        bankName: report.bank_name || 'Unknown Bank',
        propertyType: 'Residential',
        location: 'Chennai',
        status: (report.report_status?.toLowerCase() as any) || 'draft',
        createdAt: new Date(report.created_at),
        updatedAt: new Date(report.updated_at),
        year: '2024',
        month: 'Feb',
        files: (files || []).map((f: any) => ({
            id: f.id,
            name: f.file_name,
            type: 'original' as const,
            size: `${f.file_size_mb || 0} MB`,
            uploadedAt: new Date(f.created_at),
            url: `/api/v1/files/${f.id}`,
        })),
        metadata,
        content,
        comments: [],
        auditTrail: [],
    };
}
