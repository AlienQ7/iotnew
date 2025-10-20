// src/index.js - ASSET BINDING VERSION (Stable Fix)

// =================================================================
// IMPORTS (Only keep API/Worker imports)
// =================================================================

import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 
// DELETED: import AUTH_HTML from './auth.html'; 
// DELETED: import { STYLE_STRING } from './authStyles'; 
// DELETED: import AUTH_CLIENT_JS_CONTENT from './authClient.js?raw'; 

// Existing API/Schedule imports remain:
import { handleSetSchedule, handleScheduledTrigger, handleScheduleList, handleScheduleDelete, handleScheduleToggle } from './schedule'; 
import { handleDeviceAdd, handleDeviceList, handleDeviceDelete } from './device'; 

// =================================================================
// NEW: ASSET READING UTILITY (Updated with Fallback)
// =================================================================

async function getAssetContent(env, filename) {
    // 1. Check for the standard binding (ASSETS) or the legacy binding (__STATIC_CONTENT)
    const ASSET_BINDING = env.ASSETS || env.__STATIC_CONTENT;

    if (!ASSET_BINDING) {
        // This is the error message you are seeing in the browser
        throw new Error("Asset binding (env.ASSETS or env.__STATIC_CONTENT) is missing.");
    }

    // 2. Use the determined binding to fetch the asset
    // Note: The legacy binding uses .get(), the modern uses .fetch(), but .fetch() is safer here.
    const asset = await ASSET_BINDING.fetch(`/${filename}`); 
    
    if (!asset.ok) {
        throw new Error(`Asset not found: ${filename} (Status: ${asset.status})`);
    }
    return asset.text();
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
            // 1. Read all file contents from the Asset Store
            const AUTH_HTML = await getAssetContent(env, 'auth.html');
            const AUTH_STYLES_JS_CONTENT = await getAssetContent(env, 'authStyles.js');
            const AUTH_CLIENT_JS_CONTENT = await getAssetContent(env, 'authClient.js');

            // 2. Extract STYLE_STRING from authStyles.js content
            // We use a regex to safely extract the string content.
            const styleMatch = AUTH_STYLES_JS_CONTENT.match(/export const STYLE_STRING = `([^`]+)`/);
            const STYLE_STRING = styleMatch ? styleMatch[1] : '';

            // 3. Inject Styles into the HTML head
            const styleTag = `<style>${STYLE_STRING}</style>`;
            let injectedHtml = AUTH_HTML.replace('</head>', `${styleTag}</head>`);
            
            // 4. Remove the old script link and inject the raw script content
            // This replacement is CRITICAL to avoid the browser trying to fetch the file twice.
            injectedHtml = injectedHtml.replace('<script type="module" src="./authClient.js"></script>', '');
            
            const finalScriptTag = `<script type="text/javascript">${AUTH_CLIENT_JS_CONTENT}</script>`;
            injectedHtml = injectedHtml.replace('</body>', `${finalScriptTag}</body>`);

            return new Response(injectedHtml, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
            
        } catch (error) {
            console.error("Asset serving error:", error);
            // If assets fail, return a plain error.
            return new Response(`Error serving UI (Assets missing or internal error): ${error.message}`, { status: 500 });
        }
    }

    // API ROUTING
    if (path.startsWith('/api/user/')) {
      return handleUserApi(path, method, request, env);
    } else if (path.startsWith('/api/device/') || path.startsWith('/api/schedule/')) {
      return handleProtectedApi(path, method, request, env);
    }
    
    // Fallback 404
    return new Response('API Route Not Found.', { status: 404 });
  },
  
  // SCHEDULED HANDLER (No Change)
  async scheduled(event, env, ctx) {
    console.log("Cron worker has been triggered.");
    ctx.waitUntil(handleScheduledTrigger(event, env, ctx)); 
  }
};

// =================================================================
// API ROUTERS (No Change)
// ... (The handleUserApi and handleProtectedApi functions go here)
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
