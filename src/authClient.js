// V 0.0.06 - FINAL FIX: REMOVE DOMContentLoaded LISTENER
// authClient.js - FINAL AND INDISPUTABLE SERVER-SAFE WRAPPER
const BACKEND_URL = "";
const TOKEN_KEY = "auth_token";

// CRITICAL: ALL code is wrapped in an immediately-invoked function expression (IIFE).
(function() {
    
    // =================================================================
    // 1. DYNAMIC ELEMENT ACCESS (No Caching)
    // =================================================================

    // Retrieves elements freshly on every call.
    function getDOMElements() {
        
        // --- THE CRITICAL SERVER GATE ---
        if (typeof document === 'undefined') {
            return {}; 
        }
        // --------------------------------------
        
        return {
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
        
        // CRITICAL CHECK: Log if elements are missing
        if (!loginView || !signupView) {
             console.error(`View switching failed: Login View (${!!loginView}) or Signup View (${!!signupView}) container not found. Check IDs in auth.html.`);
             return;
        }

        if (messageBox) messageBox.style.display = 'none'; 
        
        if (view === 'login') {
            // Ensure login view is visible, signup is hidden
            loginView.style.display = 'block';
            signupView.style.display = 'none';
            if (loginForm) loginForm.reset();
        } else {
            // Ensure signup view is visible, login is hidden
            loginView.style.display = 'none';
            signupView.style.display = 'block';
            if (signupForm) signupForm.reset();
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
        const { signupForm, signupEmail, signupPassword } = getDOMElements();
        
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
    // 4. IMMEDIATE EXECUTION AND ATTACHMENT
    // =================================================================
    
    // Initial check (Can run immediately)
    checkAuthStatus();
    
    // Immediate Attachment and Initialization (No DOMContentLoaded)
    if (typeof document !== 'undefined') {
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
        
        // --- CRITICAL FIX: Enforce the initial view immediately ---
        switchView('login');
    }

})();
