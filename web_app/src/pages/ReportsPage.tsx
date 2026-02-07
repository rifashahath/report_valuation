import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import FileManagement from '../components/report/FileManagement';
import { useAuth } from '../hooks/useAuth';
import reportsApi from '../apis/report.api';
import { FileNode, ValuationReport, ReportFile } from '../types';

export default function ReportsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch reports from API
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['reports'],
        queryFn: reportsApi.getReports,
    });

    // Access check
    if (user && !user.roles.includes('admin')) {
        return <Navigate to="/" replace />;
    }

    // Transform API data to FileTree and ValuationReports
    const fileTree: FileNode[] = [];
    const valuationReports: ValuationReport[] = [];

    if (response?.reports) {
        console.log('API Response - Total reports:', response.reports.length);
        console.log('First report sample:', response.reports[0]);

        const yearMap = new Map<string, FileNode>();

        response.reports.forEach((report: any) => {
            console.log(`Report ${report.report_name}: files =`, report.files);

            const date = new Date(report.created_at);
            const year = date.getFullYear().toString();
            const month = date.toLocaleString('default', { month: 'long' });

            // Create ReportFile objects from API files
            const reportFiles: ReportFile[] = (report.files || []).map((file: any) => ({
                id: file.id,
                name: file.file_name,
                type: 'original' as const,
                size: file.file_size_mb ? `${file.file_size_mb.toFixed(2)} MB` : 'Unknown',
                uploadedAt: new Date(file.created_at || report.created_at),
                url: `/api/v1/files/${file.id}`,
            }));

            // Create a minimal ValuationReport object
            valuationReports.push({
                id: report.id,
                customerName: report.report_name || 'Unnamed',
                bankName: report.bank_name || 'Unassigned',
                propertyType: 'Residential' as const,
                location: '',
                status: 'draft' as const,
                createdAt: new Date(report.created_at),
                updatedAt: new Date(report.updated_at),
                year: year,
                month: month,
                files: reportFiles,
                metadata: {} as any,
                content: {} as any,
                comments: [],
                auditTrail: [],
            });

            // 1. Year Level
            let yearNode = yearMap.get(year);
            if (!yearNode) {
                yearNode = {
                    id: `year-${year}`,
                    name: year,
                    type: 'folder',
                    children: [],
                };
                yearMap.set(year, yearNode);
                fileTree.push(yearNode);
            }

            // 2. Bank Level
            const bankName = report.bank_name || 'Unassigned';
            let bankNode = yearNode.children?.find((n) => n.name === bankName);
            if (!bankNode) {
                bankNode = {
                    id: `bank-${year}-${bankName}`,
                    name: bankName,
                    type: 'folder',
                    children: [],
                };
                yearNode.children?.push(bankNode);
            }

            // 3. Month Level
            let monthNode = bankNode.children?.find((n) => n.name === month);
            if (!monthNode) {
                monthNode = {
                    id: `month-${year}-${bankName}-${month}`,
                    name: month,
                    type: 'folder',
                    children: [],
                };
                bankNode.children?.push(monthNode);
            }

            // 4. Customer Level (Report)
            const customerNode: FileNode = {
                id: `report-${report.id}`,
                name: report.report_name || 'Unnamed Report',
                type: 'folder',
                reportId: report.id,
                children: reportFiles.map((file) => ({
                    id: file.id,
                    name: file.name,
                    type: 'file',
                    reportId: report.id,
                    fileType: 'original',
                })),
            };
            monthNode.children?.push(customerNode);
        });
    }

    // Handle file download
    const handleDownload = async (file: ReportFile) => {
        try {
            const blob = await reportsApi.downloadFile(file.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to download file');
        }
    };

    // Handle file upload
    const handleUpload = async (reportId: string, files: File[]) => {
        try {
            await reportsApi.uploadFiles(reportId, files);
            refetch();
        } catch (error) {
            console.error('Upload failed', error);
            throw error;
        }
    };

    // Handle delete
    const handleDelete = async (item: FileNode | ReportFile) => {
        try {
            // Check if it's a ReportFile from the grid view (does not have 'children' or 'reportId' directly usually, but check type)
            // Or a FileNode from the tree

            if ('reportId' in item && item.type === 'folder' && item.reportId) {
                // It's a report folder
                await reportsApi.deleteReport(item.reportId);
                toast.success('Report deleted successfully');
            } else {
                // Assume it's a file (either FileNode or ReportFile)
                // Both have 'id' which is the file ID for files
                // Note: For FileNode of type 'file', id is the file ID.
                await reportsApi.deleteFile(item.id);
                toast.success('File deleted successfully');
            }
            refetch();
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete item');
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <FileManagement
            fileTree={fileTree}
            reports={valuationReports}
            onNavigate={(page, id) => {
                if (id) {
                    navigate(`/reports/${id}/${page}`);
                } else {
                    navigate(`/${page}`);
                }
            }}
            onDownload={handleDownload}
            onUpload={handleUpload}
            onDelete={handleDelete}
        />
    );
}
