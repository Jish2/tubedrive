# TubeDrive

A React application that renders Videos and Playlists from a user's YouTube account as Files and Folders.

## Features

- Google OAuth authentication (client-side only)
- Fetch and manage YouTube playlists
- Create, update, and delete playlists
- Add/remove videos from playlists

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the YouTube Data API v3
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - **Authorized JavaScript origins:**
     - For development: `http://localhost:5173` (or your Vite dev server port)
     - For production: `https://yourdomain.com`
   - **Authorized redirect URIs:**
     - For development: `http://localhost:5173` (or your Vite dev server port)
     - For production: `https://yourdomain.com`
   - Copy your Client ID

3. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

4. Add your Google Client ID to `.env`:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

5. Start the development server:

```bash
pnpm dev
```

## Usage

After logging in with Google, you can use the YouTube API functions from `src/services/youtubeApi.ts` to:

- Fetch user playlists: `fetchUserPlaylists(accessToken)`
- Fetch playlist items: `fetchPlaylistItems(accessToken, playlistId)`
- Create playlists: `createPlaylist(accessToken, title, description, privacyStatus)`
- Update playlists: `updatePlaylist(accessToken, playlistId, title, description)`
- Add videos to playlists: `addVideoToPlaylist(accessToken, playlistId, videoId)`
- Remove videos from playlists: `removeVideoFromPlaylist(accessToken, playlistItemId)`
- Delete playlists: `deletePlaylist(accessToken, playlistId)`

You can also use the `useYouTubePlaylists` hook from `src/hooks/useYouTubePlaylists.ts` for a React-friendly interface.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
