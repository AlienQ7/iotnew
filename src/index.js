// index.js - FINAL VERSION (Scheduler, API Routing, and Frontend Serving)

// =================================================================
// IMPORTS
// =================================================================

import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 
// A. IMPORT HTML: The builder turns this file content into a string
import AUTH_HTML from './auth.html'; 

// B. IMPORT STYLES AND CONSTANTS: We will read these contents and inject them
import { STYLE_STRING } from './authStyles'; 
import { COLORS } from './constants'; // Needed if style logic uses COLORS in JS

// C. IMPORT CLIENT JS: This needs to be imported as raw text to inject into the <script> tag.
// NOTE: This assumes authClient.js EXPORTS a string containing its logic, 
// OR the builder converts it to a string. 
// For maximum compatibility, we'll try importing it as raw text.
import AUTH_CLIENT_JS_CONTENT from './authClient.js'; 


// Assuming all schedule functions (including trigger) are in schedule.js
import { handleSetSchedule, handleScheduledTrigger, handleScheduleList, handleScheduleDelete, handleScheduleToggle } from './schedule'; 
import { handleDeviceAdd, handleDeviceList, handleDeviceDelete } from './device'; 


// =================================================================
// JWT Authorization Middleware (No Change)
// =================================================================

async function authorizeRequest(request, env) {
    // ... (Authorization logic remains here) ...
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
// MAIN WORKER HANDLER (Fixed)
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
        
        // 1. Inject Styles into the HTML head
        const styleTag = `<style>${STYLE_STRING}</style>`;
        
        // 2. Inject Client Script into the HTML body
        // NOTE: We wrap the imported content in a function call to prevent conflicts 
        // if the client script is not defined as an immediate function.
        const scriptTag = `<script>${AUTH_CLIENT_JS_CONTENT}</script>`;

        // Find the closing </head> tag and insert the styles
        let injectedHtml = AUTH_HTML.replace('</head>', `${styleTag}</head>`);
        
        // Find the closing </body> tag and insert the script
        injectedHtml = injectedHtml.replace('</body>', `${scriptTag}</body>`);
        
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
  // SCHEDULED HANDLER (The Cron Fix)
  // -------------------------------------------------------------
  async scheduled(event, env, ctx) {
    console.log("Cron worker has been triggered.");
    // CRITICAL FIX: Ensure all three parameters are passed
    ctx.waitUntil(handleScheduledTrigger(event, env, ctx)); 
  }
};

// =================================================================
// API ROUTERS (No Change)
// =================================================================

// Handles unprotected user routes (No Change)
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

// Handles *protected* device and schedule routes (No Change)
async function handleProtectedApi(path, method, request, env) {
    // 1. RUN AUTHORIZATION CHECK FIRST
    const authResult = await authorizeRequest(request, env);
    if (authResult.response) {
        return authResult.response; 
    }
    const userEmail = authResult.user.email; 

    // 2. Route the request
    switch (path) {
        // DEVICE MANAGEMENT ROUTES
        case '/api/device/add':
            if (method === 'POST') return handleDeviceAdd(request, env, userEmail);
            break;
        case '/api/device/list': 
            if (method === 'GET') return handleDeviceList(env, userEmail);
            break;
        case '/api/device/delete': 
            if (method === 'DELETE') return handleDeviceDelete(request, env, userEmail);
            break;
        
        // SCHEDULE MANAGEMENT ROUTES
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
