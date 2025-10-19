// scheduler.js

// Placeholder for the real IoT integration (MQTT, API call, etc.)
async function dispatchDeviceAction(deviceKey, action) {
    // NOTE: In a production IoT system, this is where you would integrate 
    // with your device communication protocol (e.g., sending an MQTT message 
    // to the topic defined by the deviceKey, or calling a third-party API).
    
    // For now, we just log the action:
    console.log(`[ACTION DISPATCHED] Device Key: ${deviceKey}, Action: ${action}`);
    
    // You might also update a 'last_action_time' field in the devices table here.
}

/**
 * Checks if the current UTC minute and hour matches the cron expression (simplified to M H).
 * @param {string} cronExpression The schedule string (e.g., "30 22 * * *").
 * @param {Date} nowUtc The current UTC Date object.
 * @returns {boolean} True if the schedule should run now.
 */
function isDue(cronExpression, nowUtc) {
    // CRON format: minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-7)
    const [minute, hour, dom, month, dow] = cronExpression.split(' ');
    
    const currentMinute = nowUtc.getUTCMinutes().toString();
    const currentHour = nowUtc.getUTCHours().toString();
    const currentDom = nowUtc.getUTCDate().toString();
    const currentMonth = (nowUtc.getUTCMonth() + 1).toString(); // Month is 0-indexed
    const currentDow = nowUtc.getUTCDay().toString(); // Sunday is 0

    // Simplified matching: We only check the Minute and Hour for simplicity in this demo.
    // Full cron logic is complex (involving ranges, steps, and wildcards) and usually 
    // requires a library, but this basic check covers most common timers.
    
    const minuteMatch = minute === '*' || minute === currentMinute;
    const hourMatch = hour === '*' || hour === currentHour;

    // To add more precision, you would add checks for day of month, month, and day of week:
    // const domMatch = dom === '*' || dom === currentDom;
    // const monthMatch = month === '*' || month === currentMonth;
    // const dowMatch = dow === '*' || dow === currentDow;
    
    // return minuteMatch && hourMatch && domMatch && monthMatch && dowMatch;
    return minuteMatch && hourMatch; // Simplified check
}


/**
 * The main handler executed every minute by the Cron Trigger.
 * @param {Env} env The Worker environment variables.
 */
export async function handleScheduledTrigger(env) {
    // 1. Get the current time in UTC
    const nowUtc = new Date();
    console.log(`[SCHEDULER] Running check for UTC time: ${nowUtc.toISOString()}`);
    
    try {
        // 2. Query D1 for all active schedules
        // We join 'schedules' with 'devices' to get the necessary 'device_key'
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
        
        console.log(`[SCHEDULER] Checking ${activeSchedules.length} active schedules...`);

        // 3. Iterate and Check if Due
        for (const schedule of activeSchedules) {
            if (isDue(schedule.cron_expression, nowUtc)) {
                console.log(`[SCHEDULER] Match found for cron: ${schedule.cron_expression}`);
                
                // 4. Dispatch the action (async)
                // We don't need to await this, allowing the loop to continue
                // and the worker to finish quickly (fire-and-forget style).
                dispatchDeviceAction(schedule.device_key, schedule.action);
            }
        }
        
    } catch (error) {
        console.error("Critical Scheduler Error:", error);
        // Do NOT rethrow the error; let the worker finish gracefully.
    }
}
