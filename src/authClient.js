// V 0.0.07 - FINAL ATTEMPT: DIRECT DOM ACCESS & NO EXTERNAL IMPORTS
// authClient.js - Replaces imports with inline constants for robust injection
const BACKEND_URL = "";
const TOKEN_KEY = "auth_token";

// CRITICAL: ALL code is wrapped in an immediately-invoked function expression (IIFE).
(function() {
    

    // 1. ELEMENT RETRIEVAL UTILITY (Simplified for direct use)
    // =================================================================

    // This runs only on the client side, retrieving a single, known element.
    function getElement(id) {
        if (typeof document !== 'undefined') {
            return document.getElementById(id);
        }
        return null;
    }


    function checkAuthStatus() {
        if (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) {
            console.log("User already logged in. Redirecting to dashboard...");
        }
    }


    // =================================================================
    // 2. UI MANIPULATION AND MESSAGE HANDLING
    // =================================================================

    function showMessage(type, text) {
        const messageBox = getElement('message-box');
        if (messageBox) { 
            messageBox.textContent = text;
            messageBox.className = `message ${type}`;
            messageBox.style.display = 'block';
            
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }
    }

    // =================================================================
    // 3. API CALL HANDLERS (Simplified Element Access)
    // =================================================================

    async function handleLogin(e) {
        e.preventDefault();
        const loginForm = getElement('login-form');
        const loginEmail = getElement('login-email');
        const loginPassword = getElement('login-password');
        
        const email = loginEmail ? loginEmail.value : '';
        const password = loginPassword ? loginPassword.value : '';
        
        const button = loginForm ? loginForm.querySelector('.auth-button') : null;
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
        const signupForm = getElement('signup-form');
        const signupEmail = getElement('signup-email');
        const signupPassword = getElement('signup-password');
        
        const email = signupEmail ? signupEmail.value : '';
        const password = signupPassword ? signupPassword.value : '';
        
        const button = signupForm ? signupForm.querySelector('.auth-button') : null;
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
                
                // CRITICAL: Switch to Login View after successful registration
                const loginView = getElement('login-view');
                const signupView = getElement('signup-view');
                if (loginView && signupView) {
                    loginView.style.display = 'block';
                    signupView.style.display = 'none';
                }
                if (signupForm) signupForm.reset();

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
    // 4. IMMEDIATE EXECUTION AND ATTACHMENT
    // =================================================================
    
    // Initial check (Can run immediately)
    checkAuthStatus();
    
    // Immediate Attachment and Initialization (Direct Element Manipulation)
    if (typeof document !== 'undefined') {
        const showSignup = getElement('show-signup');
        const showLogin = getElement('show-login');
        const forgotPassword = getElement('forgot-password');
        const loginForm = getElement('login-form');
        const signupForm = getElement('signup-form');
        
        const loginView = getElement('login-view');
        const signupView = getElement('signup-view');
        
        // --- 1. View Switching Listeners (DIRECT MANIPULATION) ---
        if (showSignup && loginView && signupView) showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Switching to Signup View...");
            loginView.style.display = 'none';
            signupView.style.display = 'block';
            const messageBox = getElement('message-box');
            if (messageBox) messageBox.style.display = 'none'; 
        });

        if (showLogin && loginView && signupView) showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Switching to Login View...");
            loginView.style.display = 'block';
            signupView.style.display = 'none';
            const messageBox = getElement('message-box');
            if (messageBox) messageBox.style.display = 'none'; 
        });

        // --- 2. Initial View Enforcer ---
        // This is necessary because the CSS 'display: none !important' is set on signup.
        // We ensure login is block and signup is none, just in case the CSS failed.
        if (loginView && signupView) {
            loginView.style.display = 'block';
            signupView.style.display = 'none';
        }

        // --- 3. Form Submission Listeners ---
        if (forgotPassword) forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            showMessage('info', "Password reset functionality is currently under development.");
        });
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (signupForm) signupForm.addEventListener('submit', handleSignup);
    }

})();
