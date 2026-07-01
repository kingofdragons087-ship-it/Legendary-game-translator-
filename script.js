 // إخفاء الشعار بعد 2.5 ثانية
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        document.getElementById('intro').classList.add('hide');
    }, 2500);
});


function note(msg, type) {
    const el = document.getElementById('note');
    el.textContent = msg; el.className = type; el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

function getActive() {
    const m = document.getElementById('manualText');
    const r = document.getElementById('translatedText');
    return (document.getElementById('outBox').style.display === 'block' && r.value) ? r : m;
}

function copyText() { const e = getActive(); if(e.value) { e.select(); document.execCommand('copy'); note('✅ تم النسخ', 'success'); } }
function clearText() { getActive().value = ''; document.getElementById('outBox').style.display = 'none'; note('🗑️ تم المسح', 'info'); }
function reverseText() { const e = getActive(); if(e.value) e.value = e.value.split('').reverse().join(''); }

async function translateContent() {
    const isHybrid = document.querySelector('input[name="mode"]:checked').value === 'hybrid';
    const file = document.getElementById('fileInput').files[0];
    const manual = document.getElementById('manualText').value.trim();
    let text = '', name = '';

    if (file) { text = await file.text(); name = file.name; }
    else if (manual) { text = manual; name = 'translated.txt'; }
    else { note('يرجى إدخال نص أو رفع ملف!', 'error'); return; }

    if (isHybrid) note('⚠️ هجين يستخدم Cohere (حدود يومية)', 'info');
    else note('⏳ جاري الترجمة...', 'loading');

    document.getElementById('outBox').style.display = 'none';

    try {
        let result = await callGroq(text);
        if (isHybrid) result = await callCohere(result);
        document.getElementById('translatedText').value = result;
        document.getElementById('outBox').style.display = 'block';
        fileName = name;
        note('✅ تمت الترجمة!', 'success');
    } catch(e) { note('❌ خطأ: ' + e.message, 'error'); }
}

async function callGroq(t) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: 'ترجم إلى العربية بدقة' }, { role: 'user', content: t }],
            temperature: 0.1
        })
    });
    if(!r.ok) throw new Error('Groq فشل');
    return (await r.json()).choices[0].message.content;
}

async function callCohere(t) {
    const r = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${COHERE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'command-r-plus',
            prompt: `أنت مدقق لغوي، أعد صياغة هذا النص بلغة عربية سليمة:\n${t}`,
            max_tokens: 4000, temperature: 0.1
        })
    });
    if(!r.ok) return t;
    return (await r.json()).generations[0].text.trim();
}

function downloadTranslated() {
    const t = document.getElementById('translatedText').value;
    if(!t) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' }));
    a.download = `translated_${fileName}`;
    a.click();
}
