# n8n UX Guidelines — Compliance TODO

## Quick fixes

- [x] `Work4all.node.ts` — `displayName: 'work4all'` → `'Work4all'`
- [x] `Work4all.node.ts` — `defaults: { name: 'work4all' }` → `'Work4all'`
- [x] `Work4allApi.credentials.ts` — add `typeOptions: { password: true }` to `clientId` field
- [x] `createIncomingInvoice/description.ts` line 116 — placeholder missing `e.g.` prefix
- [x] `customer/description.ts` — filter placeholder missing `e.g.` prefix
- [x] `project/description.ts` — filter placeholder missing `e.g.` prefix

## Operations naming

- [x] `Work4all.node.ts` — rename `Get All Customers` → `Get Many Customers` (value: `getManyCustomers`)
- [x] `Work4all.node.ts` — rename `Get All Projects` → `Get Many Projects` (value: `getManyProjects`)
- [x] Update all references to `getAllCustomers` / `getAllProjects` in `customer/execute.ts`, `project/execute.ts`, tests
- [x] `Work4all.node.ts` — add `action` and `description` keys to all operation options

## Output parameter

- [x] Add `Output` options parameter (Simplified / Raw / Selected Fields) to all GET operations and `createIncomingInvoice`
- [x] Define simplified field sets (≤10 fields) for customer, project, and invoice responses
- [x] Implement output filtering in execute functions: hardcoded fields for Simplified, user-supplied JSON array for Selected Fields, passthrough for Raw

## Error handling

- [x] Wrap errors with `NodeApiError` / `NodeOperationError` in all execute functions
- [x] Include operation name and actionable guidance in error messages

## Example workflows

- [x] Update `examples/createIncomingInvoice/work4all-invoice-workflow.json` to reflect any node changes (renamed operations, new parameters)
