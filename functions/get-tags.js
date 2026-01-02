export default async function handler(context) {
    try {
        const { url } = await context.request.json();
        const videoId = getYouTubeVideoId(url);

        if (!videoId) {
            return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), { status: 400 });
        }

        // Hidden API details
        const WORKER_BASE = "https://api-server.youtubetools.xyz";
        const endpoint = `${WORKER_BASE}/videos?id=${encodeURIComponent(videoId)}`;
        
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('API Error');
        
        const json = await res.json();
        const tags = (json.items && json.items.length > 0) ? (json.items[0].snippet.tags || []) : [];

        return new Response(JSON.stringify({ tags }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// Helper kept inside the function to ensure the server understands the ID
function getYouTubeVideoId(url) {
    if (!url) return null;
    url = url.trim();
    const patterns = [/v=([a-zA-Z0-9_-]{11})/, /\/embed\/([a-zA-Z0-9_-]{11})/, /youtu\.be\/([a-zA-Z0-9_-]{11})/, /\/v\/([a-zA-Z0-9_-]{11})/, /\/shorts\/([a-zA-Z0-9_-]{11})/];
    for (const p of patterns) {
        const m = url.match(p);
        if (m && m[1]) return m[1];
    }
    const last = url.slice(-11);
    return /^[A-Za-z0-9_-]{11}$/.test(last) ? last : null;
}
