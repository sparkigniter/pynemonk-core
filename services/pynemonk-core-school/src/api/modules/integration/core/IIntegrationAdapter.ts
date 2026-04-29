/**
 * ──────────────────────────────────────────────────────────────────────────────
 *  Pynemonk Plugin SDK  ·  v2.0
 *  Core interfaces and context API available to all integration adapters.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── UI placement manifest ────────────────────────────────────────────────────

export interface UIPlacement {
    /** Where in the shell the button / menu item appears */
    location:
        | 'sidebar'
        | 'student_profile'
        | 'student_list'
        | 'staff_profile'
        | 'dashboard'
        | 'settings'
        | 'exam_overview'
        | 'marks_entry';
    label: string;
    /** If the placement is a navigation link, this is the target path */
    path?: string;
    /** Named action to invoke via executeAction() */
    action: string;
    icon?: string;
    group?: 'academic' | 'people' | 'operations' | 'reports';
    /** Which user permissions are required. ANY match shows it. */
    permissions?: string[];
}

// ─── Export column definition ─────────────────────────────────────────────────

export interface ExportColumn {
    /** The key used to retrieve the value from the data row */
    key: string;
    /** The human-readable header shown in the spreadsheet */
    header: string;
    /** Optional width in character units (default: 20) */
    width?: number;
    /** Optional cell format: e.g. 'text', 'number', 'date' */
    format?: 'text' | 'number' | 'date';
}

// ─── Integration manifest ─────────────────────────────────────────────────────

export interface IntegrationManifest {
    /** Display name shown in the Integration Hub */
    name: string;
    /** URL-safe unique identifier: e.g. "karnataka-sats" */
    slug: string;
    description: string;
    version: string;
    /** List of named actions the plugin supports */
    supportedActions: string[];
    /** UI buttons / sidebar links injected by this plugin */
    uiPlacements?: UIPlacement[];
    /** JSON-schema for admin-level plugin configuration */
    configSchema?: Record<string, any>;
    /**
     * Describes actions that produce downloadable exports.
     * Consumed by the UI to show "Export to Excel" buttons.
     */
    exports?: Array<{
        action: string;
        label: string;
        description?: string;
        /** Mime type of the exported file */
        mimeType?: string;
        /** File extension without the dot, e.g. "xlsx" */
        extension?: string;
        /** Ordered list of columns for tabular exports */
        columns?: ExportColumn[];
    }>;
}

// ─── Plugin Context API ───────────────────────────────────────────────────────
//
//  Every plugin receives a PluginContext when execute() is called.
//  The context gives plugins safe, authenticated access to school data
//  without tight coupling to internal service classes.

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface StudentRecord {
    id: number;
    admission_no: string;
    first_name: string;
    last_name: string;
    gender: string | null;
    date_of_birth: string | null;
    mother_tongue: string | null;
    religion: string | null;
    nationality: string | null;
    classroom_name: string | null;
    classroom_section: string | null;
    [key: string]: any;
}

export interface ExternalIdentityRecord {
    entity_id: number;
    entity_type: string;
    system_slug: string;
    external_id: string;
    metadata: Record<string, any>;
}

/**
 * PluginContext — the stable API surface that plugins use to interact
 * with Pynemonk's core data. This is injected at call-time so plugins
 * never need to reference internal service classes directly.
 */
export interface PluginContext {
    tenantId: number;

    /** ── Data Access ─────────────────────────────── */

    /** Fetch a paginated list of students for the current tenant */
    getStudents(filters?: {
        search?: string;
        classroom_id?: number;
        academic_year_id?: number;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<StudentRecord>>;

    /**
     * Fetch ALL students (iterates pages internally).
     * Use for exports where all records are needed.
     */
    getAllStudents(filters?: {
        search?: string;
        classroom_id?: number;
        academic_year_id?: number;
    }): Promise<StudentRecord[]>;

    /** ── External Identity API ──────────────────── */

    /** Get a previously stored external ID for an entity */
    getExternalId(
        entityType: string,
        entityId: number,
    ): Promise<ExternalIdentityRecord | undefined>;

    /** Persist / update an external ID mapping */
    saveExternalId(
        entityType: string,
        entityId: number,
        externalId: string,
        metadata?: Record<string, any>,
    ): Promise<ExternalIdentityRecord>;

    /** List all external ID mappings for a given entity type */
    listExternalIds(entityType: string): Promise<ExternalIdentityRecord[]>;

    /** ── Plugin Settings ────────────────────────── */

    /** Read the integration's stored configuration JSON */
    getSettings(): Promise<Record<string, any> | null>;

    /** ── Hooks ──────────────────────────────────── */

    /** Register a handler for a named hook (e.g. 'student.created') */
    on(event: string, handler: (payload: any) => Promise<void>): void;

    /** Emit a hook — typically called by the core, exposed for inter-plugin use */
    emit(event: string, payload: any): Promise<void>;

    /** ── Logging ─────────────────────────────────── */

    log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void;
}

// ─── Integration Adapter contract ────────────────────────────────────────────

export interface IIntegrationAdapter {
    getManifest(): IntegrationManifest;

    /**
     * Execute a named action.
     *
     * @param context   The fully-populated PluginContext for this request.
     * @param action    The action name (from manifest.supportedActions).
     * @param options   Additional request parameters (query / body merged).
     *
     * @returns For regular actions: any JSON-serialisable value.
     *          For file exports  : an ExportResult containing the binary buffer.
     */
    execute(context: PluginContext, action: string, options?: any): Promise<any>;
}

// ─── Export result for file-download actions ──────────────────────────────────

export interface ExportResult {
    /** Raw file bytes */
    buffer: Buffer;
    /** e.g. 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' */
    mimeType: string;
    /** Suggested filename including extension */
    filename: string;
}

export function isExportResult(value: any): value is ExportResult {
    return (
        value !== null &&
        typeof value === 'object' &&
        Buffer.isBuffer(value.buffer) &&
        typeof value.mimeType === 'string' &&
        typeof value.filename === 'string'
    );
}
