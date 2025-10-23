// src/index.js

// 1. Import the HTML template (assumes build system imports it as a string)
import AUTH_HTML_TEMPLATE from './auth.html'; 

// 2. Import the client script content (now a default-exported string)
import AUTH_CLIENT_JS_CONTENT from './auth-client.js';

// 3. Import the style content (now a default-exported string)
import CONSTANTS_CSS_CONTENT from './src/constants.js';

// Define the placeholder IDs used in the auth.html file
const SCRIPT_PLACEHOLDER = '<script id="auth-script-injection"></script>';
const STYLE_PLACEHOLDER = '<style id="auth-style-injection"></style>'; 

// Function to generate the final HTML content with injected script and style
function getAuthPage() {
    // 1. Construct the final <script> tag with the content
    const scriptTag = `<script type="module">${AUTH_CLIENT_JS_CONTENT}</script>`;

    // 2. Construct the final <style> tag with the content
    const styleTag = `<style>${CONSTANTS_CSS_CONTENT}</style>`;

    // 3. Inject content into the HTML template
    let finalHtml = AUTH_HTML_TEMPLATE;

    // Inject the CSS content into the <style> placeholder
    finalHtml = finalHtml.replace(STYLE_PLACEHOLDER, styleTag);

    // Inject the JS content into the <script> placeholder
    finalHtml = finalHtml.replace(SCRIPT_PLACEHOLDER, scriptTag);

    return finalHtml;
}

// The main Worker exported handler
export default {
    async fetch(request, env, ctx) {
        
        const url = new URL(request.url);

        // Serve the authentication page for the root path
        if (url.pathname === '/') {
            const finalHtml = getAuthPage();

            return new Response(finalHtml, {
                headers: {
                    'Content-Type': 'text/html;charset=UTF-8',
                },
            });
        }
        
        // Handle other routes or serve a 404
        return new Response('Not Found', { status: 404 });
    },
};
