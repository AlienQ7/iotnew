// device.js - COMPLETE

import { MAX_DEVICES, MAX_LABEL_LENGTH } from './schedule'; // Import limit constants

// =================================================================
// DEVICE API HANDLERS
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
        if (error.message && error.message.includes('UNIQUE constraint failed: devices.device_key')) {
             return new Response('This unique device key is already registered.', { status: 409 });
        }
        
        console.error("Device registration error:", error);
        return new Response('Internal Server Error during device registration.', { status: 500 });
    }
}


/**
 * Retrieves and lists all devices owned by the authenticated user.
 * @param {Env} env The Worker environment variables.
 * @param {string} userEmail The authenticated user's email.
 * @returns {Promise<Response>} A list of devices or an empty array.
 */
export async function handleDeviceList(env, userEmail) {
    try {
        const { results: devices } = await env.dataiot.prepare(
            "SELECT id, name, device_key FROM devices WHERE user_email = ?"
        ).bind(userEmail).all();

        return new Response(JSON.stringify({ success: true, devices }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
        
    } catch (error) {
        console.error("Device list error:", error);
        return new Response('Internal Server Error fetching device list.', { status: 500 });
    }
}


/**
 * Deletes a specific device by its ID, ensuring it belongs to the user.
 * @param {Request} request The incoming Worker request.
 * @param {Env} env The Worker environment variables.
 * @param {string} userEmail The authenticated user's email.
 * @returns {Promise<Response>} Success or failure message.
 */
export async function handleDeviceDelete(request, env, userEmail) {
    // We expect the device ID to be passed as a query parameter or in the body.
    // For simplicity, let's assume it's a query parameter: ?id=123
    const url = new URL(request.url);
    const deviceId = url.searchParams.get('id');

    if (!deviceId) {
        return new Response('Device ID is required.', { status: 400 });
    }

    try {
        // IMPORTANT: We use both deviceId AND userEmail to prevent a user 
        // from deleting a device they don't own (Access Control).
        const stmt = env.dataiot.prepare(
            "DELETE FROM devices WHERE id = ? AND user_email = ?"
        ).bind(deviceId, userEmail);

        const result = await stmt.run();
        
        // Check if any rows were deleted
        if (result.changes === 0) {
             return new Response(JSON.stringify({ 
                success: false, 
                message: 'Device not found or does not belong to your account.' 
             }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        // Deleting the device automatically deletes associated schedules 
        // due to the FOREIGN KEY ... ON DELETE CASCADE constraint defined earlier.

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Device ID ${deviceId} and all its associated schedules have been deleted.` 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Device deletion error:", error);
        return new Response('Internal Server Error during device deletion.', { status: 500 });
    }
}
