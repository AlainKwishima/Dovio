# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project scope
- This repo is an API contract repository. It contains OpenAPI 3.1 specifications for the Mobile API. There is no application runtime or tests here.
- Authoritative spec: openapi/mobile.v1.yaml
- Legacy/minimal spec kept for reference: src/swagger.yaml

Commands
- Validate the OpenAPI spec
  - Using Redocly CLI (Node):
    ```sh
    npx @redocly/cli@latest lint openapi/mobile.v1.yaml
    ```
  - Using Docker (no local Node needed):
    ```sh
    docker run --rm -v ${PWD}:/work -w /work redocly/cli:latest lint openapi/mobile.v1.yaml
    ```
- Preview the API docs locally (Swagger UI via Docker)
  ```sh
  docker run --rm -p 8080:8080 \
    -e SWAGGER_JSON=/spec/openapi.yaml \
    -v ${PWD}/openapi/mobile.v1.yaml:/spec/openapi.yaml \
    swaggerapi/swagger-ui
  # Open http://localhost:8080
  ```
- Bundle/export a distributable spec
  - Redocly bundle (YAML):
    ```sh
    npx @redocly/cli@latest bundle openapi/mobile.v1.yaml -o dist/mobile.v1.bundle.yaml
    ```
  - Swagger CLI (JSON):
    ```sh
    npx swagger-cli@latest bundle openapi/mobile.v1.yaml -o dist/mobile.v1.json -t json
    ```
- Compare the two specs in this repo
  ```sh
  git --no-pager diff --no-index src/swagger.yaml openapi/mobile.v1.yaml
  ```

Architecture and structure
- Purpose: Defines the HTTP contract for a social/mobile backend. The spec is the source of truth for downstream server and client generation.
- Files:
  - openapi/mobile.v1.yaml — primary, versioned spec. Targets server base URL http://localhost:5000/api
  - src/swagger.yaml — older/simpler draft; superseded by mobile.v1.yaml
- Cross‑cutting concerns encoded in the spec:
  - Security: bearerAuth (JWT) via HTTP Authorization header
  - Pagination: common query params page and limit
  - IDs: string identifiers across resources; timestamps use RFC 3339 date-time
  - Consistent 200/201 responses for read/create operations
- Domain surface (high level):
  - Auth: register, login, refresh, email/password/2FA flows
  - Users: profile, account deletion, wallet (balance, send, withdraw), activity tracking
  - Content: posts, stories, comments, reactions, shares
  - Messaging: conversations, messages CRUD
  - Social graph: follow/followers/following/status
  - Feed & discovery: feed, discover, trending
  - Search: users, posts, stories, global, suggested users
  - Notifications: list, read, read-all, delete

Conventions for contributors
- Treat openapi/mobile.v1.yaml as canonical. Update it first; remove or sync src/swagger.yaml only if explicitly needed.
- When adding endpoints or schemas:
  - Add/extend under appropriate domain path group
  - Reuse components/schemas where possible (e.g., UserPublic)
  - Keep security requirements explicit per operation where needed
- Versioning: follow the mobile.v{N}.yaml naming for breaking changes; prefer non-breaking additive changes where possible.

Notes
- No CLAUDE/Cursor/Copilot rules or README detected in this repository.
- If server/client code generation is desired, prefer using OpenAPI Generator or Redocly tools externally; no generator config is committed here.
