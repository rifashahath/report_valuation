import { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { ReportFile } from '../../../types';
import { formatDate } from '../../../utils/formatDate';
import { Modal } from '../../common/Modal';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FilePreviewModalProps {
    file: ReportFile | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (file: ReportFile) => void;
}

export default function FilePreviewModal({
    file,
    isOpen,
    onClose,
    onDownload
}: FilePreviewModalProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    // Reset state when file changes
    useEffect(() => {
        if (isOpen && file) {
            setPageNumber(1);
            setScale(1.0);
        }
    }, [isOpen, file]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    const isPdf = file?.name?.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file?.name || '');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={file?.name || 'File Preview'}
            size="full"
        >
            <div className="h-[80vh] grid grid-cols-1 lg:grid-cols-3 gap-6">
                {file && (
                    <>
                        {/* Preview Area */}
                        <div className="lg:col-span-2 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex flex-col relative shadow-inner">
                            {file.url && file.url !== '#' ? (
                                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                                    {isPdf ? (
                                        <Document
                                            file={file.url}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            className="mx-auto"
                                            loading={
                                                <div className="flex items-center justify-center p-12">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                                                </div>
                                            }
                                            error={
                                                <div className="text-center p-8 text-red-500">
                                                    <p>Failed to load PDF.</p>
                                                    <p className="text-sm mt-2">The file might be corrupted or missing.</p>
                                                </div>
                                            }
                                        >
                                            <Page
                                                pageNumber={pageNumber}
                                                scale={scale}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                className="shadow-lg"
                                            />
                                        </Document>
                                    ) : isImage ? (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            className="max-w-full max-h-full object-contain shadow-lg"
                                        />
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                            <FileText size={64} className="mb-4 text-gray-300" />
                                            <p className="font-medium">Preview not available for this file type</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                    <FileText size={64} className="mb-4 text-gray-300" />
                                    <p className="font-medium">Preview unavailable</p>
                                </div>
                            )}

                            {/* PDF Controls */}
                            {isPdf && numPages && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg px-4 py-2 flex items-center gap-4 z-10">
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={pageNumber <= 1}
                                            onClick={previousPage}
                                            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <span className="text-sm font-medium w-16 text-center">
                                            {pageNumber} / {numPages}
                                        </span>
                                        <button
                                            disabled={pageNumber >= numPages}
                                            onClick={nextPage}
                                            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                            title="Zoom Out"
                                        >
                                            <ZoomOut size={18} />
                                        </button>
                                        <span className="text-xs font-medium w-12 text-center">
                                            {Math.round(scale * 100)}%
                                        </span>
                                        <button
                                            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                            title="Zoom In"
                                        >
                                            <ZoomIn size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Metadata Sidebar */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 overflow-y-auto shadow-sm flex flex-col">
                            <div className="space-y-6 flex-1">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">File Details</h3>
                                    <p className="text-sm text-gray-500">Metadata and information</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">File Name</label>
                                        <p className="font-medium text-gray-900 break-all">{file.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Size</label>
                                            <p className="font-medium text-gray-900">{file.size}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Type</label>
                                            <p className="font-medium text-gray-900">{file.type ? file.type.toUpperCase() : 'UNKNOWN'}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Uploaded</label>
                                        <p className="font-medium text-gray-900">{formatDate(file.uploadedAt, 'long')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 mt-6">
                                <button
                                    onClick={() => onDownload(file)}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-200"
                                >
                                    <Download size={18} /> Download File
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
