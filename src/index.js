// index.js - FINAL BACKEND VERSION (with auth.html Import)

import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 
// *** CRITICAL FIX: IMPORT THE HTML FILE AS RAW TEXT ***
import AUTH_HTML from './auth.html'; 

// Assuming all schedule functions (including trigger) are in schedule.js
import { handleSetSchedule, handleScheduledTrigger, handleScheduleList, handleScheduleDelete, handleScheduleToggle } from './schedule'; 
import { handleDeviceAdd, handleDeviceList, handleDeviceDelete } from './device'; 

// ... (authorizeRequest function remains the same) ...

// =================================================================
// MAIN WORKER HANDLER (Serving auth.html)
// =================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // CRITICAL FIX: Route for the root and explicit auth page
    if (path === '/' || path === '/auth.html') {
        // Serve the imported HTML content (AUTH_HTML is now the content string)
        return new Response(AUTH_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }

    if (path.startsWith('/api/user/')) {
      return handleUserApi(path, method, request, env);
    } else if (path.startsWith('/api/device/') || path.startsWith('/api/schedule/')) {
      return handleProtectedApi(path, method, request, env);
    }
    
    // Fallback 404
    return new Response('API Route Not Found.', { status: 404 });
  },
  
  async scheduled(event, env, ctx) {
    console.log("Cron worker has been triggered.");
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
