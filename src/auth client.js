// authClient.js (The new name for the frontend logic file)

import { injectStyles } from './authStyles.js';
import { BACKEND_URL, TOKEN_KEY, COLORS } from './constants.js'; // <-- USING THE SIMPLE 'constants.js' NAME

// =================================================================
// 1. STYLES INJECTION & INITIAL SETUP
// =================================================================

// Inject the CSS styles dynamically upon script execution
injectStyles();

const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const messageBox = document.getElementById('message-box');

// Immediately check if the user is already logged in
function checkAuthStatus() {
    if (localStorage.getItem(TOKEN_KEY)) {
        console.log("User already logged in. Redirecting to dashboard...");
    }
}
checkAuthStatus();

// =================================================================
// 2. UI MANIPULATION AND MESSAGE HANDLING
// =================================================================

function showMessage(type, text) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = 'block';
    
    // Auto-hide the message after 5 seconds
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function switchView(view) {
    messageBox.style.display = 'none'; // Clear messages on view switch
    if (view === 'login') {
        loginView.style.display = 'block';
        signupView.style.display = 'none';
        loginForm.reset();
    } else {
        loginView.style.display = 'none';
        signupView.style.display = 'block';
        signupForm.reset();
    }
}

// Event listeners for view switching
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('signup');
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('login');
});

document.getElementById('forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    // Placeholder logic for the password retrieve system
    alert("Password reset functionality is currently under development. Please contact support.");
});

// =================================================================
// 3. API CALL HANDLERS
// =================================================================

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const button = loginForm.querySelector('.auth-button');
    button.textContent = 'LOGGING IN...';
    button.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            // SUCCESS! Store the JWT token and redirect.
            localStorage.setItem(TOKEN_KEY, data.token);
            showMessage('success', 'Login successful! Redirecting...');
            
            // Wait briefly before redirecting (simulated for simplicity)
            setTimeout(() => {
                // window.location.href = '/dashboard.html'; 
                console.log("LOGIN SUCCESS: Token stored. Dashboard redirect simulation.");
            }, 1000);
            
        } else {
            // FAILURE! 401 Unauthorized or other error
            showMessage('error', data.message || 'Invalid credentials or login failed.');
        }

    } catch (error) {
        console.error('Network or server error:', error);
        showMessage('error', 'Connection error. Please try again.');
    } finally {
        button.textContent = 'LOGIN';
        button.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    const button = signupForm.querySelector('.auth-button');
    button.textContent = 'REGISTERING...';
    button.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/user/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            showMessage('success', 'Account created! Please log in below.');
            switchView('login'); // Automatically switch to login view
        } else {
            // FAILURE! 409 Conflict (User exists) or 400 (Bad password policy)
            showMessage('error', data.message || 'Registration failed. Check your password policy.');
        }

    } catch (error) {
        console.error('Network or server error:', error);
        showMessage('error', 'Connection error. Please try again.');
    } finally {
        button.textContent = 'SIGN UP';
        button.disabled = false;
    }
}

// =================================================================
// 4. ATTACH EVENT LISTENERS
// =================================================================

loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);
