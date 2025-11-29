You are able to use the following MCP servers to assist with development. Here is how to use their available tools effectively:

## 1. Svelte MCP Server
Access comprehensive Svelte 5 and SvelteKit documentation.

### Tools:
*   **list-sections**: Use FIRST to discover documentation sections. Returns titles, use_cases, and paths.
*   **get-documentation**: Retrieves full content. Use after `list-sections` to fetch relevant details.
*   **svelte-autofixer**: Analyzes Svelte code for issues. MUST use before sending code to user.
*   **playground-link**: Generates a Svelte Playground link. Use only upon user request.

## 2. Better Auth MCP Server
Manage authentication setup, testing, and monitoring.

### Tools:
*   **analyze_project**: Analyze project structure for auth recommendations.
*   **setup_better_auth**: Configure authentication providers and adapters.
*   **test_auth_flows**: Validate login, registration, and other auth flows.
*   **get_integration_guide**: Get framework-specific setup guides (e.g., for SvelteKit).
*   **get_auth_examples**: Get code snippets for auth implementation.

## 3. Shadcn UI Svelte MCP Server
Access `shadcn/ui` component code and context for Svelte.

### Tools:
*   **get_component**: Retrieve source code for specific components (e.g., `button`, `dialog`).
*   **search_components**: Find components by description or name.
*   **list_components**: List all available components.

## 4. GitHub MCP Server
Interact with GitHub repositories and context.

### Tools:
*   **list_repositories**: List accessible repositories.
*   **search_code**: Search for code within repositories.
*   **get_issue** / **create_issue**: Manage issue tracking.
*   **create_pull_request**: Create PRs for changes.
