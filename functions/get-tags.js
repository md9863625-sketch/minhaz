export default async function handler(context) {
    const { request, env } = context;

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
        });
    }

    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    };

    try {
        // 2. Parse User Input
        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
        }

        const body = await request.json();
        const inputUrl = body.url;

        // 3. Extract Video ID
        const videoId = getYouTubeVideoId(inputUrl);
        if (!videoId) {
            return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), { status: 400, headers: corsHeaders });
        }

        // 4. Call Google YouTube API
        // Make sure "Extractor_API_KEY" is set in Cloudflare Pages -> Settings -> Variables
        const ytApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${env.Extractor_API_KEY}`;
        const res = await fetch(ytApiUrl);
        
        if (!res.ok) {
            return new Response(JSON.stringify({ error: "YouTube API Error" }), { status: res.status, headers: corsHeaders });
        }

        const data = await res.json();

        // 5. Log to Database (D1)
        // Make sure "DB" is bound in Cloudflare Pages -> Settings -> Functions -> D1 Database bindings
        if (env.DB) {
            context.waitUntil(
                env.DB.prepare("INSERT INTO request_logs (input, output) VALUES (?, ?)")
                    .bind(inputUrl, JSON.stringify(data.items?.[0]?.snippet?.tags || []))
                    .run()
                    .catch(e => console.error("DB Log Error:", e))
            );
        }

        // 6. Return Tags to Frontend
        if (!data.items || data.items.length === 0) {
            return new Response(JSON.stringify({ tags: [] }), { status: 200, headers: corsHeaders });
        }

        const tags = data.items[0].snippet.tags || [];
        return new Response(JSON.stringify({ tags: tags }), { status: 200, headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}

// Helper to extract ID from various YouTube URL formats
function getYouTubeVideoId(url) {
    if (!url) return null;
    const patterns = [
        /v=([a-zA-Z0-9_-]{11})/, 
        /youtu\.be\/([a-zA-Z0-9_-]{11})/, 
        /embed\/([a-zA-Z0-9_-]{11})/, 
        /shorts\/([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m && m[1]) return m[1];
    }
    return (url.length === 11) ? url : null;
}
