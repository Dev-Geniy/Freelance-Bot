if (window.innerWidth > 768) {
    particlesJS('network', {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: ['#3b82f6', '#8b5cf6'] },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 2.5, random: true },
            line_linked: { enable: true, distance: 120, color: '#3b82f6', opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: 'none', random: true, straight: false, out_mode: 'out' }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
            modes: { grab: { distance: 150, line_linked: { opacity: 0.6 } }, push: { particles_nb: 3 } }
        },
        retina_detect: true
    });
}

const taskInput = document.getElementById('taskInput');
const sendBtn = document.getElementById('sendBtn');
const loader = document.getElementById('loader');
const responseModal = document.getElementById('responseModal');
const responseText = document.getElementById('responseText');
const copyBtn = document.getElementById('copyBtn');
const newRequestBtn = document.getElementById('newRequestBtn');
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const themeToggle = document.getElementById('theme-toggle');
const charCount = document.getElementById('charCount');

const responseHistory = JSON.parse(localStorage.getItem('responseHistory')) || [];

async function makeApiRequest(prompt, retries = 3, delay = 2000) {
    const apiUrl = 'https://text.pollinations.ai/openai';
    const body = {
        model: 'mistral',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.status === 429) {
                if (attempt === retries) {
                    throw new Error('Ліміт запитів вичерпано. Зачекай пару хвилин і спробуй знову.');
                }
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP помилка: ${response.status}`);
            }

            const result = await response.json();
            let botResponse = 'Не вдалося створити відгук. Спробуй знову.';
            if (result && result.choices && result.choices[0] && result.choices[0].message) {
                botResponse = result.choices[0].message.content.trim();
            } else if (typeof result === 'string') {
                botResponse = result.trim();
            }

            return botResponse;
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
        }
    }
}

sendBtn.addEventListener('click', async () => {
    const taskText = taskInput.value.trim();
    if (!taskText) {
        alert('Встав опис завдання!');
        return;
    }

    loader.style.display = 'block';
    sendBtn.disabled = true;

    const prompt = `Ти — фрилансер Євгеній. Напиши короткий (3-4 речення), неформальний і живий відгук на завдання з фриланс-біржі українською. Відгук має бути переконливим, показувати твій досвід, звучати по-людськи, без шаблонного ІІ-стилю. Жодних зайвих слів! Завдання: "${taskText}"`;

    try {
        const botResponse = await makeApiRequest(prompt);
        responseHistory.push({ task: taskText, response: botResponse, timestamp: new Date().toISOString() });
        localStorage.setItem('responseHistory', JSON.stringify(responseHistory));

        responseText.textContent = botResponse;
        responseModal.style.display = 'flex';
        taskInput.value = '';
        charCount.textContent = '0/500';
    } catch (error) {
        responseText.textContent = `Помилка: ${error.message}. Спробуй ще раз.`;
        responseModal.style.display = 'flex';
    } finally {
        loader.style.display = 'none';
        sendBtn.disabled = false;
    }
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(responseText.textContent).then(() => {
        copyBtn.textContent = 'Скопійовано!';
        setTimeout(() => (copyBtn.textContent = 'Копіювати'), 2000);
    });
});

newRequestBtn.addEventListener('click', () => {
    responseModal.style.display = 'none';
    responseText.textContent = '';
    taskInput.focus();
});

historyBtn.addEventListener('click', () => {
    historyList.innerHTML = responseHistory.length ? 
        responseHistory.map(item => `
            <div>
                <h3>Завдання (${new Date(item.timestamp).toLocaleString('uk')}):</h3>
                <p>${item.task}</p>
                <h3>Відгук:</h3>
                <p>${item.response}</p>
            </div>
        `).join('') : 
        '<p>Історія порожня.</p>';
    historyModal.style.display = 'flex';
});

closeHistoryBtn.addEventListener('click', () => {
    historyModal.style.display = 'none';
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Очистити всю історію відгуків?')) {
        responseHistory.length = 0;
        localStorage.removeItem('responseHistory');
        historyList.innerHTML = '<p>Історія порожня.</p>';
    }
});

responseModal.addEventListener('click', (e) => {
    if (e.target === responseModal) {
        responseModal.style.display = 'none';
    }
});

historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (responseModal.style.display === 'flex') responseModal.style.display = 'none';
        if (historyModal.style.display === 'flex') historyModal.style.display = 'none';
    }
});

themeToggle.addEventListener('change', () => {
    document.documentElement.setAttribute('data-theme', themeToggle.checked ? 'light' : 'dark');
    localStorage.setItem('theme', themeToggle.checked ? 'light' : 'dark');
});

taskInput.addEventListener('input', () => {
    const length = taskInput.value.length;
    charCount.textContent = `${length}/500`;
    if (length > 500) {
        taskInput.value = taskInput.value.slice(0, 500);
        charCount.textContent = '500/500';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'light';
});
