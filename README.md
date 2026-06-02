# n8n-nodes-work4all

This is an n8n community node package that integrates [work4all](https://work4all.de) — the all-in-one ERP and CRM system — into your n8n workflows.

## Features

- **Create Incoming Invoices** — post incoming invoices to work4all via GraphQL, with support for:
  - Form-field mode (fill each field individually)
  - JSON mode (pass a single JSON object — ideal for LLM output)
  - File attachments (PDFs, XMLs, ZIPs) via binary data from upstream nodes
- **Customers** — create, update, and retrieve customers (single or paginated list)
- **Projects** — retrieve projects (single or paginated list)
- **Multi-tenant (Mandant) support** — pick the target work4all tenant per node; the tenant list is loaded directly from your instance

## Multi-tenant (Mandant) support

work4all instances can host multiple tenants (Mandanten). Every node has a **Mandant** field at the top that controls which tenant the request targets — the value is sent on each API call via the `x-work4all-mandant` HTTP header.

- **Default** is `1`.
- The dropdown is populated dynamically: when you open it, the node discovers the available tenants from your instance (via `GET /api/Mandant/{code}`) and shows their names, while storing the numeric tenant code internally.
- You can also switch the field to **expression mode** to set the tenant code from data (e.g. `={{ $json.mandant }}`).

The Mandant is applied consistently to **all** operations, including the file upload step of *Create Incoming Invoice*.

## Authentication

This node uses **OAuth2 Client Credentials** to authenticate against the work4all API.

You will need:

| Field | Description |
|-------|-------------|
| API URL | Base URL of your work4all instance, e.g. `https://api.work4all.de` |
| Access Token URL | OAuth2 token endpoint, e.g. `https://auth.work4all.de/connect/token` |
| Client ID | Your OAuth2 client ID |
| Client Secret | Your OAuth2 client secret |

Contact your work4all administrator to obtain client credentials with the required permissions.

## Development

### Dev Container (recommended)

This repo includes a [Dev Container](https://containers.dev/) configuration under `.devcontainer/`.

1. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension in VS Code or Cursor.
2. **Dev Containers: Reopen in Container** from the command palette.
3. After the container builds, run:

```bash
npm run dev          # local n8n with this node — http://localhost:5678
npm test             # integration tests (requires .env.test)
npm run build:watch  # rebuild on TypeScript changes
```

Copy `.env.test.example` to `.env.test` inside the container for integration tests against a real work4all tenant. The workspace folder is mounted into the container, so your local `.env.test` is available after you create it on the host.

### Local (without container)

This package requires **Node.js 22** (the `@n8n/node-cli` build/dev tooling relies on Node 22+). A [`.nvmrc`](.nvmrc) is included, so you can run:

```bash
nvm use      # selects Node 22 from .nvmrc
npm ci
npm run build
npm run dev
```

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

### Customers

- **Get Customer** — retrieve a single customer by its internal code.
- **Get Many Customers** — retrieve a paginated list, with an optional JSON filter.
- **Create Customer** / **Update Customer** — create or update a customer record.

### Projects

- **Get Project** — retrieve a single project by its internal code.
- **Get Many Projects** — retrieve a paginated list, with an optional JSON filter.

> **Pagination note:** the `Page` field is **zero-based** — the first page is `0`.

All list and read operations support an **Output** mode (`Simplified`, `Raw`, or `Selected Fields`) to control how much of the response is returned.

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
