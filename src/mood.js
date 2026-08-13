const MOOD_STORAGE_KEY = 'moodtrip-daily-state-v1';
const moodOptions = document.getElementById('moodOptions');
const moodFeedback = document.getElementById('moodFeedback');

function getMoodDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadDailyMood() {
  try {
    const saved = JSON.parse(localStorage.getItem(MOOD_STORAGE_KEY) || 'null');
    return saved?.date === getMoodDateKey() ? saved : null;
  } catch (error) {
    console.error('读取每日心情失败', error);
    return null;
  }
}

function renderDailyMood(saved) {
  window.dailyMood = saved?.mood || '';
  window.dailyMoodLabel = saved?.label || '';
  moodOptions.querySelectorAll('[data-mood]').forEach((button) => {
    const active = button.dataset.mood === window.dailyMood;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  moodFeedback.textContent = saved
    ? `今日状态：${saved.label}。推荐已按这个状态调整。`
    : '尚未选择今日状态';
}

moodOptions.addEventListener('click', (event) => {
  const button = event.target.closest('[data-mood]');
  if (!button) return;
  const saved = {
    date: getMoodDateKey(),
    mood: button.dataset.mood,
    label: button.dataset.label,
  };
  localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(saved));
  renderDailyMood(saved);
  if (typeof window.renderRecommendations === 'function') window.renderRecommendations();
  window.dispatchEvent(new CustomEvent('daily-mood-change', { detail: saved }));
});

const initialMood = loadDailyMood();
renderDailyMood(initialMood);
if (initialMood && typeof window.renderRecommendations === 'function') window.renderRecommendations();
