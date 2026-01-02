// --- CONFIGURATION ---
const BACKEND_ENDPOINT = '/get-tags';

// --- DOM ELEMENTS ---
const videoUrl = document.getElementById('videoUrl');
const btnGet = document.getElementById('btnGet');
const btnReset = document.getElementById('btnReset');
const outputBox = document.getElementById('outputBox');

// --- INJECT PROFESSIONAL CSS ---
const style = document.createElement('style');
style.innerHTML = `
    .loader-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; width: 100%; grid-column: 1 / span 2; }
    .spinner-container { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
    .loading-circle { width: 100%; height: 100%; border: 6px solid #f3f3f3; border-top: 6px solid #000; border-radius: 50%; position: absolute; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    #percent-text { font-weight: bold; font-size: 18px; color: #000; z-index: 10; }
    #copy-notice { display: none; background: #333; color: #fff; text-align: center; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; animation: slideDown 0.4s ease; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .grid-active { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; }
    .kw-item { background: #f9f9f9; padding: 8px 12px; border: 1px solid #eee; border-radius: 6px; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
    .kw-text span { color: #ff0000; font-weight: bold; margin-right: 8px; }
    .remove-btn { background: #eee; color: #888; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .remove-btn:hover { background: #ff0000; color: #fff; }
    .no-tags-error { color: #ff0000; font-weight: bold; text-align: center; padding: 20px; border: 2px dashed #ff0000; border-radius: 8px; background: #fff5f5; animation: shakePulse 0.6s ease-in-out; }
    @keyframes shakePulse { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } 50% { scale: 1.05; } }
    #copy { font-size: 1rem; border: 2px solid #000000; border-radius: 8px; padding: 12px 18px; cursor: pointer; transition: 0.3s; background-color: #000; color: #fff; display: block; margin: 20px auto; font-weight: bold; }
    #copy:hover { background-color: #fff; color: #000; }
`;
document.head.appendChild(style);

// Notification Bar Element
const noticeEl = document.createElement('div');
noticeEl.id = "copy-notice";
noticeEl.innerHTML = "✨ Extraction Complete! Scroll down to copy. 👇";
outputBox.parentNode.insertBefore(noticeEl, outputBox);

// --- UI RENDERING FUNCTIONS ---
function renderResults(tags) {
    outputBox.innerHTML = "";
    if (!tags || tags.length === 0) {
        outputBox.innerHTML = `<div class="no-tags-error">⚠️ This video has NO tags.</div>`;
        return;
    }
    outputBox.classList.add("grid-active");
    noticeEl.style.display = "block";
    
    tags.forEach((tag, i) => {
        const div = document.createElement("div");
        div.className = "kw-item";
        div.innerHTML = `<div class="kw-text"><span>${i + 1}.</span> ${tag}</div><button class="remove-btn" onclick="this.parentElement.remove(); updateNumbers();">×</button>`;
        outputBox.appendChild(div);
    });

    const copyBtn = document.createElement("button");
    copyBtn.id = "copy";
    copyBtn.innerText = "📋 Copy All Tags";
    copyBtn.onclick = copyAllTags;
    outputBox.parentNode.insertBefore(copyBtn, outputBox.nextSibling);

    window.scrollTo({ top: noticeEl.offsetTop - 20, behavior: 'smooth' });
}

function copyAllTags() {
    const tagElements = document.querySelectorAll(".kw-text");
    const tagList = Array.from(tagElements).map(el => {
        const clone = el.cloneNode(true);
        const span = clone.querySelector('span');
        if (span) span.remove();
        return clone.innerText.trim();
    });
    
    const textToCopy = tagList.join(", ");
    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.getElementById('copy');
        const originalText = btn.innerText;
        btn.innerText = "✅ Copied!";
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
}

window.updateNumbers = function() {
    document.querySelectorAll(".kw-text span").forEach((span, i) => { span.innerText = (i + 1) + "."; });
};

// --- ACTION LISTENERS ---
btnGet.addEventListener('click', async () => {
    const urlValue = videoUrl.value.trim();
    if (!urlValue) return alert('Please enter a YouTube URL');

    // Reset UI for new load
    const oldBtn = document.getElementById('copy');
    if (oldBtn) oldBtn.remove();
    btnGet.disabled = true;
    noticeEl.style.display = 'none';
    outputBox.style.display = 'block';
    outputBox.classList.remove("grid-active");
    outputBox.innerHTML = `<div class="loader-wrapper"><div class="spinner-container"><div class="loading-circle"></div><div id="percent-text">0%</div></div><div style="margin-top:15px; color:#666;">Extracting Video Tags...</div></div>`;

    try {
        // Fake progress animation
        const percentLabel = document.getElementById("percent-text");
        const progressInterval = setInterval(() => {
            let current = parseInt(percentLabel.innerText);
            if (current < 90) percentLabel.innerText = (current + 5) + "%";
        }, 100);

        // Fetch from Backend
        const response = await fetch(BACKEND_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlValue })
        });

        const data = await response.json();
        clearInterval(progressInterval);
        percentLabel.innerText = "100%";

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch tags');
        }

        renderResults(data.tags || []);
    } catch (err) {
        outputBox.innerHTML = `<div class="no-tags-error">Error: ${err.message}</div>`;
    } finally {
        btnGet.disabled = false;
    }
});

btnReset.addEventListener('click', () => {
    videoUrl.value = '';
    outputBox.innerHTML = '';
    outputBox.style.display = 'none';
    outputBox.classList.remove("grid-active");
    noticeEl.style.display = 'none';
    const oldBtn = document.getElementById('copy');
    if (oldBtn) oldBtn.remove();
    btnGet.disabled = false;
});
