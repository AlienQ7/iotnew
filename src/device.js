// device.js

import { MAX_DEVICES, MAX_LABEL_LENGTH } from './schedule'; // Import limit constants

// =================================================================
// DEVICE API HANDLER
// =================================================================

/**
 * Handles adding a new device, enforces the Free Tier limit, and inserts data into D1.
 * @param {Request} request The incoming Worker request.
 * @param {Env} env The Worker environment variables.
 * @param {string} userEmail The authenticated user's email.
 * @returns {Promise<Response>} The response indicating success or failure.
 */
export async function handleDeviceAdd(request, env, userEmail) {
    let name, deviceKey;

    // Step 1: Robust JSON Parsing and Data Extraction
    try {
        // Expects { name: "Living Room Light", device_key: "LRL-48f5a6" }
        ({ name, device_key: deviceKey } = await request.json());
    } catch (e) {
        return new Response('Invalid JSON format or missing fields in request body.', { status: 400 });
    }

    // Step 2: Input Validation (Name/Label Length)
    if (!name || !deviceKey) {
        return new Response('Device name and key are required.', { status: 400 });
    }
    if (name.length > MAX_LABEL_LENGTH) {
        return new Response(`Device name cannot exceed ${MAX_LABEL_LENGTH} characters.`, { status: 400 });
    }

    try {
        // Step 3: ENFORCE FREE TIER DEVICE LIMIT
        
        // 3a. Count current devices for this user
        const { results } = await env.dataiot.prepare(
            "SELECT COUNT(id) AS device_count FROM devices WHERE user_email = ?"
        ).bind(userEmail).all();
        
        const currentCount = results[0]?.device_count || 0;

        if (currentCount >= MAX_DEVICES) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: `Limit reached: Free Tier users can register a maximum of ${MAX_DEVICES} devices.` 
                }), 
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Step 4: Insert New Device into D1
        const stmt = env.dataiot.prepare(
            "INSERT INTO devices (user_email, name, device_key) VALUES (?, ?, ?)"
        ).bind(userEmail, name, deviceKey);

        await stmt.run();

        // Step 5: Success Response
        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Device registered successfully.',
            current_devices: currentCount + 1
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // Handle specific unique constraint error (device_key already exists globally)
        if (error.message && error.message.includes('UNIQUE constraint failed: devices.device_key')) {
             return new Response('This unique device key is already registered.', { status: 409 });
        }
        
        console.error("Device registration error:", error);
        return new Response('Internal Server Error during device registration.', { status: 500 });
    }
}
