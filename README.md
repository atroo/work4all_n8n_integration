# n8n-nodes-work4all

This is an n8n community node package that integrates [work4all](https://work4all.de) — the all-in-one ERP and CRM system — into your n8n workflows.

## Features

- **Create Incoming Invoices** — post incoming invoices to work4all via GraphQL, with support for:
  - Form-field mode (fill each field individually)
  - JSON mode (pass a single JSON object — ideal for LLM output)
  - File attachments (PDFs, XMLs, ZIPs) via binary data from upstream nodes

## Authentication

This node uses **OAuth2 Client Credentials** to authenticate against the work4all API.

You will need:

| Field | Description |
|-------|-------------|
| API URL | Base URL of your work4all instance, e.g. `https://api.work4all.de` |
| Token URL | OAuth2 token endpoint, e.g. `https://auth.work4all.de/connect/token` |
| Client ID | Your OAuth2 client ID |
| Client Secret | Your OAuth2 client secret |

Contact your work4all administrator to obtain client credentials with the required permissions.

## Installation

### In n8n (recommended)

1. Go to **Settings → Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-work4all`
4. Click **Install**

### Manual (self-hosted)

```bash
npm install n8n-nodes-work4all
```

Then restart your n8n instance.

## Operations

### Create Incoming Invoice

Creates a complete incoming invoice in work4all including line items and optional file attachments.

**Supplier lookup** — you can identify the supplier by (in priority order):
- Supplier Code (internal work4all ID)
- Supplier Name
- Customer Number at Supplier
- Supplier Contact Email
- Supplier IBAN

**Invoice items** — enter manually via form fields or provide a JSON array.

**Attachments** — attach files from binary properties of upstream nodes (e.g. HTTP Request, Gmail, Read Binary File). Supports form mode or JSON array mode for dynamic/LLM-driven attachment selection.

## Example Workflows

The [`examples/createIncomingInvoice/`](examples/createIncomingInvoice/) directory contains ready-to-import workflows:

| File | Description |
|------|-------------|
| `w4a-invoice-gmail.json` | Polls a Gmail inbox for invoice emails, extracts attachments, and creates incoming invoices in work4all |
| `w4a-invoice-exchange.json` | Polls a Microsoft Exchange/Outlook inbox for invoice emails and creates incoming invoices in work4all |

To import: open n8n → **Workflows** → **Import from file**.

## Resources

- [work4all website](https://work4all.de)
- [work4all API documentation](https://docs.work4all.de)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)
