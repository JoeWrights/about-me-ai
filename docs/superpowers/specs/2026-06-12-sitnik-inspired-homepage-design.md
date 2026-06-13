# Sitnik-Inspired Homepage Design

## Goal

Update the web homepage to reference the restrained personal-site style of https://sitnik.es/en/ while keeping the AI assistant unchanged in the bottom-right corner.

## Selected Direction

Use the approved "modern minimal" direction:

- Light background, dark text, generous whitespace, and minimal decoration.
- Content-first layout with a strong personal identity block.
- Simple grouped links/sections inspired by a personal directory page.
- Modern sans-serif typography to stay consistent with the current React/Tailwind app.

## Homepage Structure

The page should replace the current dark hero with a single light personal homepage using the current resume content:

- Small uppercase label: `About Me AI`.
- Large primary heading: `Joe Wright`.
- Short description explaining that the page can answer questions about resume, projects, and skills.
- Compact skill/topic pills: `React`, `TypeScript`, `NestJS`, and `AI Assistant`.
- Three information groups:
  - `Contact`: show the available phone contact from the resume.
  - `Work`: summarize the personal AI Q&A assistant project.
  - `Ask`: prompt the visitor to open the AI assistant for questions about skills, resume, and projects.

## Component Boundary

Only `App` homepage markup and global page styling should change. `FloatingAssistant` behavior, position, and interaction should remain unchanged.

## Testing

Run the web app lint/typecheck or build after the edit. Manual check should confirm the page is light/minimal and the AI assistant still opens from the bottom-right corner.
