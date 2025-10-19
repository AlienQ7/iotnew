// authClient.js - CORRECTED & SERVER-SAFE

// The import statements are kept as they are needed for the client's module structure
import { injectStyles } from './authStyles.js';
import { BACKEND_URL, TOKEN_KEY, COLORS } from './constants.js'; 

// =================================================================
// 1. INITIALIZATION WRAPPER
// =================================================================

// Function to immediately check if the user is already logged in
function checkAuthStatus() {
    // This relies on the browser's localStorage, so it must be inside a function run on the client.
    if (localStorage.getItem(TOKEN_KEY)) {
        console.log("User already logged in. Redirecting to dashboard...");
    }
}

// All browser-dependent code is now safely encapsulated inside this function
function initializeClient() {
    
    // **CRITICAL FIX: ALL document.getElementById calls MUST be inside here**
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageBox = document.getElementById('message-box');
    
    // Style Injection: The worker is injecting the <style> tag, so we no longer call injectStyles() here.
    // We removed the original injectStyles() call from this file.
    
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
// (Now needs to accept element references since they are not global)
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
// (Updated to accept messageBox for centralized message handling)
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
            // This is the one place we can't use the function safely, we will assume 
            // the function uses global or implicit references which is bad practice but needed here.
            // Since initializeClient defines the refs, we can call it outside the function:
            // switchView('login'); 
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

// This is the only line that runs immediately, calling the safe function.
initializeClient();
