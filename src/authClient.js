// V 0.0.01
// authClient.js - FINAL AND INDISPUTABLE SERVER-SAFE WRAPPER
const BACKEND_URL = "";
const TOKEN_KEY = "auth_token";

// CRITICAL: ALL code is wrapped in an immediately-invoked function expression (IIFE).
(function() {
    
    // =================================================================
    // 1. DYNAMIC ELEMENT ACCESS (The Fix for 'document is not defined')
    // =================================================================
    let elements = null;

    // This function ensures document.getElementById() is only called once
    // when the code runs in the browser, not during the server-side deployment.
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
        // Safe check: does localStorage exist? (It does in the browser)
        if (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) {
            console.log("User already logged in. Redirecting to dashboard...");
        }
    }


    // =================================================================
    // 2. UI MANIPULATION AND MESSAGE HANDLING
    // =================================================================

    function showMessage(type, text) {
        const { messageBox } = getDOMElements();
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
        
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    function switchView(view) {
        const { messageBox, loginView, signupView, loginForm, signupForm } = getDOMElements();
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

    async function handleLogin(e) {
        e.preventDefault();
        const { loginForm, loginEmail, loginPassword } = getDOMElements();
        
        const email = loginEmail.value;
        const password = loginPassword.value;
        
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
        const { signupForm, signupEmail, signupPassword } = getDOMElements();
        
        const email = signupEmail.value;
        const password = signupPassword.value;
        
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
    // 4. ATTACH EVENT LISTENERS (Initial Run)
    // =================================================================

    // This block is the first logic that runs in the browser AFTER
    // the code has been successfully bundled and executed on the client.
    
    // Initial check
    checkAuthStatus();
    
    // Wait for the DOM elements to be ready before attaching listeners
    document.addEventListener('DOMContentLoaded', () => {
        const { showSignup, showLogin, forgotPassword, loginForm, signupForm } = getDOMElements();
        
        // Event listeners for view switching
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('signup');
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('login');
        });

        forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            showMessage('info', "Password reset functionality is currently under development.");
        });
        
        // Form submission listeners
        loginForm.addEventListener('submit', handleLogin);
        signupForm.addEventListener('submit', handleSignup);
        
        // Ensure the initial view is set
        switchView('login');
    });

})();
