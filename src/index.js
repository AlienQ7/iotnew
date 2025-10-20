// src/index.js - FINAL GUARANTEE: Hardcoded Client Script

// NOTE: This file assumes auth.html, authStyles.js, auth.js, and session.js are present.

// =================================================================
// IMPORTS
// =================================================================

import { handleSignUp, handleLogin } from './auth';
import { verifyJWT } from './session'; 

// A. CRITICAL: Direct imports for the frontend content
import AUTH_HTML from './auth.html'; 
import { STYLE_STRING } from './authStyles'; 
// NOTE: We no longer import authClient.js. Its content is hardcoded below.


// =================================================================
// HARDCODED CLIENT SCRIPT CONTENT (V 0.0.08 Logic)
// =================================================================

const AUTH_CLIENT_JS_CONTENT = `
// V 0.0.08 Logic - Hardcoded for Injection Safety
const BACKEND_URL = "";
const TOKEN_KEY = "auth_token";

(function() {
    
    // =================================================================
    // 1. AGGRESSIVE ELEMENT RETRIEVAL
    // =================================================================
    
    let elements = null;

    function getElements() {
        if (elements) return elements;

        const ids = [
            'login-view', 'signup-view', 'login-form', 'signup-form', 'message-box',
            'login-email', 'login-password', 'signup-email', 'signup-password',
            'show-signup', 'show-login', 'forgot-password'
        ];
        
        const foundElements = {};
        if (typeof document !== 'undefined') {
            ids.forEach(id => {
                foundElements[id.replace(/-/g, '')] = document.getElementById(id);
            });
        }
        
        elements = foundElements;
        return elements;
    }


    // =================================================================
    // 2. UI AND API LOGIC (Uses Cached Elements)
    // =================================================================

    function showMessage(type, text) {
        const { messagebox } = getElements();
        if (messagebox) { 
            messagebox.textContent = text;
            // Use standard classes for styling
            messagebox.className = 'message ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'); 
            messagebox.style.display = 'block';
            
            setTimeout(() => {
                messagebox.style.display = 'none';
            }, 5000);
        }
    }

    function switchView(view) {
        const { loginview, signupview, messagebox, loginform, signupform } = getElements();
        
        if (!loginview || !signupview) {
            console.error("Critical: View containers not found. Switching failed.");
            // If views are missing, we cannot proceed with view switching logic.
            return;
        }

        if (messagebox) messagebox.style.display = 'none'; 
        
        if (view === 'login') {
            loginview.style.display = 'block';
            signupview.style.display = 'none';
            if (loginform) loginform.reset();
        } else {
            loginview.style.display = 'none';
            signupview.style.display = 'block';
            if (signupform) signupform.reset();
        }
    }

    // --- API Handlers ---
    async function handleLogin(e) {
        e.preventDefault();
        const { loginform, loginemail, loginpassword } = getElements();
        
        const email = loginemail ? loginemail.value : '';
        const password = loginpassword ? loginpassword.value : '';
        
        const button = loginform ? loginform.querySelector('.auth-button') : null;
        if (button) { button.textContent = 'LOGGING IN...'; button.disabled = true; }

        try {
            const response = await fetch(\`\${BACKEND_URL}/api/user/login\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, data.token);
                showMessage('success', 'Login successful! Redirecting...');
                
                setTimeout(() => {
                    console.log("LOGIN SUCCESS: Token stored. Dashboard redirect simulation.");
                }, 1000);
                
            } else {
                showMessage('error', data.message || 'Invalid credentials or login failed.');
            }

        } catch (error) {
            console.error('Network or server error:', error);
            showMessage('error', 'Connection error. Please try again.');
        } finally {
            if (button) {
                button.textContent = 'LOGIN';
                button.disabled = false;
            }
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        const { signupform, signupemail, signuppassword } = getElements();
        
        const email = signupemail ? signupemail.value : '';
        const password = signuppassword ? signuppassword.value : '';
        
        const button = signupform ? signupform.querySelector('.auth-button') : null;
        if (button) { button.textContent = 'REGISTERING...'; button.disabled = true; }

        try {
            const response = await fetch(\`\${BACKEND_URL}/api/user/signup\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                showMessage('success', 'Account created! Please log in below.');
                switchView('login'); 
            } else {
                showMessage('error', data.message || 'Registration failed. Check your password policy.');
            }

        } catch (error) {
            console.error('Network or server error:', error);
            showMessage('error', 'Connection error. Please try again.');
        } finally {
            if (button) {
                button.textContent = 'SIGN UP';
                button.disabled = false;
            }
        }
    }


    // =================================================================
    // 3. INITIALIZATION
    // =================================================================
    
    if (typeof document !== 'undefined') {
        
        // Use a zero delay to ensure the DOM is fully parsed 
        setTimeout(() => {
            console.log("UI Initialization: Starting element lookup and listeners.");
            getElements(); // Ensure elements are cached

            const { showsignup, showlogin, forgotpassword, loginform, signupform } = elements;
            
            // --- Attach Listeners ---
            if (showsignup) {
                showsignup.addEventListener('click', (e) => {
                    e.preventDefault();
                    switchView('signup');
                    console.log("Clicked Switch to Signup.");
                });
            } else {
                console.error("showsignup element not found.");
            }

            if (showlogin) {
                showlogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    switchView('login');
                    console.log("Clicked Switch to Login.");
                });
            } else {
                console.error("showlogin element not found.");
            }

            if (forgotpassword) forgotpassword.addEventListener('click', (e) => {
                e.preventDefault();
                showMessage('info', "Password reset functionality is currently under development.");
            });
            
            if (loginform) loginform.addEventListener('submit', handleLogin);
            if (signupform) signupform.addEventListener('submit', handleSignup);
            
            // --- Enforce Initial View ---
            switchView('login');

        }, 0); 
    }

})();
`;

// =================================================================
// SIMPLE SCRIPT INJECTOR (No Sanitation Needed)
// =================================================================

function createScriptTag(jsContent) {
    // Just inject the content directly, relying on the IIFE to execute safely.
    return `<script type="text/javascript">${jsContent}</script>`;
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
            
            // 4. Inject the failsafe, hardcoded script content
            const finalScriptTag = createScriptTag(AUTH_CLIENT_JS_CONTENT);
            injectedHtml = injectedHtml.replace('</body>', `${finalScriptTag}</body>`);

            return new Response(injectedHtml, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
            
        } catch (error) {
            // This should only catch errors related to AUTH_HTML, not the script content.
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
