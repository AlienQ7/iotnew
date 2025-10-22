// src/auth-styles.js

export const STYLE_STRING = `
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        background-color: #f7f9fc;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
    }
    .auth-container {
        background: #ffffff;
        padding: 30px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 380px;
        transition: all 0.3s ease;
    }
    h2 {
        text-align: center;
        color: #333;
        margin-bottom: 25px;
        font-size: 1.8em;
    }
    .input-group {
        margin-bottom: 18px;
    }
    input[type="email"],
    input[type="password"] {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-sizing: border-box;
        font-size: 1em;
        transition: border-color 0.2s;
    }
    input[type="email"]:focus,
    input[type="password"]:focus {
        border-color: #007bff;
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
    }
    .auth-button {
        width: 100%;
        padding: 12px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: bold;
        transition: background-color 0.2s, transform 0.1s;
        margin-top: 10px;
    }
    .auth-button:hover {
        background-color: #0056b3;
    }
    .auth-button:active {
        transform: translateY(1px);
    }
    .auth-footer {
        text-align: center;
        margin-top: 20px;
        font-size: 0.9em;
        color: #666;
    }
    .auth-footer a {
        color: #007bff;
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s;
    }
    .auth-footer a:hover {
        color: #0056b3;
        text-decoration: underline;
    }
    .message {
        padding: 12px;
        margin-bottom: 15px;
        border-radius: 8px;
        font-weight: 500;
        text-align: center;
        display: none;
    }
    .message.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    .message.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    .message.info {
        background-color: #cce5ff;
        color: #004085;
        border: 1px solid #b8daff;
    }
    
    /* View Switching Setup - CRITICAL */
    #signup-view {
        display: none;
    }
`;
