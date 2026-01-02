export default async function handler(context) {
    // Only allow POST requests
    if (context.request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { 
            status: 405, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        const { url } = await context.request.json();
        const WORKER_BASE = "https://api-server.youtubetools.xyz"; 

        // 1. Validate and Extract Video ID
        const videoId = getYouTubeVideoId(url);
        if (!videoId) {
            return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 2. Fetch data from API
        const snippet = await fetchSnippet(WORKER_BASE, videoId);

        // 3. Return Tags
        return new Response(JSON.stringify({ 
            tags: snippet.tags || [] 
        }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message || "An internal server error occurred" 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}

// --- HELPER FUNCTIONS ---

function getYouTubeVideoId(url) {
    if (!url) return null;
    url = url.trim();
    const patterns = [
        /v=([a-zA-Z0-9_-]{11})/, 
        /\/embed\/([a-zA-Z0-9_-]{11})/, 
        /youtu\.be\/([a-zA-Z0-9_-]{11})/, 
        /\/v\/([a-zA-Z0-9_-]{11})/, 
        /\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m && m[1]) return m[1];
    }
    const last = url.slice(-11);
    return /^[A-Za-z0-9_-]{11}$/.test(last) ? last : null;
}

async function fetchSnippet(apiBase, videoId) {
    const endpoint = `${apiBase}/videos?id=${encodeURIComponent(videoId)}`;
    const res = await fetch(endpoint);
    
    if (!res.ok) {
        throw new Error('YouTube API communication failed');
    }
    
    const json = await res.json();
    if (!json.items || !json.items.length) {
        throw new Error('Video not found or is private');
    }
    
    return json.items[0].snippet;
}