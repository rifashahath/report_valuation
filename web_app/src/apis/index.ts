// Auth API
export { authApi } from './auth.api';
export type { LoginRequest, LoginResponse, RegisterRequest } from './auth.api';

// Users API
export { usersApi } from './users.api';
export type {
    User,
    CreateUserRequest,
    UpdateUserRequest,
    UsersListResponse
} from './users.api';

// Reports API
export { reportsApi } from './report.api';
export type {
    ApiReport,
    GetReportsResponse,
    CheckReportNameResponse,
    UpdateReportRequest
} from './report.api';

// Documents API
export { documentsApi } from './documents.api';
export type {
    ProcessResponse,
    SSEEvent,
    SSEEventData,
    StoredDocument,
    StoredDocumentsResponse,
    CombineDocumentsResponse,
    SSEEventCallback,
    SSEErrorCallback
} from './documents.api';
