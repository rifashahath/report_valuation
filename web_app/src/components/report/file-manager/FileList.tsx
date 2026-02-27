import {
    FileText,
    Download,
    Eye,
    Trash2,
    Folder,
    GripVertical
} from 'lucide-react';
import { ReportFile } from '../../../types';
import { formatDate } from '../../../utils/formatDate';

interface FileListProps {
    files: ReportFile[];
    viewMode: 'grid' | 'list';
    onPreview: (file: ReportFile) => void;
    onDownload: (file: ReportFile) => void;
    onDelete?: (file: ReportFile) => void;
    /** Called when a drag starts — pass the file being dragged up to parent */
    onDragStart?: (file: ReportFile) => void;
}

export default function FileList({
    files,
    viewMode,
    onPreview,
    onDownload,
    onDelete,
    onDragStart
}: FileListProps) {

    if (files.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center h-full flex flex-col items-center justify-center">
                <Folder size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Select a folder to view files</p>
            </div>
        );
    }

    const handleDragStart = (e: React.DragEvent, file: ReportFile) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('fileId', file.id);
        e.dataTransfer.setData('fileName', file.name);
        onDragStart?.(file);
    };

    return (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1" : "flex flex-col gap-4"}>
            {files.map((file) => {
                if (!file) return null;

                if (viewMode === 'grid') {
                    return (
                        <div
                            key={file.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, file)}
                            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-300 transition-all shadow-sm hover:shadow-md flex flex-col h-full relative group cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 active:shadow-lg active:ring-2 active:ring-blue-400"
                        >
                            {/* Drag handle indicator */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity">
                                <GripVertical size={16} className="text-gray-400" />
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <FileText size={24} />
                                </div>
                                <div className="bg-gray-50 px-2 py-1 rounded text-xs font-medium text-gray-500">
                                    {file.type ? file.type.toUpperCase() : 'FILE'}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 mb-4">
                                <h3 className="font-bold text-gray-900 truncate mb-1" title={file.name}>
                                    {file.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {file.size} • {formatDate(file.uploadedAt, 'short')}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPreview(file);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <Eye size={16} /> Preview
                                </button>
                                <button
                                    onClick={(e) => { onDownload(file) }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download size={20} />
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(file);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div
                            key={file.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, file)}
                            className="group bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-400 hover:shadow-lg transition-all duration-300 flex items-center justify-between cursor-grab active:cursor-grabbing active:opacity-60 active:scale-[0.98] active:shadow-lg active:ring-2 active:ring-blue-400"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Drag handle */}
                                <div className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0">
                                    <GripVertical size={16} className="text-gray-400" />
                                </div>
                                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors shadow-inner">
                                    <FileText className="text-brand-600" size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-bold text-secondary-900 truncate" title={file.name}>{file.name}</h4>
                                    <p className="text-xs text-secondary-500 font-medium">{file.size} • {formatDate(file.uploadedAt, 'short')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button onClick={() => onPreview(file)} className="p-2.5 hover:bg-brand-50 rounded-xl text-brand-600 transition-all shadow-sm hover:shadow" title="Preview">
                                    <Eye size={20} />
                                </button>
                                <button onClick={() => onDownload(file)} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-600 transition-all shadow-sm hover:shadow" title="Download">
                                    <Download size={20} />
                                </button>
                                {onDelete && (
                                    <button onClick={() => onDelete(file)} className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm hover:shadow" title="Delete">
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }
            })}
        </div>
    );
}
