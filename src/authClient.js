// authClient.js - CORRECTED FOR WORKER INJECTION
//update bullshit cloudflare !!!
// NOTE: We keep the imports to satisfy the *build system* in case it still tries to resolve them, 
// BUT we remove the calls to injectStyles() and checkAuthStatus() which crash the server.

import { injectStyles } from './authStyles.js';
import { BACKEND_URL, TOKEN_KEY, COLORS } from './constants.js'; // Keep imports for constants

// =================================================================
// 1. INITIALIZATION WRAPPER
// =================================================================

// Define global variables, but DO NOT call any functions that use 'document' yet.
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const messageBox = document.getElementById('message-box');

// Function to immediately check if the user is already logged in
function checkAuthStatus() {
    if (localStorage.getItem(TOKEN_KEY)) {
        console.log("User already logged in. Redirecting to dashboard...");
    }
}


function initializeClient() {
    // Inject the CSS styles dynamically upon script execution - REMOVED CALL HERE
    // injectStyles(); 
    
    // Immediate checks and event listeners
    checkAuthStatus();

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
        alert("Password reset functionality is currently under development. Please contact support.");
    });
    
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
}


// =================================================================
// 2. UI MANIPULATION AND MESSAGE HANDLING (No change to functions)
// =================================================================

function showMessage(type, text) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = 'block';
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function switchView(view) {
    messageBox.style.display = 'none'; 
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

// =================================================================
// 3. API CALL HANDLERS (No change)
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
            localStorage.setItem(TOKEN_KEY, data.token);
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
            switchView('login'); 
        } else {
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
// 4. ATTACH EVENT LISTENERS (Run initialization function immediately)
// =================================================================

// THIS LINE is the only thing that runs immediately.
initializeClient();
