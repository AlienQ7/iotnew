// src/style-template.js (Example CSS content)

const CSS_CONTENT = `
body {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
    margin: 0;
}
.auth-container {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 380px;
    text-align: center;
}
h2 {
    color: #1877f2;
    margin-bottom: 20px;
}
.input-group {
    margin-bottom: 15px;
}
input[type="email"], input[type="password"] {
    width: calc(100% - 20px);
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-sizing: border-box;
}
.auth-button {
    width: 100%;
    padding: 10px;
    background-color: #1877f2;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 10px;
}
.auth-button:hover {
    background-color: #166fe5;
}
.auth-footer {
    margin-top: 20px;
    font-size: 14px;
    color: #606770;
}
.auth-footer a {
    color: #1877f2;
    text-decoration: none;
}
.auth-footer a:hover {
    text-decoration: underline;
}
.message {
    padding: 10px;
    margin-bottom: 15px;
    border-radius: 4px;
    font-weight: bold;
}
.message.error {
    background-color: #fcd5d5;
    color: #a94442;
}
.message.success {
    background-color: #d4edda;
    color: #155724;
}
.message.info {
    background-color: #d9edf7;
    color: #31708f;
}
`;

// **THE FIX:** Export the entire CSS content as the default export.
export default CSS_CONTENT;
