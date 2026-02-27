import { useMemo } from 'react';
import { useReports } from '../hooks/useReports';
import FileManagement from '../components/report/FileManagement';
import { ApiReport } from '../apis/report.api';
import { FileNode, ValuationReport, ReportStatus, PropertyType } from '../types';

export default function ReportsPage() {
    const { data: reportsData } = useReports();

    const valuationReports: ValuationReport[] = useMemo(() => {
        if (!reportsData?.reports) return [];
        return reportsData.reports.map((r: ApiReport) => {
            // Backend returns `report_name` and `report_status` — not `name`/`customer_name`/`status`
            const reportName = r.report_name || r.name || `Report ${r.id.substring(0, 6)}`;
            const bankName = r.bank_name || 'Uncategorized';
            const reportStatus = (r.report_status || r.status || 'draft').toLowerCase() as ReportStatus;

            return {
                id: r.id,
                customerName: reportName,
                bankName,
                propertyType: (r.property_type as PropertyType) || 'Residential',
                location: r.location || '',
                status: reportStatus,
                createdAt: new Date(r.created_at),
                updatedAt: new Date(r.updated_at),
                year: new Date(r.created_at).getFullYear().toString(),
                month: new Date(r.created_at).toLocaleString('default', { month: 'long' }),
                files: r.files ? r.files.map((f: any) => ({
                    id: f.id,
                    name: f.file_name || f.name || `File ${f.id?.substring(0, 6) || '?'}`,
                    type: 'original' as const,
                    size: `${(f.file_size_mb || 0).toFixed(2)} MB`,
                    uploadedAt: new Date(f.created_at),
                    url: `http://localhost:8000/api/v1/files/${f.id}`
                })) : [],
                metadata: {
                    year: { value: '', aiConfidence: 'low' as const, needsReview: false },
                    bankName: { value: bankName, aiConfidence: 'low' as const, needsReview: false },
                    month: { value: '', aiConfidence: 'low' as const, needsReview: false },
                    customerName: { value: reportName, aiConfidence: 'low' as const, needsReview: false },
                    propertyType: { value: r.property_type || '', aiConfidence: 'low' as const, needsReview: false },
                    location: { value: r.location || '', aiConfidence: 'low' as const, needsReview: false }
                },
                content: { summary: '', propertyDetails: '', valuationMethod: '', finalValuation: '' },
                comments: [],
                auditTrail: []
            };
        });
    }, [reportsData]);

    const fileTree: FileNode[] = useMemo(() => {
        if (!valuationReports.length) return [];

        // Group by Year -> Bank
        const structure: Record<string, Record<string, FileNode[]>> = {};

        valuationReports.forEach(report => {
            const bankName = report.bankName || 'Uncategorized';
            const year = report.year || new Date().getFullYear().toString();

            if (!structure[year]) {
                structure[year] = {};
            }
            if (!structure[year][bankName]) {
                structure[year][bankName] = [];
            }

            structure[year][bankName].push({
                id: report.id,
                name: report.customerName,
                type: 'folder', // Report acts as a folder
                reportId: report.id,
                children: report.files.map(f => ({
                    id: f.id,
                    name: f.name || `File ${f.id.substring(0, 6)}`,
                    type: 'file',
                    reportId: report.id,
                    fileType: f.type
                }))
            });
        });

        // Convert to FileNode array (Years at top level)
        return Object.keys(structure).sort((a, b) => b.localeCompare(a)).map((year) => {
            const banksObj = structure[year];
            const banks = Object.keys(banksObj).sort();

            const bankNodes = banks.map((bankName, bIndex) => ({
                id: `year-${year}-bank-${bIndex}`,
                name: bankName,
                type: 'folder',
                children: banksObj[bankName]
            }));

            return {
                id: `year-${year}`,
                name: year,
                type: 'folder',
                children: bankNodes
            };
        }) as FileNode[];

    }, [valuationReports]);

    return (
        <FileManagement
            fileTree={fileTree}
            reports={valuationReports}
        />
    );
}
