export interface UploadedFile {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    uploadDate: Date;
    fileSize: string;
    pages?: number;
    language?: string;
}

export interface ProjectReport {
    id: string;
    name: string;
    createdAt: Date;
    fileCount: number;
    status: 'completed' | 'processing';
}
