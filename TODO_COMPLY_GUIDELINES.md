# n8n UX Guidelines — Compliance TODO

## Quick fixes

- [ ] `Work4all.node.ts` — `displayName: 'work4all'` → `'Work4all'`
- [ ] `Work4all.node.ts` — `defaults: { name: 'work4all' }` → `'Work4all'`
- [ ] `Work4allApi.credentials.ts` — add `typeOptions: { password: true }` to `clientId` field
- [ ] `createIncomingInvoice/description.ts` line 116 — placeholder missing `e.g.` prefix
- [ ] `customer/description.ts` — filter placeholder missing `e.g.` prefix
- [ ] `project/description.ts` — filter placeholder missing `e.g.` prefix

## Operations naming

- [ ] `Work4all.node.ts` — rename `Get All Customers` → `Get Many Customers` (value: `getManyCustomers`)
- [ ] `Work4all.node.ts` — rename `Get All Projects` → `Get Many Projects` (value: `getManyProjects`)
- [ ] Update all references to `getAllCustomers` / `getAllProjects` in `customer/execute.ts`, `project/execute.ts`, tests
- [ ] `Work4all.node.ts` — add `action` and `description` keys to all operation options

## Output parameter

- [ ] Add `Output` options parameter (Simplified / Raw / Selected Fields) to all GET operations and `createIncomingInvoice`
- [ ] Define simplified field sets (≤10 fields) for customer, project, and invoice responses
- [ ] Implement output filtering in execute functions: hardcoded fields for Simplified, user-supplied JSON array for Selected Fields, passthrough for Raw

## Error handling

- [ ] Wrap errors with `NodeApiError` / `NodeOperationError` in all execute functions
- [ ] Include operation name and actionable guidance in error messages

## Example workflows

- [ ] Update `examples/createIncomingInvoice/work4all-invoice-workflow.json` to reflect any node changes (renamed operations, new parameters)
