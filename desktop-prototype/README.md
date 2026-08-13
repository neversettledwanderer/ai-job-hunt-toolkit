# AI Job Hunt Desktop frontend prototype

This folder contains a dependency-free interactive prototype for the desktop application described in [`docs/DESKTOP_APP_PRD.md`](../docs/DESKTOP_APP_PRD.md).

## Run it

From the repository root:

```bash
python3 -m http.server 4173 --directory desktop-prototype
```

Then open `http://localhost:4173`.

You can also open `desktop-prototype/index.html` directly in a browser. Serving it locally gives behaviour closer to a packaged application.

## What to try

- Navigate between Overview, Pipeline, Jobs, Applications, Interviews, Contacts, Documents, Activity, and Settings.
- Search the active screen with the top search field or `Command/Ctrl + K`.
- Select a job to inspect its readiness and next actions.
- Add a sample job. It is stored only in memory and disappears on refresh.
- Drag a pipeline card by one column to simulate a valid status transition.
- Open the AI Job Coach and try the suggested prompts.
- Review responsive behaviour by resizing the window.

## Prototype limitations

This is a product-review prototype, not the production desktop runtime. It deliberately:

- Uses representative in-memory data.
- Makes no network requests.
- Does not connect to Supabase or MCP.
- Does not read local files or Keychain credentials.
- Does not call an AI model.
- Does not launch Playwright or submit applications.
- Does not persist edits after the page is refreshed.

The production implementation should use Electron + React + TypeScript and follow the process isolation, authentication, security, approval, and testing requirements in the PRD.

