// src/auth-client.js - Modular client-side logic V2

// CRITICAL FIX: Wrap the entire script in a template string and export it as default.
const SCRIPT_CONTENT = `
// CRITICAL: We import constants from a separate file now
import { BACKEND_URL, TOKEN_KEY } from './constants.js';

// =================================================================
// 1. DYNAMIC ELEMENT ACCESS
// =================================================================
// Element caching for performance and safety
let elements = null;

function getDOMElements() {
    if (!elements) {
        elements = {
            loginView: document.getElementById('login-view'),
            signupView: document.getElementById('signup-view'),
            loginForm: document.getElementById('login-form'),
            signupForm: document.getElementById('signup-form'),
            messageBox: document.getElementById('message-box'),
            loginEmail: document.getElementById('login-email'),
            loginPassword: document.getElementById('login-password'),
            signupEmail: document.getElementById('signup-email'),
            signupPassword: document.getElementById('signup-password'),
            showSignup: document.getElementById('show-signup'),
            showLogin: document.getElementById('show-login'),
            forgotPassword: document.getElementById('forgot-password'),
        };
    }
    return elements;
}


// Function to immediately check if the user is already logged in
function checkAuthStatus() {
    if (localStorage.getItem(TOKEN_KEY)) {
        console.log("User already logged in. Redirecting to dashboard...");
        // In a real app, this would redirect to the dashboard page.
    }
}


// =================================================================
// 2. UI MANIPULATION AND MESSAGE HANDLING
// =================================================================

function showMessage(type, text) {
    const { messageBox } = getDOMElements();
    if (messageBox) { 
        messageBox.textContent = text;
        // NOTE: Must escape backticks in the inner template string
        messageBox.className = \`message \${type}\`; 
        messageBox.style.display = 'block';
        
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
}

/**
 * Handles the view switching logic.
 * Ensures the target view is visible and the other is hidden.
 */
function switchView(view) {
    const { messageBox, loginView, signupView, loginForm, signupForm } = getDOMElements();
    
    if (loginView && signupView) {
        if (messageBox) messageBox.style.display = 'none'; 

        if (view === 'login') {
            loginView.style.display = 'block';
            signupView.style.display = 'none';
            if (loginForm) loginForm.reset();
        } else { // view === 'signup'
            loginView.style.display = 'none';
            signupView.style.display = 'block'; // CRITICAL: This line makes the signup view appear
            if (signupForm) signupForm.reset();
        }
    } else {
        console.error("CRITICAL: Login or Signup view elements are missing from the DOM.");
    }
}


// =================================================================
// 3. API CALL HANDLERS
// =================================================================

async function handleLogin(e) {
    e.preventDefault();
    // Logic remains the same...
    const { loginForm, loginEmail, loginPassword } = getDOMElements();
    
    const email = loginEmail ? loginEmail.value : '';
    const password = loginPassword ? loginPassword.value : '';
    
    const button = loginForm.querySelector('.auth-button');
    if (button) {
        button.textContent = 'LOGGING IN...';
        button.disabled = true;
    }

    try {
        const response = await fetch(\`\${BACKEND_URL}/api/user/login\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok && data.token) {
            localStorage.setItem(TOKEN_KEY, data.token);
            showMessage('success', 'Login successful! Redirecting...');
            
            setTimeout(() => {
                // Redirect logic
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
    // Logic remains the same...
    const { signupForm, signupEmail, signupPassword } = getDOMElements();
    
    const email = signupEmail ? signupEmail.value : '';
    const password = signupPassword ? signupPassword.value : '';
    
    const button = signupForm.querySelector('.auth-button');
    if (button) {
        button.textContent = 'REGISTERING...';
        button.disabled = true;
    }

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
// 4. ATTACH EVENT LISTENERS
// =================================================================

// Initial setup to run once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const { showSignup, showLogin, forgotPassword, loginForm, signupForm } = getDOMElements();
    
    // Initial check and view setting (login view is default)
    checkAuthStatus();
    switchView('login');
    
    // Event listeners for view switching
    if (showSignup) showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('signup');
    });

    if (showLogin) showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('login');
    });

    if (forgotPassword) forgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        showMessage('info', "Password reset functionality is currently under development.");
    });
    
    // Form submission listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
});
`;

// **FINAL FIX:** Export the entire script content as the default export.
export default SCRIPT_CONTENT;
