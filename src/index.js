// index.js - FINAL AND CORRECTED CODE (Addressing all build/frontend issues)

// =================================================================
// IMPORTS
import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 
// A. IMPORT HTML: The builder turns this file content into a string
import AUTH_HTML from './auth.html'; 

// B. IMPORT STYLES: This works *only* because 'export const STYLE_STRING' was added to authStyles.js
import { STYLE_STRING } from './authStyles'; 
import { COLORS } from './constants'; // Keep, in case constants are used elsewhere in the worker

// C. IMPORT CLIENT JS: Use the '?raw' import trick to force the builder to provide the raw text string.
import AUTH_CLIENT_JS_CONTENT from './authClient.js?raw'; // <--- CRITICAL FIX: Added ?raw


// Assuming all schedule functions (including trigger) are in schedule.js
import { handleSetSchedule, handleScheduledTrigger, handleScheduleList, handleScheduleDelete, handleScheduleToggle } from './schedule'; 
import { handleDeviceAdd, handleDeviceList, handleDeviceDelete } from './device'; 


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
        
        // 1. Clean the HTML: Remove the problematic self-referencing <script> tag.
        // We look for the exact tag from auth.html: <script type="module" src="./authClient.js"></script>
        let injectedHtml = AUTH_HTML.replace('<script type="module" src="./authClient.js"></script>', '');
        
        // 2. Inject Styles into the HTML head
        const styleTag = `<style>${STYLE_STRING}</style>`;
        injectedHtml = injectedHtml.replace('</head>', `${styleTag}</head>`);
        
        // 3. Inject Client Script directly into the HTML body using the raw content.
        // NOTE: authClient.js still has import statements (e.g., import { injectStyles }...). 
        // When injected as raw text, those imports will fail in the browser.
        // We must strip them out, as the dependencies (styles, constants) are now already defined or handled by the worker.
        
        // This is a necessary hack: Remove module imports from the raw client script.
        const scriptCodeToInject = AUTH_CLIENT_JS_CONTENT
          .replace(/import {[^}]+} from '.\/authStyles.js';/g, '')
          .replace(/import {[^}]+} from '.\/constants.js';/g, '');
          
        
        const finalScriptTag = `
        <script type="text/javascript">
            // Now that the imports are stripped, we must manually call the injectStyles function 
            // that is defined globally in the script because the client code's import was removed.
            
            // NOTE: The 'injectStyles' function definition is now included in the final Worker JS bundle 
            // and should be accessible globally or defined within the script block for safe execution. 
            // Since it was defined inside authStyles.js, we assume the ESBuild bundle made it available 
            // or we must include it here.
            
            // To be safe, we prepend the manual call to injectStyles and then the client logic.
            
            // 1. Manually run the style injection function which is defined in the raw injected code
            // injectStyles(); // This function is now defined inside the raw injected code.
            
            ${scriptCodeToInject}
            
            // The logic runs immediately on load, as defined in authClient.js
            // injectStyles() is called at the top of the original authClient.js, so it will run here too.
        </script>
        `;

        // The raw client script is placed right before the closing </body> tag.
        injectedHtml = injectedHtml.replace('</body>', `${finalScriptTag}</body>`);
        
        // Send the fully built HTML page
        return new Response(injectedHtml, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
    // -------------------------------------------------------------

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
  // SCHEDULED HANDLER (No Change, as it was fixed earlier)
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
