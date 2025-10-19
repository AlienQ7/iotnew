// authStyles.js

import { COLORS } from './constants.js';

const STYLE_STRING = `
/* --- 1. KEYFRAME ANIMATION FOR GLOW --- */
@keyframes pulseGlow {
    from {
        box-shadow: 0 0 5px ${COLORS.ACCENT}, 0 0 10px ${COLORS.ACCENT};
    }
    to {
        box-shadow: 0 0 15px ${COLORS.ACCENT}80, 0 0 20px ${COLORS.ACCENT}30;
    }
}

/* --- 2. GLOBAL & UTILITY STYLES --- */
body {
    background-color: ${COLORS.BG};
    color: ${COLORS.FG};
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

/* --- 3. MAIN CARD LAYOUT --- */
.auth-container {
    background-color: ${COLORS.BG}; /* Using the same BG for deep contrast */
    padding: 30px;
    border-radius: 8px;
    border: 1px solid ${COLORS.ACCENT_LOW}; /* Subtle border */
    width: 90%; /* Responsive width for mobile */
    max-width: 400px; /* Max width for desktop/laptop */
    
    /* Neon Glow Effect on the Card Border */
    box-shadow: 0 0 10px ${COLORS.ACCENT}AA, 0 0 20px ${COLORS.ACCENT}55;
    transition: box-shadow 0.3s ease;
}

h2 {
    color: ${COLORS.SUCCESS}; /* Green header, like your image */
    text-align: center;
    margin-bottom: 25px;
    font-size: 1.8em;
    text-transform: uppercase;
}

/* --- 4. FORM ELEMENTS --- */
.input-group {
    margin-bottom: 20px;
}

input[type="email"],
input[type="password"] {
    width: 100%;
    padding: 12px;
    background-color: ${COLORS.BORDER}; /* Dark grey background */
    border: 1px solid ${COLORS.AMBER_ORANGE}30; /* Light orange border */
    color: ${COLORS.FG};
    border-radius: 4px;
    box-sizing: border-box; /* Include padding in width */
    transition: border-color 0.3s ease;
}

input[type="email"]:focus,
input[type="password"]:focus {
    border-color: ${COLORS.AMBER_ORANGE}; /* Brighten border on focus */
    outline: none;
    box-shadow: 0 0 5px ${COLORS.AMBER_ORANGE}; /* Subtle glow on focus */
}

/* Placeholder styling */
::placeholder {
    color: ${COLORS.ACCENT}80; /* Faded orange placeholder */
}

/* --- 5. BUTTON STYLES (Primary Login/Signup) --- */
.auth-button {
    width: 100%;
    padding: 15px;
    margin-top: 15px;
    background-color: ${COLORS.DARK_BURN}; /* Dark Orange Background */
    color: ${COLORS.FG};
    border: none;
    border-radius: 4px;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    
    /* Initial Glow */
    box-shadow: 0 0 5px ${COLORS.ACCENT};
    
    transition: background-color 0.2s, box-shadow 0.2s, transform 0.1s;
}

.auth-button:hover {
    background-color: ${COLORS.ACCENT}; /* Brighten background on hover */
    box-shadow: 0 0 15px ${COLORS.ACCENT}, 0 0 25px ${COLORS.ACCENT}60;
}

/* ** CRITICAL RESPONSIVENESS/INTERACTIVITY: Instant Feedback ** */
.auth-button:active {
    /* Instantly changes on press */
    transform: scale(0.98); 
    box-shadow: 0 0 2px ${COLORS.ACCENT}; 
}

/* --- 6. FOOTER/REGISTER LINK --- */
.auth-footer {
    text-align: center;
    margin-top: 25px;
    font-size: 0.9em;
}

.auth-footer a {
    color: ${COLORS.AMBER_ORANGE}; /* Orange link color */
    text-decoration: none;
    font-weight: bold;
    transition: color 0.3s ease;
}

.auth-footer a:hover {
    color: ${COLORS.FG};
}

/* --- 7. MESSAGE BOX (Error/Success) --- */
.message {
    text-align: center;
    padding: 10px;
    margin-bottom: 15px;
    border-radius: 4px;
    font-weight: bold;
    display: none; /* Hidden by default */
}

.message.error {
    background-color: ${COLORS.DANGER}30;
    border: 1px solid ${COLORS.DANGER};
    color: ${COLORS.DANGER};
}

.message.success {
    background-color: ${COLORS.SUCCESS}30;
    border: 1px solid ${COLORS.SUCCESS};
    color: ${COLORS.SUCCESS};
}

/* --- 8. MEDIA QUERIES (Simple Responsiveness) --- */
@media (max-width: 600px) {
    .auth-container {
        padding: 25px;
        /* Use vertical viewport height on small screens for better centering */
        min-height: 100vh;
        width: 100%;
        max-width: none;
        border-radius: 0;
        box-shadow: none; /* Remove fancy glow on full-screen mobile */
    }
}
`;

/**
 * Function to dynamically inject the CSS string into the document head.
 */
export function injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = STYLE_STRING;
    document.head.appendChild(styleElement);
}
