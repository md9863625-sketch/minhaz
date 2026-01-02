// functions/get-tags.js
export default async function onRequest(context) {
    // 1. Only allow POST requests
    if (context.request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { 
            status: 405, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    try {
        // 2. Safely parse the incoming JSON
        const body = await context.request.json();
        const { url } = body;

        if (!url) {
            return new Response(JSON.stringify({ error: "No URL provided" }), { status: 400 });
        }

        const videoId = getYouTubeVideoId(url);
        if (!videoId) {
            return new Response(JSON.stringify({ error: "Invalid YouTube URL format" }), { status: 400 });
        }

        const WORKER_BASE = "https://api-server.youtubetools.xyz";
        const endpoint = `${WORKER_BASE}/videos?id=${encodeURIComponent(videoId)}`;
        
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`API returned status ${res.status}`);
        
        const json = await res.json();
        const tags = (json.items && json.items.length > 0) ? (json.items[0].snippet.tags || []) : [];

        return new Response(JSON.stringify({ tags }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        // This catches the "Unexpected end of JSON" if the body was empty
        return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function getYouTubeVideoId(url) {
    const patterns = [/v=([a-zA-Z0-9_-]{11})/, /\/embed\/([a-zA-Z0-9_-]{11})/, /youtu\.be\/([a-zA-Z0-9_-]{11})/, /\/shorts\/([a-zA-Z0-9_-]{11})/];
    for (const p of patterns) {
        const m = url.match(p);
        if (m && m[1]) return m[1];
    }
    return null;
}
