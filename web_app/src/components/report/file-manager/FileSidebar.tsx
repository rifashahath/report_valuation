import {
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Search,
    FileText
} from 'lucide-react';
import { FileNode } from '../../../types';

interface FileSidebarProps {
    fileTree: FileNode[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    expandedNodes: Set<string>;
    onToggleNode: (nodeId: string) => void;
    selectedNode: FileNode | null;
    onSelectNode: (node: FileNode) => void;
}

export default function FileSidebar({
    fileTree,
    searchQuery,
    onSearchChange,
    expandedNodes,
    onToggleNode,
    selectedNode,
    onSelectNode
}: FileSidebarProps) {

    const renderTreeNode = (node: FileNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedNode?.id === node.id;

        return (
            <div key={node.id} className="mb-0.5 group">
                <div
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                    style={{ paddingLeft: `${level * 16 + 16}px` }}
                    onClick={() => {
                        if (node.type === 'folder') onToggleNode(node.id);
                        onSelectNode(node);
                    }}
                >
                    {node.type === 'folder' && (
                        <span className="text-gray-400">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    )}

                    {node.type === 'folder' ? (
                        isExpanded ? (
                            <FolderOpen size={18} className="text-blue-500" />
                        ) : (
                            <Folder size={18} className="text-blue-500" />
                        )
                    ) : (
                        <FileText size={18} className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium truncate">{node.name}</span>
                </div>
                {node.type === 'folder' && isExpanded && node.children && (
                    <div className="mt-0.5">
                        {node.children.map((child) => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 overflow-auto flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Folder Structure</h2>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>
            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                {fileTree.map((node) => renderTreeNode(node))}
            </div>
        </div>
    );
}
