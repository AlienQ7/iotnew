// src/index.js - V 0.0.05 (Static Asset Router for Modular Frontend)

// =================================================================
// Backend Imports
// =================================================================
import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 
import { handleSetSchedule, handleScheduledTrigger, handleScheduleList, handleScheduleDelete, handleScheduleToggle } from './schedule'; 
import { handleDeviceAdd, handleDeviceList, handleDeviceDelete } from './device'; 

// =================================================================
// Frontend Asset Imports (Used for Static Serving)
// =================================================================
// These imports read the entire file content as a string at build time.
import AUTH_HTML from './auth.html'; 
import { STYLE_STRING } from './authStyles'; 
import AUTH_CLIENT_JS_CONTENT from './auth-client.js'; // NOTE: Renamed file
import CONSTANTS_JS_CONTENT from './constants.js'; 


// =================================================================
// JWT Authorization Middleware (Unchanged)
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
    // STATIC ASSET ROUTING (The New Strategy)
    // -------------------------------------------------------------
    // Serve HTML entry point
    if (path === '/' || path === '/auth.html') {
        return new Response(AUTH_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }

    // Serve JS and CSS files directly to the browser
    const assetMap = {
        '/auth-client.js': AUTH_CLIENT_JS_CONTENT,
        '/authStyles.js': `export const STYLE_STRING = \`${STYLE_STRING}\`;`, // Export STYLE_STRING content
        '/constants.js': CONSTANTS_JS_CONTENT,
    };
    
    if (path in assetMap) {
        // Handle potential object export from build system (V 0.0.03 error fix)
        let content = assetMap[path];
        if (typeof content === 'object' && content !== null && typeof content.default === 'string') {
            content = content.default;
        }

        return new Response(content, {
            status: 200,
            headers: { 'Content-Type': 'application/javascript' }
        });
    }

    // -------------------------------------------------------------
    // API ROUTING (Unchanged)
    // -------------------------------------------------------------
    if (path.startsWith('/api/user/')) {
      return handleUserApi(path, method, request, env);
    } else if (path.startsWith('/api/device/') || path.startsWith('/api/schedule/')) {
      return handleProtectedApi(path, method, request, env);
    }
    
    // Fallback 404 for non-API, non-root paths
    return new Response('API Route Not Found.', { status: 404 });
  },
  
  // -------------------------------------------------------------
  // SCHEDULED HANDLER (Unchanged)
  // -------------------------------------------------------------
  async scheduled(event, env, ctx) {
    console.log("Cron worker has been triggered.");
    ctx.waitUntil(handleScheduledTrigger(event, env, ctx)); 
  }
};

// =================================================================
// API ROUTERS (Unchanged)
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
