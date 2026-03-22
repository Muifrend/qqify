<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ef0a65b2-b0d2-4634-9bb7-cda0f3e8de85

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `NEXT_PUBLIC_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy To GitHub Pages

1. In GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.
2. Add a repository secret named `NEXT_PUBLIC_GEMINI_API_KEY`.
3. Push to `main` to trigger the workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

This app calls the Gemini API directly from the browser, so `NEXT_PUBLIC_GEMINI_API_KEY` is exposed client-side in any GitHub Pages deployment. Use a key you are comfortable shipping publicly, or move model calls behind a server before treating the app as private.
