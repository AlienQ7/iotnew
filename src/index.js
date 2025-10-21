// src/index.js - V 0.0.03 (Using import safety check for client script)

// NOTE: This code uses direct file imports, meaning auth.html, authStyles.js, 
// and authClient.js MUST be located in the 'src/' directory.

// =================================================================
// IMPORTS
// =================================================================

import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 

// A. CRITICAL: Direct imports for the frontend content
import AUTH_HTML from './auth.html'; 
import { STYLE_STRING } from './authStyles'; 
import AUTH_CLIENT_JS_CONTENT from './authClient.js'; 


// =================================================================
// Failsafe JS Injection Helper (With Type Check)
// =================================================================

/**
 * Strips comments and wraps the content in a safe, immediately-executing script tag.
 * CRITICAL FIX: Ensures jsContent is a string, even if imported as a module object.
 */
function createFailsafeScriptTag(jsContent) {
    let cleanContent = jsContent;
    
    // Check if the import returned an object (e.g., { default: "..." })
    if (typeof cleanContent === 'object' && cleanContent !== null && typeof cleanContent.default === 'string') {
        cleanContent = cleanContent.default;
    } else if (typeof cleanContent !== 'string') {
        // Fail loudly if it's not a recognizable format
        throw new Error("Could not extract client script content string for injection.");
    }
    
    try {
        // 1. Strip block comments (/* ... */) and line comments (// ...)
        cleanContent = cleanContent
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
            .trim();
            
        // 2. Wrap content in a simple, non-module script tag
        return `
            <script>
            console.log("Client Script starting execution.");
            try {
                // The IIFE structure from authClient.js is expected here: (function() { ... })()
                ${cleanContent}
            } catch(e) {
                console.error("Critical Execution Error in Injected Script:", e);
            }
            </script>
        `;
    } catch (e) {
        throw new Error(`Failed during script sanitation: ${e.message}`);
    }
}

// =================================================================
// JWT Authorization Middleware (No Change)
// =================================================================
async function authorizeRequest(request, env) {
    let token = request.headers.get('Authorization');
    if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
    } else {
        const cookieHeader = request.headers.get('Cookie');
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map(c => c.trim());
            const authTokenCookie = cookies.find(c => c.startsWith('auth_token='));
            if (authTokenCookie) {
                token = authTokenCookie.substring('auth_token='.length);
            }
        }
    }
    if (!token) {
        return { response: new Response('Missing Authorization Token.', { status: 401 }) };
    }
    // Assuming JWT_SECRET is available in env
    const decodedPayload = await verifyJWT(token, env.JWT_SECRET); 
    if (!decodedPayload || !decodedPayload.email) {
        return { response: new Response('Invalid or Expired Token. Please log in again.', { status: 401 }) };
    }
    return { user: { email: decodedPayload.email } };
}

// =================================================================
// MAIN WORKER HANDLER
// =================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // -------------------------------------------------------------
    // FRONTEND ROUTING: Serve auth.html on root path
    // -------------------------------------------------------------
    if (path === '/' || path === '/auth.html') {
        
        try {
            // 1. Start with the raw HTML string
            let injectedHtml = AUTH_HTML;
            
            // 2. Inject Styles (STYLE_STRING is imported from authStyles.js)
            const styleTag = `<style>${STYLE_STRING}</style>`;
            injectedHtml = injectedHtml.replace('</head>', `${styleTag}</head>`);
            
            // 3. Remove the external script link
            injectedHtml = injectedHtml.replace('<script type="module" src="./authClient.js"></script>', '');
            
            // 4. Inject the failsafe, cleaned script content
            const finalScriptTag = createFailsafeScriptTag(AUTH_CLIENT_JS_CONTENT);
            injectedHtml = injectedHtml.replace('</body>', `${finalScriptTag}</body>`);

            return new Response(injectedHtml, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
            
        } catch (error) {
            return new Response(`UI Injection Error: ${error.message}`, { status: 500 });
        }
    }

    // API ROUTING
    if (path.startsWith('/api/user/')) {
      return handleUserApi(path, method, request, env);
    } else if (path.startsWith('/api/device/') || path.startsWith('/api/schedule/')) {
      return handleProtectedApi(path, method, request, env);
    }
    
    // Fallback 404 for non-API, non-root paths
    return new Response('API Route Not Found.', { status: 404 });
  },
  
  // -------------------------------------------------------------
  // SCHEDULED HANDLER (No Change)
  // -------------------------------------------------------------
  async scheduled(event, env, ctx) {
    console.log("Cron worker has been triggered.");
    ctx.waitUntil(handleScheduledTrigger(event, env, ctx)); 
  }
};

// =================================================================
// API ROUTERS (No Change)
// =================================================================
async function handleUserApi(path, method, request, env) {
  switch (path) {
    case '/api/user/signup':
      if (method === 'POST') {
        return handleSignUp(request, env); 
      }
      break;
    case '/api/user/login':
      if (method === 'POST') {
        return handleLogin(request, env); 
      }
      break; 
    default:
      return new Response('User API Not Found', { status: 404 });
  }
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleProtectedApi(path, method, request, env) {
    const authResult = await authorizeRequest(request, env);
    if (authResult.response) {
        return authResult.response; 
    }
    const userEmail = authResult.user.email; 

    switch (path) {
        case '/api/device/add':
            if (method === 'POST') return handleDeviceAdd(request, env, userEmail);
            break;
        case '/api/device/list': 
            if (method === 'GET') return handleDeviceList(env, userEmail);
            break;
        case '/api/device/delete': 
            if (method === 'DELETE') return handleDeviceDelete(request, env, userEmail);
            break;
        case '/api/schedule/set':
            if (method === 'POST') return handleSetSchedule(request, env, userEmail);
            break;
        case '/api/schedule/list':
            if (method === 'GET') return handleScheduleList(env, userEmail);
            break;
        case '/api/schedule/delete':
            if (method === 'DELETE') return handleScheduleDelete(request, env, userEmail);
            break;
        case '/api/schedule/toggle':
            if (method === 'POST') return handleScheduleToggle(request, env, userEmail);
            break;
        default:
            return new Response('Protected API Not Found', { status: 404 });
    }

    return new Response('Method Not Allowed', { status: 405 });
}
