// V 0.0.08 - FINAL FIX: AGGRESSIVE QUERY AND ELEMENT CACHING
// authClient.js - No external imports, uses immediate execution.
const BACKEND_URL = "";
const TOKEN_KEY = "auth_token";

(function() {
    
    // =================================================================
    // 1. AGGRESSIVE ELEMENT RETRIEVAL
    // =================================================================
    
    // Cache all necessary elements once upon script execution.
    // If any element is null, the entire script will fall back to a safe mode.
    let elements = null;

    function getElements() {
        if (elements) return elements;

        // --- List of all required IDs ---
        const ids = [
            'login-view', 'signup-view', 'login-form', 'signup-form', 'message-box',
            'login-email', 'login-password', 'signup-email', 'signup-password',
            'show-signup', 'show-login', 'forgot-password'
        ];
        
        const foundElements = {};
        if (typeof document !== 'undefined') {
            ids.forEach(id => {
                // IMPORTANT: Normalizing the key name by removing hyphens for cleaner JS property access
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
            messagebox.className = `message ${type}`;
            messagebox.style.display = 'block';
            
            setTimeout(() => {
                messagebox.style.display = 'none';
            }, 5000);
        }
    }

    function switchView(view) {
        const { loginview, signupview, messageBox, loginform, signupform } = getElements();
        
        if (!loginview || !signupview) {
            console.error("Critical: View containers not found. Switching failed.");
            return;
        }

        if (messageBox) messageBox.style.display = 'none'; 
        
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

    // --- API Handlers (Placeholder for a clean execution test) ---
    async function handleLogin(e) {
        e.preventDefault();
        const { loginform, loginemail, loginpassword } = getElements();
        
        const email = loginemail ? loginemail.value : '';
        const password = loginpassword ? loginpassword.value : '';
        
        const button = loginform ? loginform.querySelector('.auth-button') : null;
        if (button) { button.textContent = 'LOGGING IN...'; button.disabled = true; }

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
        const { signupform, signupemail, signuppassword } = getElements();
        
        const email = signupemail ? signupemail.value : '';
        const password = signuppassword ? signuppassword.value : '';
        
        const button = signupform ? signupform.querySelector('.auth-button') : null;
        if (button) { button.textContent = 'REGISTERING...'; button.disabled = true; }

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
    // 3. INITIALIZATION
    // =================================================================
    
    if (typeof document !== 'undefined') {
        
        // Use a slight delay to ensure the DOM is fully painted and the injected
        // script block is fully parsed by the browser.
        setTimeout(() => {
            getElements(); // Ensure elements are cached

            const { showsignup, showlogin, forgotpassword, loginform, signupform } = elements;
            
            // --- Attach Listeners ---
            if (showsignup) showsignup.addEventListener('click', (e) => {
                e.preventDefault();
                switchView('signup');
            });

            if (showlogin) showlogin.addEventListener('click', (e) => {
                e.preventDefault();
                switchView('login');
            });

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
