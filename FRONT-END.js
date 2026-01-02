const inputBox = document.getElementById("keywordInput");
const btnGet = document.getElementById("btnGet");
const btnCopy = document.getElementById("btnCopy");
const btnReset = document.getElementById("btnReset");
const outputBox = document.getElementById("outputBox");

// --- INJECT CSS ---
const style = document.createElement('style');
style.innerHTML = `
    .loader-wrapper {
        display: flex; flex-direction: column; align-items: center; 
        justify-content: center; min-height: 200px; width: 100%; grid-column: 1 / span 2;
    }
    .spinner-container {
        position: relative; width: 80px; height: 80px; 
        display: flex; align-items: center; justify-content: center;
    }
    .loading-circle {
        width: 100%; height: 100%;
        border: 6px solid #f3f3f3;
        border-top: 6px solid #000000;
        border-radius: 50%;
        position: absolute;
        animation: spin-logic 1s linear infinite;
    }
    @keyframes spin-logic { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    #percent-text { font-weight: bold; font-size: 14px; color: #000; z-index: 10; text-align: center; }
    
    #copy-notice {
        display: none; background: #333; color: #fff; text-align: center;
        padding: 10px; border-radius: 8px; margin-bottom: 15px;
        font-size: 14px; animation: slideDown 0.4s ease;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .grid-active { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; }
    .kw-item { 
        background: #f9f9f9; padding: 8px 12px; border: 1px solid #eee; 
        border-radius: 6px; font-size: 14px; display: flex; 
        justify-content: space-between; align-items: center;
    }
    .kw-text span { color: #ff0000; font-weight: bold; margin-right: 8px; }
    .remove-btn {
        background: #eee; color: #888; border: none; border-radius: 50%;
        width: 20px; height: 20px; cursor: pointer; font-size: 12px;
        display: flex; align-items: center; justify-content: center;
    }
    .remove-btn:hover { background: #ff0000; color: white; }
    .error-msg { color: #ff0000; text-align: center; padding: 20px; grid-column: 1 / span 2; }
`;
document.head.appendChild(style);

const noticeEl = document.createElement('div');
noticeEl.id = "copy-notice";
noticeEl.innerHTML = "✨ Generation Complete! Scroll down to copy your keywords. 👇";
outputBox.parentNode.insertBefore(noticeEl, outputBox);

// --- FRONT-END LOGIC ---
btnGet.addEventListener("click", async () => {
    const seed = inputBox.value.trim();
    if (!seed) return;

    // Reset UI
    btnGet.disabled = true;
    btnCopy.style.display = "none";
    noticeEl.style.display = "none";
    outputBox.style.display = "block";
    outputBox.classList.remove("grid-active");
    
    outputBox.innerHTML = `
        <div class="loader-wrapper">
            <div class="spinner-container">
                <div class="loading-circle"></div>
                <div id="percent-text">Deep<br>Search</div>
            </div>
            <div style="margin-top:15px; color:#666;">Analyzing YouTube Suggestions...</div>
        </div>
    `;

    try {
        const response = await fetch('/get-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: seed })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch tags");
        }

        renderFinalResults(data.tags);
    } catch (err) {
        outputBox.innerHTML = `<div class="error-msg">⚠️ Error: ${err.message}</div>`;
        btnGet.disabled = false;
    }
});

function renderFinalResults(results) {
    btnGet.disabled = false;
    outputBox.innerHTML = "";
    
    if (results && results.length > 0) {
        noticeEl.style.display = "block";
        outputBox.classList.add("grid-active");
        results.forEach((kw, i) => {
            const div = document.createElement("div");
            div.className = "kw-item";
            div.innerHTML = `
                <div class="kw-text"><span>${i + 1}.</span> ${kw}</div>
                <button class="remove-btn" onclick="this.parentElement.remove(); updateNumbers();">×</button>
            `;
            outputBox.appendChild(div);
        });
        btnCopy.style.display = "inline-flex";
        window.scrollTo({ top: noticeEl.offsetTop - 20, behavior: 'smooth' });
    } else {
        outputBox.innerHTML = "<div class='error-msg'>No results found. Try a different keyword.</div>";
    }
}

window.updateNumbers = function() {
    const items = document.querySelectorAll(".kw-text span");
    items.forEach((span, index) => { span.innerText = (index + 1) + "."; });
};

btnReset.addEventListener("click", () => {
    inputBox.value = "";
    outputBox.innerHTML = "";
    outputBox.style.display = "none";
    btnCopy.style.display = "none";
    noticeEl.style.display = "none";
    btnGet.disabled = false;
});

btnCopy.addEventListener("click", async () => {
    const text = Array.from(document.querySelectorAll(".kw-item"))
                      .map(el => el.querySelector(".kw-text").innerText.replace(/^\d+\.\s/, ""))
                      .join(", ");
    if(!text) return;
    await navigator.clipboard.writeText(text);
    btnCopy.innerText = "✅ List Copied";
    setTimeout(() => btnCopy.innerText = "📋 Copy Keywords", 1500);
});
