# Deploy

Deploy to local dev and production.

## Instructions

1. Run TypeScript check: `npx tsc --noEmit`
2. If type check passes:
   - Start/restart local dev server: `npm run dev`
   - Push to origin/main: `git push origin main`
3. Report status of both deployments

Local dev runs on http://localhost:3000
Production deploys automatically via Vercel when pushing to main.
