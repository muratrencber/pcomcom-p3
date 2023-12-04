/**
 * 
 * @param {number} timestampInMs
 * @returns {string} 
 */
export function getTimestampString(timestampInMs)
{
    const hour = Math.floor(timestampInMs / (1000 * 60 * 60));
    timestampInMs -= hour * (1000 * 60 * 60);
    const minute = Math.floor(timestampInMs / (1000 * 60));
    timestampInMs -= minute * (1000 * 60);
    const second = Math.floor(timestampInMs / 1000);
    timestampInMs -= second * 1000;
    const centisecond = Math.floor(timestampInMs / 10);
    const h = hour.toString().padStart(2,"0");
    const m = minute.toString().padStart(2,"0");
    const s = second.toString().padStart(2,"0");
    const c = centisecond.toString().padStart(2,"0");
    const fullTime = `${h}:${m}:${s}:${c}`;
    return fullTime;
}