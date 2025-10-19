import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; // Imports the verification logic
import { handleSetSchedule } from './schedule'; // Imports the new schedule handler and limits

// =================================================================
// JWT Authorization Middleware
// =================================================================

/**
 * Extracts and verifies the JWT from the request, returning the user context or an error response.
 * @param {Request} request The incoming Worker request.
 * @param {Env} env The Worker environment variables (for JWT_SECRET).
 * @returns {Promise<{user: {email: string}, response: Response}|null>} The user object on success, or an object containing an unauthorized Response.
 */
async function authorizeRequest(request, env) {
    // 1. Get token from Authorization header (Preferred method)
    let token = request.headers.get('Authorization');
    if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
    } else {
        // Fallback: Get token from cookie (as set in handleLogin)
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

    // 2. Verify and decode JWT
    const decodedPayload = await verifyJWT(token, env.JWT_SECRET);
    
    // Check for expiration or invalid token
    if (!decodedPayload || !decodedPayload.email) {
        return { response: new Response('Invalid or Expired Token. Please log in again.', { status: 401 }) };
    }

    // 3. Success! Return the user context.
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

    if (path.startsWith('/api/user/')) {
      return handleUserApi(path, method, request, env);
    } else if (path.startsWith('/api/device/') || path.startsWith('/api/schedule/')) {
      // New protected API routes
      return handleProtectedApi(path, method, request, env);
    }
    
    // Default response for the root
    return new Response('Welcome to IoT Hub API. Try POSTing to /api/user/signup', { status: 200 });
  },
};

// =================================================================
// API ROUTERS
// =================================================================

// Handles unprotected user routes (signup, login)
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
  
  // Method Not Allowed
  return new Response('Method Not Allowed', { status: 405 });
}

// Handles *protected* device and schedule routes
async function handleProtectedApi(path, method, request, env) {
    // 1. RUN AUTHORIZATION CHECK FIRST
    const authResult = await authorizeRequest(request, env);
    if (authResult.response) {
        return authResult.response; // Unauthorized response returned
    }
    const userEmail = authResult.user.email; // Extracted user email

    // 2. Route the request
    switch (path) {
        case '/api/device/add':
            if (method === 'POST') {
                // Placeholder for device registration logic (Next step after schedules)
                return new Response('Device Add endpoint (WIP)', { status: 200 }); 
            }
            break;
        
        case '/api/schedule/set':
            if (method === 'POST') {
                // Calls the handler that enforces the MAX_SCHEDULES limit
                return handleSetSchedule(request, env, userEmail);
            }
            break;

        default:
            return new Response('Protected API Not Found', { status: 404 });
    }

    // Method Not Allowed
    return new Response('Method Not Allowed', { status: 405 });
}
