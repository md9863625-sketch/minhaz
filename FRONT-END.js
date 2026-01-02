// 1. Inject Styles
const style = document.createElement('style');
style.textContent = `
  #output { margin-top: 20px; display: flex; flex-direction: column; align-items: center; width: 100%; }
  .result-container { background: #ffffff; border: 2px solid #000000; border-radius: 20px; padding: 20px 0; width: 90%; max-width: 400px; display: flex; flex-direction: column; align-items: center; gap: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); box-sizing: border-box; overflow: hidden; }
  .thumb-item { display: flex; flex-direction: column; align-items: center; width: 100%; }
  .size-max { width: 85%; } .size-sd { width: 70%; } .size-hq { width: 55%; } .size-mq { width: 40%; } .size-def { width: 25%; }
  .thumb-item img { border-radius: 8px; border: 1px solid #000; margin-top: 5px; aspect-ratio: 16 / 9; width: 100%; height: auto; display: block; object-fit: cover; background: #000; }
  .select-row { display: flex; align-items: center; gap: 6px; color: #000; font-family: sans-serif; font-weight: bold; font-size: 12px; }
  .thumb-check { accent-color: #000; transform: scale(1.1); cursor: pointer; }
  #mainDownloadBtn { background: #000; color: #fff; border: none; padding: 12px 0; border-radius: 50px; cursor: pointer; font-weight: bold; font-size: 14px; text-transform: uppercase; width: 85%; margin-top: 10px; transition: 0.2s ease-in-out; }
  #mainDownloadBtn:hover { background: #333; }
`;
document.head.appendChild(style);

// 2. UI Logic Functions
function removeURL() {
  const input = document.getElementById('youtubeLink');
  const removeBtn = document.getElementById('removeBtn');
  const output = document.getElementById('output');
  if (input) input.value = '';
  if (removeBtn) removeBtn.style.display = 'none';
  if (output) output.innerHTML = '';
}

async function generateThumbnail() {
  const input = document.getElementById('youtubeLink').value.trim();
  const outputDiv = document.getElementById('output');
  const loadingDiv = document.getElementById('loading');
  const removeBtn = document.getElementById('removeBtn');

  if (!input) return;

  removeBtn.style.display = 'inline-block';
  loadingDiv.style.display = 'block';
  outputDiv.innerHTML = '';

  try {
    // Replace direct logic with backend call
    const response = await fetch('/get-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to process link');
    }

    let html = '<div class="result-container">';
    data.thumbnails.forEach((thumb, index) => {
      html += `
        <div class="thumb-item ${thumb.css}">
          <div class="select-row">
            <input type="checkbox" class="thumb-check" value="${thumb.url}" data-quality="${thumb.name}" id="chk${index}">
            <label for="chk${index}">${thumb.name}</label>
          </div>
          <img src="${thumb.url}" onerror="this.parentElement.style.display='none'">
        </div>`;
    });

    html += `<button id="mainDownloadBtn" onclick="downloadSelected('${data.videoId}')">Download Selected</button></div>`;
    outputDiv.innerHTML = html;

  } catch (err) {
    outputDiv.innerHTML = `<p style="color:red; font-weight:bold; font-size:14px;">⚠️ ${err.message}</p>`;
  } finally {
    loadingDiv.style.display = 'none';
  }
}

function downloadSelected(videoId) {
  const selected = document.querySelectorAll('.thumb-check:checked');
  if (selected.length === 0) {
    alert("Please select at least one thumbnail.");
    return;
  }

  selected.forEach((cb, index) => {
    setTimeout(() => {
      const imgUrl = cb.value;
      const qualityName = cb.getAttribute('data-quality').replace(/\s+/g, '_');
      
      fetch(imgUrl)
        .then(res => res.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${qualityName}_${videoId}.jpg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
    }, index * 700);
  });
}
