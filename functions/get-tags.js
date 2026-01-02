export async function onRequestPost(context) {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Adjust for production security if needed
    };

    try {
        // 1. Parse Request Body
        const { keyword } = await context.request.json();

        if (!keyword) {
            return new Response(JSON.stringify({ error: "Keyword is required" }), {
                status: 400,
                headers
            });
        }

        // 2. Setup Logic
        const allKeywords = new Set();
        const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        const variations = [keyword, ...alphabet.map(l => `${keyword} ${l}`)];

        // 3. Process API Calls (Server-side)
        // We use Promise.all to fetch suggestions faster than a sequential for-loop
        const fetchTasks = variations.map(async (query) => {
            try {
                const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const suggestions = data[1]; // Google Suggest format: [query, [suggestions], ...]
                    suggestions.forEach(s => {
                        const cleanS = s.toLowerCase().trim();
                        if (cleanS.length > 2) {
                            allKeywords.add(cleanS);
                        }
                    });
                }
            } catch (e) {
                // Silently skip individual failed fetches to ensure overall success
                console.error(`Fetch failed for query: ${query}`);
            }
        });

        await Promise.all(fetchTasks);

        // 4. Return Cleaned Data
        return new Response(JSON.stringify({ 
            tags: Array.from(allKeywords),
            count: allKeywords.size 
        }), { 
            status: 200, 
            headers 
        });

    } catch (error) {
        // 5. Global Error Handling
        return new Response(JSON.stringify({ 
            error: "Internal Server Error", 
            details: error.message 
        }), { 
            status: 500, 
            headers 
        });
    }
}
