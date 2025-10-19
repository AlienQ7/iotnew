// schedule.js

// =================================================================
// TIER AND SYSTEM LIMITS (Configurable Constants)
// =================================================================

// Free Tier Quantity Limits (Maximum number of items a user can create)
export const MAX_SCHEDULES = 5;      // Max number of schedules (timers) a Free user can set.
export const MAX_DEVICES = 5;        // Max number of devices a Free user can register.

// Validation Limits (For future input validation, useful for quality of life/storage limits)
export const MAX_CRON_FIELD_LENGTH = 10; // e.g., max length for a single cron field (* * * * *)
export const MAX_LABEL_LENGTH = 50;      // Max characters allowed for a device or schedule label.
// Note: These time/label limits are constants for input validation but don't stop the database INSERT.

// =================================================================
// SCHEDULE API HANDLER
// =================================================================

/**
 * Handles setting a new schedule, enforces the Free Tier limit, and inserts data into D1.
 * * @param {Request} request The incoming Worker request.
 * @param {Env} env The Worker environment variables.
 * @param {string} userEmail The authenticated user's email, passed from the router.
 * @returns {Promise<Response>} The response indicating success or failure.
 */
export async function handleSetSchedule(request, env, userEmail) {
    let deviceId, cronExpression, action;

    // Step 1: Robust JSON Parsing and Data Extraction
    try {
        // Expects { device_id: 123, cron_expression: "0 10 * * *", action: "ON" }
        const body = await request.json();
        deviceId = body.device_id; 
        cronExpression = body.cron_expression;
        action = body.action; 
    } catch (e) {
        return new Response('Invalid JSON format or missing fields in request body.', { status: 400 });
    }

    // Step 2: Input Validation (Basic)
    if (!deviceId || !cronExpression || !action) {
        return new Response('Missing device_id, cron_expression, or action.', { status: 400 });
    }

    if (action !== 'ON' && action !== 'OFF') {
        return new Response('Action must be "ON" or "OFF".', { status: 400 });
    }

    try {
        // Step 3: ENFORCE FREE TIER LIMIT
        
        // 3a. Count current schedules for this user
        const { results } = await env.dataiot.prepare(
            "SELECT COUNT(id) AS schedule_count FROM schedules WHERE user_email = ?"
        ).bind(userEmail).all();
        
        const currentCount = results[0]?.schedule_count || 0;

        if (currentCount >= MAX_SCHEDULES) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: `Limit reached: Free Tier users can set a maximum of ${MAX_SCHEDULES} schedules.` 
                }), 
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 3b. (Security Check): Verify the device_id belongs to the authenticated user
        const { results: deviceResults } = await env.dataiot.prepare(
            "SELECT id FROM devices WHERE id = ? AND user_email = ?"
        ).bind(deviceId, userEmail).all();

        if (deviceResults.length === 0) {
             return new Response('Device ID is invalid or does not belong to your account.', { status: 403 });
        }


        // Step 4: Insert New Schedule into D1
        const stmt = env.dataiot.prepare(
            "INSERT INTO schedules (user_email, device_id, cron_expression, action) VALUES (?, ?, ?, ?)"
        ).bind(userEmail, deviceId, cronExpression, action);

        await stmt.run();

        // Step 5: Success Response
        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Schedule created successfully.',
            current_schedules: currentCount + 1
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Schedule creation error:", error);
        return new Response('Internal Server Error during schedule creation.', { status: 500 });
    }
}
