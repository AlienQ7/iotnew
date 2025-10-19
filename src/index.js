// index.js - FINAL BACKEND VERSION (Scheduler Fix Applied)

import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 
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
// MAIN WORKER HANDLER (Fix applied here)
// =================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path.startsWith('/api/user/')) {
      return handleUserApi(path, method, request, env);
    } else if (path.startsWith('/api/device/') || path.startsWith('/api/schedule/')) {
      return handleProtectedApi(path, method, request, env);
    }
    
    return new Response('Welcome to IoT Hub API. Try POSTing to /api/user/signup', { status: 200 });
  },
  
  async scheduled(event, env, ctx) {
    console.log("Cron worker has been triggered.");
    // CRITICAL FIX: Pass ALL three parameters to the handler function
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
