// src/index.js AI 1

// 1. Import the HTML template
import AUTH_HTML_TEMPLATE from './auth.html'; 

// 2. Import the client script content (The script content string from auth-client.js)
import AUTH_CLIENT_JS_CONTENT from './auth-client.js';

// 3. Import the JavaScript constants (FIX: Use NAMED imports, fixing the build error)
import { BACKEND_URL, TOKEN_KEY } from './constants.js';

// 4. Import the style content (FIX: Import STYLE_STRING from the correct style file)
import { STYLE_STRING } from './auth-style.js';

// Define the placeholder IDs from auth.html
const SCRIPT_PLACEHOLDER = '<script id="auth-script-injection"></script>';
const STYLE_PLACEHOLDER = '<style id="auth-style-injection"></style>'; 

// Main fetch handler for the Cloudflare Worker
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Serve the authentication page at the root path
        if (url.pathname === '/' || url.pathname === '/auth') {
            return new Response(getAuthPage(BACKEND_URL, TOKEN_KEY, AUTH_CLIENT_JS_CONTENT, STYLE_STRING), {
                headers: {
                    'Content-Type': 'text/html',
                },
            });
        }
        
        // Placeholder for API routing (This assumes you have a separate API router handling /api/*)
        if (url.pathname.startsWith('/api/')) {
            // You would need to import and use your API handler here
            // Example: return handleApiRequest(request, env); 
            return new Response("API not yet implemented.", { status: 501 });
        }

        return new Response('Not Found', { status: 404 });
    },
    
    // Scheduled handler for the Cron trigger
    async scheduled(event, env, ctx) {
        // You would need to import and use your scheduled handler here
        // Example: import { handleScheduledTrigger } from './scheduler.js';
        // await handleScheduledTrigger(env, ctx);
        console.log("Scheduler triggered.");
    }
};

/**
 * Generates the full HTML page with injected CSS and client-side JS.
 * @param {string} backendUrl 
 * @param {string} tokenKey 
 * @param {string} clientScript 
 * @param {string} styleContent 
 * @returns {string} The final HTML string.
 */
function getAuthPage(backendUrl, tokenKey, clientScript, styleContent) {
    // CRITICAL FIX: Inject constants directly to fix the client-side module import error
    const CONSTANTS_INJECTION = `
const BACKEND_URL = "${backendUrl}";
const TOKEN_KEY = "${tokenKey}";
    `;

    // Combine the injected constants with the rest of the client script
    const fullScriptContent = CONSTANTS_INJECTION + clientScript; 

    // Inject as a standard script, not a module
    const scriptTag = `<script>${fullScriptContent}</script>`;

    // Construct the final <style> tag
    const styleTag = `<style>${styleContent}</style>`;

    // Inject content into the HTML template
    let finalHtml = AUTH_HTML_TEMPLATE;

    finalHtml = finalHtml.replace(STYLE_PLACEHOLDER, styleTag);
    finalHtml = finalHtml.replace(SCRIPT_PLACEHOLDER, scriptTag);

    return finalHtml;
}
