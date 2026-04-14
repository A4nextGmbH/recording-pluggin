# Standalone Bug Reporter

A standalone bug reporting full-stack solution featuring a Vanilla JS embeddable plugin with a Shadow DOM, an Express Node.js backend using MongoDB, and a React frontend dashboard.

## Project Structure

- \`/plugin\` - A self-contained, embeddable Vite library snippet for host applications.
- \`/backend\` - Express REST server processing \`multipart/form-data\` and MongoDB integration. 
- \`/frontend\` - React Dashboard to view all bug reports across registered apps.

## Requirements

- Node.js (18+ recommended)
- MongoDB Connection URI (e.g., MongoDB Atlas or local MongoDB instance)

## Setting Up the Backend

1. Navigate to the backend directory:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a \`.env\` file by copying \`.env.example\`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Fill in your \`MONGO_URI\` in the \`.env\` file.
4. Start the server:
   \`\`\`bash
   npm run dev
   \`\`\`

The server runs on \`http://localhost:4000\`.

## Setting Up the Frontend Dashboard

1. Navigate to the frontend directory:
   \`\`\`bash
   cd frontend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Optional: Create a \`.env\` file by copying \`.env.example\` if you need to override \`VITE_API_URL\`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
4. Start the dashboard:
   \`\`\`bash
   npm run dev
   \`\`\`

The dashboard runs typically on \`http://localhost:5173\`.

## Setting Up and Using the Plugin

The plugin is a single HTML Vanilla JS file compiled via Vite that creates an isolated Shadow DOM rendering the UI for bug reporting.

1. Navigate to the plugin directory and install dependencies:
   \`\`\`bash
   cd plugin
   npm install
   \`\`\`
2. Build the plugin bundle:
   \`\`\`bash
   npm run build
   \`\`\`
   This generates \`dist/plugin.umd.js\` (or \`dist/plugin.js\`), which is the unified bundle containing all JS and CSS.

### Injecting into an App

To embed the reporter in ANY web application (Plain HTML, React, Angular, Vue, etc), simply add this script tag directly into the \`<head>\` or \`<body>\` of the host application pointing to wherever you hosted the plugin file:

\`\`\`html
<script 
  src="path/to/your/plugin.js"
  data-app-name="My Awesome App"
  data-api-url="http://localhost:4000">
</script>
\`\`\`

- \`data-app-name\`: The identifier categorizing the bugs on the dashboard.
- \`data-api-url\`: Back-end Express REST API URL handling bug drops. 

Nothing else is required! It automatically handles floating UI, shadow styling isolation, screen recording, and uploads.
