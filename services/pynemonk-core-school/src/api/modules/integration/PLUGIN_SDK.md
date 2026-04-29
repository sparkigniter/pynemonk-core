# Pynemonk Plugin SDK — Developer Guide

## Overview

The Pynemonk Plugin SDK allows any third-party developer to build integrations for the platform.
A plugin is a TypeScript class that implements `IIntegrationAdapter` and is registered with the `IntegrationRegistry`.

Plugins:
- Declare their capabilities via a **Manifest**
- Are called through a **PluginContext** that provides safe access to school data
- Can produce **JSON responses** or **binary file downloads** (Excel, CSV, PDF…)
- Can inject **UI buttons** into the shell without touching frontend code

---

## 1. Quick-Start: Minimal Plugin

```typescript
import { injectable } from 'tsyringe';
import type { IIntegrationAdapter, IntegrationManifest, PluginContext } from '../core/IIntegrationAdapter.js';

@injectable()
export class MyPlugin implements IIntegrationAdapter {

    getManifest(): IntegrationManifest {
        return {
            name: 'My Integration',
            slug: 'my-integration',
            description: 'Describe what this does.',
            version: '1.0.0',
            supportedActions: ['export_data'],
        };
    }

    async execute(context: PluginContext, action: string, options?: any): Promise<any> {
        if (action === 'export_data') {
            const students = await context.getAllStudents();
            return students.map(s => ({ name: `${s.first_name} ${s.last_name}` }));
        }
        throw new Error(`Unknown action: ${action}`);
    }
}
```

Register in `di.ts`:

```typescript
registry.register(container.resolve(MyPlugin));
```

---

## 2. PluginContext API Reference

Every `execute()` call receives a `PluginContext` scoped to the current tenant and plugin slug.

### Data Access

| Method | Description |
|--------|-------------|
| `getStudents(filters?)` | Paginated student list |
| `getAllStudents(filters?)` | All students (auto-paginates internally) |

### External Identity API

Used to map internal entity IDs → external system IDs (e.g., SATS ID).

| Method | Description |
|--------|-------------|
| `getExternalId(entityType, entityId)` | Retrieve a stored external ID |
| `saveExternalId(entityType, entityId, externalId, metadata?)` | Upsert an external ID mapping |
| `listExternalIds(entityType)` | List all mappings for this plugin + entity type |

### Plugin Settings

| Method | Description |
|--------|-------------|
| `getSettings()` | Read admin-configured JSON config for this integration |

### Hooks

| Method | Description |
|--------|-------------|
| `context.on(event, handler)` | Subscribe to a named event (e.g. `'student.created'`) |
| `context.emit(event, payload)` | Emit a named event (for inter-plugin communication) |

### Logging

```typescript
context.log('info',  'Starting export…');
context.log('warn',  'Student missing field', { studentId: 42 });
context.log('error', 'API call failed', error);
```

---

## 3. Producing Excel Exports

Use the `ExcelExportHelper` utility:

```typescript
import { ExcelExportHelper } from '../../helpers/ExcelExportHelper.js';
import type { ExportResult } from '../../core/IIntegrationAdapter.js';

async execute(context, action, options): Promise<ExportResult> {
    const students = await context.getAllStudents();

    return ExcelExportHelper.buildExportResult({
        sheetName: 'Student Data',
        filename: 'my_export.xlsx',
        columns: [
            { key: 'name',        header: 'Student Name', width: 30 },
            { key: 'admission',   header: 'Admission No.', width: 20 },
        ],
        rows: students.map(s => ({
            name:      `${s.first_name} ${s.last_name}`,
            admission: s.admission_no,
        })),
        metadata: {
            title: 'My Export',
            author: 'My Plugin v1.0',
        },
    });
}
```

When the adapter returns an `ExportResult`, the controller automatically streams it as a file download with the correct `Content-Type` and `Content-Disposition` headers.

Declare the export in your manifest so the UI can render "Export to Excel" buttons:

```typescript
exports: [{
    action: 'export_data',
    label: 'Export Student Data',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
}],
```

---

## 4. UI Placements

Inject buttons into the shell without modifying frontend code:

```typescript
uiPlacements: [
    {
        location: 'student_list',   // Where the button appears
        label: 'Export to SATS',
        action: 'export_students',  // Action name that gets called on click
        icon: 'FileSpreadsheet',    // Lucide icon name
        permissions: ['student:read'],
    },
    {
        location: 'sidebar',
        label: 'My Integration',
        group: 'operations',
        path: '/integrations?slug=my-integration',
        action: 'view',
    },
]
```

Supported locations: `sidebar`, `student_profile`, `student_list`, `staff_profile`, `dashboard`, `settings`, `exam_overview`, `marks_entry`.

---

## 5. Lifecycle Hooks

Plugins can subscribe to core system events to perform side effects:

```typescript
// In your adapter constructor or execute() method:
context.on('student.created', async (payload) => {
    context.log('info', 'New student enrolled', payload);
    // e.g. auto-sync to an external system
});
```

Hook names are namespaced: internally stored as `plugin:<slug>:<event>`.

---

## 6. File Structure Convention

```
src/api/modules/integration/
├── core/
│   ├── IIntegrationAdapter.ts    ← SDK contracts (do not modify)
│   ├── IntegrationRegistry.ts    ← Plugin registry
│   └── PluginContextFactory.ts   ← Builds PluginContext per request
├── helpers/
│   ├── IntegrationHelper.ts      ← DB access for identity mapping
│   └── ExcelExportHelper.ts      ← Generic XLSX builder
├── plugins/
│   └── your-plugin-name/
│       └── YourAdapter.ts        ← Your IIntegrationAdapter implementation
├── services/
│   └── IntegrationService.ts
├── controllers/
│   └── IntegrationController.ts
└── routes.ts
```

New plugins go in `plugins/<slug>/` and are registered in `di.ts`.
