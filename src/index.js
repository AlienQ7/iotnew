// src/index.js - CRITICAL: Final file for Worker deployment
//Ai 3
import SCRIPT_CONTENT from './auth-client';
import { STYLE_STRING } from './auth-styles';

// --- Placeholder for your HTML Template ---
// You need to define or import the actual HTML string.
// For this example, I'll use placeholders.
const AUTH_HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IoT Scheduler - Login / Register</title>
    <style id="auth-style-injection"></style> </head>
<body>
    <div class="auth-container">
        </div>
    <script id="auth-script-injection"></script> </body>
</html>
`;
const STYLE_PLACEHOLDER = '<style id="auth-style-injection"></style>';
const SCRIPT_PLACEHOLDER = '<script id="auth-script-injection"></script>';
// ------------------------------------------

/**
 * Generates the full HTML page with injected CSS and client-side JS.
 */
function getAuthPage(backendUrl, tokenKey, clientScript, styleContent) {
    // CRITICAL FIX: Inject constants directly with trailing semicolons (;)
    const CONSTANTS_INJECTION = `
const BACKEND_URL = "${backendUrl}";
const TOKEN_KEY = "${tokenKey}";
    `; // <-- Added necessary closing quotes and semi-colons

    // Combine the injected constants with the rest of the client script
    // NOTE: We also wrap the whole thing in an IIFE to ensure local scope and prevent collisions.
    const fullScriptContent = `(function() {
${CONSTANTS_INJECTION}
${clientScript}
})();`;

    // Inject as a standard script, not a module
    const scriptTag = `<script>${fullScriptContent}</script>`;

    // 2. Construct the final <style> tag with the content
    const styleTag = `<style>${styleContent}</style>`;

    // 3. Inject content into the HTML template
    let finalHtml = AUTH_HTML_TEMPLATE;

    // Inject the CSS content
    finalHtml = finalHtml.replace(STYLE_PLACEHOLDER, styleTag);

    // Inject the JS content
    finalHtml = finalHtml.replace(SCRIPT_PLACEHOLDER, scriptTag);

    return finalHtml;
}

// =================================================================
// MANDATORY WORKER HANDLER STRUCTURE (Fixes Code: 100329)
// =================================================================

const workerHandler = {
    /**
     * The main entry point for all incoming HTTP requests.
     */
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // --- Authentication Page Handler ---
        if (url.pathname === '/' || url.pathname === '/auth') {
            const backendUrl = request.url; // Use current Worker URL as backend
            const tokenKey = 'iot-auth-token'; // Example token key

            const htmlContent = getAuthPage(
                backendUrl, 
                tokenKey, 
                SCRIPT_CONTENT, 
                STYLE_STRING
            );

            return new Response(htmlContent, {
                headers: { 'Content-Type': 'text/html' },
            });
        }

        // --- API Route Handler (Example for your Backend URL) ---
        // This is where you'd handle requests to /api/user/login, etc.
        if (url.pathname.startsWith('/api/')) {
            // Your API logic would go here
            return new Response('API Endpoint', { status: 200 });
        }

        // Default 404 response
        return new Response('Not Found', { status: 404 });
    },

    /**
     * The handler for your Cron Triggers (since you defined them in wrangler.toml).
     * This is mandatory when cron triggers are set up.
     */
    async scheduled(event, env, ctx) {
        console.log(`Cron triggered at: ${event.scheduledTime}`);
        // Add your D1 cleanup or IoT scheduling logic here
        // await env.newbind.exec('DELETE FROM iot_logs WHERE timestamp < datetime("now", "-1 day")');
        // Since this is background work, return a dummy response
        return; 
    }
};

// This export is the FINAL, CRITICAL component that makes your Worker 
// an ES Module recognized by Cloudflare and fixes the D1 binding error.
export default workerHandler;
