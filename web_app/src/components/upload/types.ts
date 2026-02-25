export interface UploadedFile {
    id: string;
    file?: File;
    name?: string;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    uploadDate: Date;
    fileSize: string;
    pages?: number;
    language?: string;
    serverFileId?: string; // ID from the server
}

export interface ProjectReport {
    id: string;
    name: string;
    createdAt: Date;
    fileCount: number;
    status: 'completed' | 'processing';
}
