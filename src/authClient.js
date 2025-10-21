// V 0.0.02
// authClient.js - FINAL AND INDISPUTABLE SERVER-SAFE WRAPPER
const BACKEND_URL = "";
const TOKEN_KEY = "auth_token";

// CRITICAL: ALL code is wrapped in an immediately-invoked function expression (IIFE).
(function() {
    
    // =================================================================
    // 1. DYNAMIC ELEMENT ACCESS (The Definitive Server Gate Fix)
    // =================================================================
    let elements = null;

    // This function now includes a protective check: if running on the server, it quits immediately.
    function getDOMElements() {
        
        // --- THE CRITICAL SERVER GATE ---
        if (typeof document === 'undefined') {
            return {}; 
        }
        // --------------------------------------
        
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
        if (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) {
            console.log("User already logged in. Redirecting to dashboard...");
        }
    }


    // =================================================================
    // 2. UI MANIPULATION AND MESSAGE HANDLING
    // =================================================================

    function showMessage(type, text) {
        const { messageBox } = getDOMElements();
        if (messageBox) { 
            messageBox.textContent = text;
            messageBox.className = `message ${type}`;
            messageBox.style.display = 'block';
            
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }
    }

    function switchView(view) {
        const { messageBox, loginView, signupView, loginForm, signupForm } = getDOMElements();
        // Check if essential views exist before attempting manipulation
        if (loginView && signupView) {
            if (messageBox) messageBox.style.display = 'none'; 
            if (view === 'login') {
                loginView.style.display = 'block';
                signupView.style.display = 'none';
                if (loginForm) loginForm.reset();
            } else {
                loginView.style.display = 'none';
                signupView.style.display = 'block';
                if (signupForm) signupForm.reset();
            }
        }
    }


    // =================================================================
    // 3. API CALL HANDLERS (No Change)
    // =================================================================

    async function handleLogin(e) {
        e.preventDefault();
        const { loginForm, loginEmail, loginPassword } = getDOMElements();
        
        const email = loginEmail ? loginEmail.value : '';
        const password = loginPassword ? loginPassword.value : '';
        
        const button = loginForm.querySelector('.auth-button');
        if (button) {
            button.textContent = 'LOGGING IN...';
            button.disabled = true;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/user/login`, {
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
        const { signupForm, signupEmail, signupPassword } = getDOMElements();
        
        const email = signupEmail ? signupEmail.value : '';
        const password = signupPassword ? signupPassword.value : '';
        
        const button = signupForm.querySelector('.auth-button');
        if (button) {
            button.textContent = 'REGISTERING...';
            button.disabled = true;
        }

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
            if (button) {
                button.textContent = 'SIGN UP';
                button.disabled = false;
            }
        }
    }

    // =================================================================
    // 4. ATTACH EVENT LISTENERS (Initial Run)
    // =================================================================
    
    // Initial check
    checkAuthStatus();
    
    // --- FIX: Initial view setting moved here to ensure it runs immediately in the browser. ---
    // We must ensure the view is initialized as 'login' even before DOMContentLoaded.
    if (typeof document !== 'undefined') {
        switchView('login');
    }
    // ------------------------------------------------------------------------------------------

    // Wait for the DOM elements to be ready before attaching listeners
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            const { showSignup, showLogin, forgotPassword, loginForm, signupForm } = getDOMElements();
            
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
    }

})();
