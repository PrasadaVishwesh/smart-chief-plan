# Architecture rules

- Keep public recipe browsing separate from signed-in personal features; guard personal pages in the app and enforce each account's ownership in database policies and server functions, because browser checks alone are not access control.
- Authenticate every paid or personalized edge-function request with a verified user token, use narrow origin allowlists, and treat in-memory request limits as best-effort only because function instances do not share state.
- Do not add administrator-only routes or client-side role checks unless an actual admin feature is requested; any future roles belong in a protected roles table and must be checked server-side.