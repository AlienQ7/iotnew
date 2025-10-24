// src/auth-client.js - Modular client-side logic V4 (Improved Error Handling)

const SCRIPT_CONTENT = `
// CRITICAL FIX: The constants BACKEND_URL and TOKEN_KEY are injected 
// globally by index.js and are accessible here.

// =================================================================
// 1. DYNAMIC ELEMENT ACCESS
// =================================================================
let elements = null;

function getDOMElements() {
    // Only perform the expensive DOM lookup once
    if (!elements) {
        // --- NOTE: If the form is not showing, one of these IDs is likely incorrect in the HTML.
        // --- The code below ensures we have a valid element before trying to access it.
        elements = {
            loginForm: document.getElementById('login-form'),
            signupForm: document.getElementById('signup-form'),
            loginEmail: document.getElementById('login-email'),
            loginPassword: document.getElementById('login-password'),
            signupEmail: document.getElementById('signup-email'),
            signupPassword: document.getElementById('signup-password'),
            messageBox: document.getElementById('message-box'),
            loginView: document.getElementById('login-view'),
            signupView: document.getElementById('signup-view'),
            showSignup: document.getElementById('show-signup'),
            showLogin: document.getElementById('show-login'),
            forgotPassword: document.getElementById('forgot-password'),
        };
    }
    return elements;
}

// =================================================================
// 2. UTILITY & VIEW FUNCTIONS
// =================================================================

function showMessage(type, message) {
    const { messageBox } = getDOMElements();
    if (!messageBox) {
        console.warn('Message box element not found.');
        return;
    }

    messageBox.textContent = message;
    messageBox.className = \`message \${type}\`;
    messageBox.style.display = 'block';
}

/**
 * Toggles visibility between the login and signup forms.
 * @param {'login'|'signup'} view 
 */
function switchView(view) {
    const { loginView, signupView, loginForm, signupForm, messageBox } = getDOMElements();
    
    // 🔥 CRITICAL IMPROVEMENT: Fail-safe check
    if (!loginView || !signupView) {
        console.error('CRITICAL ERROR: Login or Signup view containers not found. Cannot switch views.');
        return;
    }

    // Reset and hide message box
    if (messageBox) messageBox.style.display = 'none';

    if (view === 'login') {
        // --- FIX IS HERE: We confirm loginView is valid before setting style
        loginView.style.display = 'block';
        signupView.style.display = 'none';
        if (loginForm) loginForm.reset();
        showMessage('info', 'Please login with your credentials.');
    } else { // view === 'signup'
        // --- FIX IS HERE: We confirm signupView is valid before setting style
        loginView.style.display = 'none';
        signupView.style.display = 'block'; // FIX: Make the signup form visible
        if (signupForm) signupForm.reset();
        showMessage('info', 'Register to create your new account.');
    }
}

// =================================================================
// 3. API FETCH HANDLERS 
// =================================================================

async function handleLoginSubmit(e) {
    e.preventDefault(); // Prevent default form submission
    
    const elements = getDOMElements();
    const { loginEmail, loginPassword } = elements;
    
    // Fail-safe for missing inputs
    if (!loginEmail || !loginPassword) {
        showMessage('error', 'Form inputs not found.');
        return;
    }

    const email = loginEmail.value;
    const password = loginPassword.value;

    showMessage('info', 'Logging in...');

    try {
        const response = await fetch(\`\${BACKEND_URL}/api/user/login\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Success: Store token and redirect
            localStorage.setItem(TOKEN_KEY, data.token);
            showMessage('success', 'Login successful! Redirecting...');
            // In a real app, you would redirect to the dashboard here: window.location.href = '/dashboard';
        } else {
            showMessage('error', data.message || 'Login failed. Invalid credentials.');
        }
    } catch (error) {
        console.error('Login Fetch Error:', error);
        showMessage('error', 'Network error. Could not connect to the server.');
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault(); // Prevent default form submission
    
    const elements = getDOMElements();
    const { signupEmail, signupPassword } = elements;

    // Fail-safe for missing inputs
    if (!signupEmail || !signupPassword) {
        showMessage('error', 'Form inputs not found.');
        return;
    }

    const email = signupEmail.value;
    const password = signupPassword.value;

    showMessage('info', 'Registering...');

    try {
        const response = await fetch(\`\${BACKEND_URL}/api/user/signup\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('success', 'Registration successful! Please log in.');
            switchView('login'); // Switch to login view after successful registration
        } else {
            showMessage('error', data.message || 'Registration failed.');
        }
    } catch (error) {
        console.error('Signup Fetch Error:', error);
        showMessage('error', 'Network error. Could not connect to the server.');
    }
}

// =================================================================
// 4. MAIN INITIALIZATION & EVENT LISTENERS
// =================================================================

const initialize = () => {
    const elements = getDOMElements(); // Get all elements

    // Event listeners for view switching
    if (elements.showSignup) elements.showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        // Check if the link itself is changing color, but the form isn't appearing.
        // This is where the switch happens.
        console.log('Register link clicked. Switching to signup view...'); 
        switchView('signup');
    });
    
    if (elements.showLogin) elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('login');
    });

    // Event listeners for form submission
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLoginSubmit);
    if (elements.signupForm) elements.signupForm.addEventListener('submit', handleSignupSubmit);
};

// Start the initialization process once the DOM is ready (or immediately if already ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
`;

export default SCRIPT_CONTENT;
