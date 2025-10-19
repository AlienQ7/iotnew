// schedule.js - COMPLETE (FIXED handleScheduledTrigger signature)

// TIER AND SYSTEM LIMITS (Configurable Constants)
export const MAX_SCHEDULES = 5;      
export const MAX_DEVICES = 5;        
export const MAX_CRON_FIELD_LENGTH = 10; 
export const MAX_LABEL_LENGTH = 50;      

// Placeholder for the real IoT integration
async function dispatchDeviceAction(deviceKey, action) {
    console.log(`[ACTION DISPATCHED] Device Key: ${deviceKey}, Action: ${action}`);
}

function isDue(cronExpression, nowUtc) {
    const [minute, hour] = cronExpression.split(' ');
    const currentMinute = nowUtc.getUTCMinutes().toString();
    const currentHour = nowUtc.getUTCHours().toString();
    
    const minuteMatch = minute === '*' || minute === currentMinute;
    const hourMatch = hour === '*' || hour === currentHour;

    return minuteMatch && hourMatch;
}


/**
 * The main handler executed every minute by the Cron Trigger.
 * CRITICAL FIX: Updated to accept all three parameters (event, env, ctx).
 * @param {Event} event The scheduled event (required by runtime).
 * @param {Env} env The Worker environment variables.
 * @param {Context} ctx The execution context.
 */
export async function handleScheduledTrigger(event, env, ctx) {
    const nowUtc = new Date();
    console.log(`[SCHEDULER] Running check for UTC time: ${nowUtc.toISOString()}`);
    
    try {
        const { results: activeSchedules } = await env.dataiot.prepare(`
            SELECT 
                s.cron_expression, 
                s.action, 
                d.device_key 
            FROM schedules s
            JOIN devices d ON s.device_id = d.id
            WHERE s.is_active = 1
        `).all();
        
        if (activeSchedules.length === 0) {
            console.log("[SCHEDULER] No active schedules found.");
            return;
        }
        
        for (const schedule of activeSchedules) {
            if (isDue(schedule.cron_expression, nowUtc)) {
                dispatchDeviceAction(schedule.device_key, schedule.action);
            }
        }
    } catch (error) {
        console.error("Critical Scheduler Error:", error);
    }
}


/**
 * Handles setting a new schedule and enforces the Free Tier limit.
 */
export async function handleSetSchedule(request, env, userEmail) {
    // ... (Existing handleSetSchedule logic remains here) ...
    let deviceId, cronExpression, action;
    try {
        const body = await request.json();
        deviceId = body.device_id; 
        cronExpression = body.cron_expression;
        action = body.action; 
    } catch (e) {
        return new Response('Invalid JSON format or missing fields in request body.', { status: 400 });
    }
    if (!deviceId || !cronExpression || !action || (action !== 'ON' && action !== 'OFF')) {
        return new Response('Missing or invalid schedule parameters.', { status: 400 });
    }

    try {
        // ENFORCE FREE TIER LIMIT
        const { results: countResults } = await env.dataiot.prepare(
            "SELECT COUNT(id) AS schedule_count FROM schedules WHERE user_email = ?"
        ).bind(userEmail).all();
        const currentCount = countResults[0]?.schedule_count || 0;

        if (currentCount >= MAX_SCHEDULES) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: `Limit reached: Free Tier users can set a maximum of ${MAX_SCHEDULES} schedules.` 
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // Verify device ownership
        const { results: deviceResults } = await env.dataiot.prepare(
            "SELECT id FROM devices WHERE id = ? AND user_email = ?"
        ).bind(deviceId, userEmail).all();
        if (deviceResults.length === 0) {
             return new Response('Device ID is invalid or does not belong to your account.', { status: 403 });
        }

        // Insert
        await env.dataiot.prepare(
            "INSERT INTO schedules (user_email, device_id, cron_expression, action) VALUES (?, ?, ?, ?)"
        ).bind(userEmail, deviceId, cronExpression, action).run();

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Schedule created successfully.',
            current_schedules: currentCount + 1
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Schedule creation error:", error);
        return new Response('Internal Server Error during schedule creation.', { status: 500 });
    }
}


/**
 * Retrieves and lists all schedules owned by the authenticated user.
 */
export async function handleScheduleList(env, userEmail) {
    try {
        // Join with devices to provide the device name alongside the schedule
        const { results: schedules } = await env.dataiot.prepare(`
            SELECT 
                s.id, 
                s.cron_expression, 
                s.action, 
                s.is_active, 
                d.name AS device_name,
                d.id AS device_id
            FROM schedules s
            JOIN devices d ON s.device_id = d.id
            WHERE s.user_email = ?
            ORDER BY s.id DESC
        `).bind(userEmail).all();

        return new Response(JSON.stringify({ success: true, schedules }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
        
    } catch (error) {
        console.error("Schedule list error:", error);
        return new Response('Internal Server Error fetching schedule list.', { status: 500 });
    }
}

/**
 * Deletes a specific schedule by its ID, ensuring it belongs to the user.
 */
export async function handleScheduleDelete(request, env, userEmail) {
    // Expecting ID as a query parameter: /api/schedule/delete?id=123
    const url = new URL(request.url);
    const scheduleId = url.searchParams.get('id');

    if (!scheduleId) {
        return new Response('Schedule ID is required.', { status: 400 });
    }

    try {
        // IMPORTANT: Access control using both ID and userEmail
        const stmt = env.dataiot.prepare(
            "DELETE FROM schedules WHERE id = ? AND user_email = ?"
        ).bind(scheduleId, userEmail);

        const result = await stmt.run();
        
        if (result.changes === 0) {
             return new Response(JSON.stringify({ 
                success: false, 
                message: 'Schedule not found or does not belong to your account.' 
             }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Schedule ID ${scheduleId} has been deleted.` 
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Schedule deletion error:", error);
        return new Response('Internal Server Error during schedule deletion.', { status: 500 });
    }
}

/**
 * Toggles a schedule's active status (Pause/Resume).
 */
export async function handleScheduleToggle(request, env, userEmail) {
    let scheduleId, active; // 'active' will be a boolean from the body

    try {
        // Expecting { id: 123, active: true/false }
        const body = await request.json();
        scheduleId = body.id; 
        // Convert boolean/number to 1 or 0 for D1
        active = body.active === true || body.active === 1 ? 1 : 0; 
        
    } catch (e) {
        return new Response('Invalid JSON format or missing ID/active status.', { status: 400 });
    }

    if (!scheduleId) {
        return new Response('Schedule ID is required.', { status: 400 });
    }

    try {
        // IMPORTANT: Access control using both ID and userEmail
        const stmt = env.dataiot.prepare(
            "UPDATE schedules SET is_active = ? WHERE id = ? AND user_email = ?"
        ).bind(active, scheduleId, userEmail);

        const result = await stmt.run();
        
        if (result.changes === 0) {
             return new Response(JSON.stringify({ 
                success: false, 
                message: 'Schedule not found or does not belong to your account.' 
             }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const status = active === 1 ? 'resumed' : 'paused';
        return new Response(JSON.stringify({ 
            success: true, 
            message: `Schedule ID ${scheduleId} has been ${status}.` 
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Schedule toggle error:", error);
        return new Response('Internal Server Error during schedule toggling.', { status: 500 });
    }
}
