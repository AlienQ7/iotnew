// authClient.js - FINAL FIX: ALL IMPORTS REMOVED
// update it cloudlfarrr    !!!!!!!
// =================================================================
// 0. DEFINITIONS (Replacing Imports)
// =================================================================

// Since we cannot import, we must rely on string literals for the constants.
const BACKEND_URL = "";    // Assumes relative path (e.g., /api/user/login)
const TOKEN_KEY = "auth_token"; // Must match the literal string used in session.js

// The injectStyles function is no longer called/needed since the Worker injects the <style> tag.

// =================================================================
// 1. INITIALIZATION WRAPPER
// =================================================================

function checkAuthStatus() {
    if (localStorage.getItem(TOKEN_KEY)) {
        console.log("User already logged in. Redirecting to dashboard...");
    }
}

// All browser-dependent code is safely encapsulated inside this function
function initializeClient() {
    
    // CRITICAL: All document.getElementById calls MUST be inside here
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageBox = document.getElementById('message-box');
    
    checkAuthStatus();

    // Event listeners for view switching
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('signup', loginView, signupView, loginForm, signupForm, messageBox);
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('login', loginView, signupView, loginForm, signupForm, messageBox);
    });

    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Password reset functionality is currently under development. Please contact support.");
    });
    
    loginForm.addEventListener('submit', (e) => handleLogin(e, loginForm, messageBox));
    signupForm.addEventListener('submit', (e) => handleSignup(e, signupForm, messageBox));
}


// =================================================================
// 2. UI MANIPULATION AND MESSAGE HANDLING 
// =================================================================

function showMessage(type, text, messageBox) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = 'block';
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function switchView(view, loginView, signupView, loginForm, signupForm, messageBox) {
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
// 3. API CALL HANDLERS 
// =================================================================

async function handleLogin(e, loginForm, messageBox) {
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
            showMessage('success', 'Login successful! Redirecting...', messageBox);
            
            setTimeout(() => {
                console.log("LOGIN SUCCESS: Token stored. Dashboard redirect simulation.");
            }, 1000);
            
        } else {
            showMessage('error', data.message || 'Invalid credentials or login failed.', messageBox);
        }

    } catch (error) {
        console.error('Network or server error:', error);
        showMessage('error', 'Connection error. Please try again.', messageBox);
    } finally {
        button.textContent = 'LOGIN';
        button.disabled = false;
    }
}

async function handleSignup(e, signupForm, messageBox) {
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
            showMessage('success', 'Account created! Please log in below.', messageBox);
        } else {
            showMessage('error', data.message || 'Registration failed. Check your password policy.', messageBox);
        }

    } catch (error) {
        console.error('Network or server error:', error);
        showMessage('error', 'Connection error. Please try again.', messageBox);
    } finally {
        button.textContent = 'SIGN UP';
        button.disabled = false;
    }
}

// =================================================================
// 4. ATTACH EVENT LISTENERS (Call only the safe initializer)
// =================================================================

initializeClient();
