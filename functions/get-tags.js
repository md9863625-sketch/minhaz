export async function onRequestPost(context) {
  try {
    // 1. Parse Input
    const { url } = await context.request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 2. Extract Video ID (Internal Logic)
    const videoId = extractVideoID(url);

    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube link format" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 3. Define Thumbnail Data
    const formats = [
      { name: 'HD Original', file: 'maxresdefault.jpg', css: 'size-max' },
      { name: 'SD Quality', file: 'sddefault.jpg', css: 'size-sd' },
      { name: 'HQ Quality', file: 'hqdefault.jpg', css: 'size-hq' },
      { name: 'Medium Quality', file: 'mqdefault.jpg', css: 'size-mq' },
      { name: 'Default Quality', file: 'default.jpg', css: 'size-def' }
    ];

    const thumbnails = formats.map(fmt => ({
      name: fmt.name,
      css: fmt.css,
      url: `https://img.youtube.com/vi/${videoId}/${fmt.file}`
    }));

    // 4. Return Data
    return new Response(JSON.stringify({ 
      videoId: videoId,
      thumbnails: thumbnails 
    }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error processing request" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

// Helper function inside backend scope
function extractVideoID(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
