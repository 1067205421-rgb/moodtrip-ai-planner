const MEMORY_STORAGE_KEY = 'moodtrip-memories-v1';
const MEMORY_TODAY = new Date();
MEMORY_TODAY.setHours(0, 0, 0, 0);

const tagRules = [
  { tag: '散步', keywords: ['散步', '公园', '西湖', '运河', '徒步', 'citywalk', '走走'] },
  { tag: '逛展', keywords: ['展览', '逛展', '博物馆', '美术馆', '艺术馆'] },
  { tag: '看电影', keywords: ['电影', '影院', '影城'] },
  { tag: '拍照', keywords: ['拍照', '写真', '出片', '相机'] },
  { tag: '手作', keywords: ['手作', '陶艺', 'diy', '烘焙', '做蛋糕'] },
  { tag: '运动', keywords: ['运动', '骑行', '爬山', '羽毛球', '攀岩', '滑冰'] },
  { tag: '桌游', keywords: ['桌游', '剧本杀', '密室'] },
  { tag: '咖啡', keywords: ['咖啡', 'brunch', '下午茶'] },
  { tag: '甜品', keywords: ['甜品', '蛋糕', '冰淇淋', '面包'] },
  { tag: '日料', keywords: ['日料', '寿司', '烧鸟'] },
  { tag: '火锅', keywords: ['火锅', '串串', '麻辣烫'] },
  { tag: '杭帮菜', keywords: ['杭帮菜', '杭州菜', '本帮菜'] },
  { tag: '安静', keywords: ['安静', '清净', '人少', '慢慢'] },
  { tag: '浪漫', keywords: ['浪漫', '氛围', '夜景', '日落', '仪式感'] },
  { tag: '新鲜', keywords: ['新鲜', '第一次', '惊喜', '特别', '新奇'] },
  { tag: '户外', keywords: ['户外', '露营', '草地', '湖边', '山里'] },
  { tag: '室内', keywords: ['室内', '商场', '雨天'] },
];

const avoidRules = [
  { tag: '人太多', keywords: ['人太多', '拥挤', '排队久', '排队太久'] },
  { tag: '距离太远', keywords: ['太远', '路上太久', '通勤久'] },
  { tag: '体力负担', keywords: ['太累', '走不动', '体力', '累坏'] },
  { tag: '环境太吵', keywords: ['太吵', '嘈杂', '吵闹'] },
  { tag: '性价比低', keywords: ['太贵', '不值', '性价比低'] },
];

const recommendationPool = [
  {
    title: '运河边散步 + 小型艺术展',
    tags: ['散步', '逛展', '安静', '拍照'],
    detail: '约 4 小时 · 人均 ¥120–220 · 适合周末下午',
  },
  {
    title: '良渚公园慢游 + 氛围咖啡馆',
    tags: ['散步', '户外', '咖啡', '拍照'],
    detail: '约 5 小时 · 人均 ¥100–180 · 适合晴天',
  },
  {
    title: '陶艺手作 + 日料晚餐',
    tags: ['手作', '日料', '室内', '新鲜'],
    detail: '约 4 小时 · 人均 ¥220–350 · 下雨也不怕',
  },
  {
    title: '独立影院 + 深夜甜品',
    tags: ['看电影', '甜品', '室内', '浪漫'],
    detail: '约 4 小时 · 人均 ¥120–200 · 适合工作日晚上',
  },
  {
    title: '西溪湿地轻徒步 + 杭帮菜',
    tags: ['散步', '户外', '杭帮菜', '安静'],
    detail: '约 6 小时 · 人均 ¥160–260 · 适合凉爽天气',
  },
  {
    title: '双人烘焙课 + 成品拍照',
    tags: ['手作', '甜品', '拍照', '室内'],
    detail: '约 3 小时 · 人均 ¥180–280 · 适合朋友或搭档',
  },
  {
    title: '桌游店组队 + 热乎乎火锅',
    tags: ['桌游', '火锅', '室内', '新鲜'],
    detail: '约 5 小时 · 人均 ¥150–250 · 适合想热闹一点',
  },
  {
    title: '湖边骑行 + 日落野餐',
    tags: ['运动', '户外', '浪漫', '拍照'],
    detail: '约 4 小时 · 人均 ¥80–160 · 适合晴朗傍晚',
  },
  {
    title: '博物馆漫游 + 安静咖啡馆',
    tags: ['逛展', '咖啡', '室内', '安静'],
    detail: '约 4 小时 · 人均 ¥80–150 · 适合雨天',
  },
];

const memoryForm = document.getElementById('memoryForm');
const memoryDate = document.getElementById('memoryDate');
const memoryList = document.getElementById('memoryList');
const memoryCount = document.getElementById('memoryCount');
const memoryFeedback = document.getElementById('memoryFeedback');
const preferenceSummary = document.getElementById('preferenceSummary');
const recommendationGrid = document.getElementById('recommendationGrid');
const recommendationIntro = document.getElementById('recommendationIntro');
const refreshRecommendations = document.getElementById('refreshRecommendations');

let memories = loadMemories();
let recommendationOffset = 0;

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const [year, month, day] = value.split('-');
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function loadMemories() {
  try {
    const saved = JSON.parse(localStorage.getItem(MEMORY_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error('读取出游足迹失败', error);
    return [];
  }
}

function persistMemories() {
  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
}

function extractMatches(text, rules) {
  const normalized = text.toLowerCase();
  return rules
    .filter((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)))
    .map((rule) => rule.tag);
}

function getAutomaticTags(entry) {
  const text = `${entry.place} ${entry.activity} ${entry.food} ${entry.note}`;
  const tags = extractMatches(text, tagRules);
  if (entry.rating >= 4) tags.push('高满意度');
  if (entry.repeat) tags.push('愿意再来');
  return [...new Set(tags)].slice(0, 7);
}

function getAvoidTags(entry) {
  const tags = extractMatches(entry.note, avoidRules);
  if (entry.rating <= 2) tags.push('低满意度');
  return [...new Set(tags)];
}

const discoverableTags = new Set([
  '散步', '户外', '运动', '拍照', '咖啡', '手作', '日料', '甜品', '逛展',
  '看电影', '火锅', '杭帮菜', '桌游', '室内', '浪漫', '安静', '新鲜',
]);

function createTag(text, variant = '') {
  const cleanTag = text.replace(/^避开：/, '');
  const isDiscoverable = !text.startsWith('避开：') && discoverableTags.has(cleanTag);
  const tag = document.createElement(isDiscoverable ? 'button' : 'span');
  tag.className = `tag-pill${isDiscoverable ? ' tag-pill-clickable' : ''}${variant ? ` ${variant}` : ''}`;
  tag.textContent = text;
  if (isDiscoverable) {
    tag.type = 'button';
    tag.dataset.discoveryTag = cleanTag;
    tag.title = `查看“${cleanTag}”相关推荐`;
  }
  return tag;
}

function getPreferenceProfile() {
  const weights = new Map();
  const avoidWeights = new Map();

  memories.forEach((memory) => {
    const positiveWeight = memory.rating >= 4 ? memory.rating + (memory.repeat ? 2 : 0) : 1;
    memory.tags.forEach((tag) => {
      if (!['高满意度', '愿意再来'].includes(tag)) {
        weights.set(tag, (weights.get(tag) || 0) + positiveWeight);
      }
    });
    memory.avoidTags.forEach((tag) => {
      avoidWeights.set(tag, (avoidWeights.get(tag) || 0) + 3);
    });
  });

  const positive = [...weights.entries()].sort((a, b) => b[1] - a[1]);
  const avoid = [...avoidWeights.entries()].sort((a, b) => b[1] - a[1]);
  return { positive, avoid };
}

function renderPreferenceSummary() {
  preferenceSummary.replaceChildren();
  if (!memories.length) {
    preferenceSummary.textContent = '保存第一条记录后，这里会出现自动识别的偏好标签。';
    return;
  }

  const profile = getPreferenceProfile();
  const lead = document.createElement('strong');
  lead.textContent = memories.length < 3 ? '偏好正在形成：' : '高频偏好：';
  preferenceSummary.appendChild(lead);

  const description = document.createTextNode(
    profile.positive.length
      ? ` 根据 ${memories.length} 次记录，已经找到一些共同偏好。`
      : ' 再多记录几次，推荐会更准确。',
  );
  preferenceSummary.appendChild(description);

  if (profile.positive.length) {
    const tags = document.createElement('div');
    tags.className = 'preference-tags';
    profile.positive.slice(0, 6).forEach(([tag]) => tags.appendChild(createTag(tag)));
    preferenceSummary.appendChild(tags);
  }
}

function createMemoryCard(memory) {
  const card = document.createElement('article');
  card.className = 'memory-card';

  const top = document.createElement('div');
  top.className = 'memory-card-top';
  const titleWrap = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = `${memory.activity} · ${memory.place}`;
  const meta = document.createElement('p');
  meta.className = 'memory-card-meta';
  meta.textContent = `${formatDisplayDate(memory.date)}${memory.food ? ` · ${memory.food}` : ''}`;
  titleWrap.append(title, meta);

  const rating = document.createElement('span');
  rating.className = 'rating-badge';
  rating.textContent = `${'★'.repeat(memory.rating)}${'☆'.repeat(5 - memory.rating)}`;
  top.append(titleWrap, rating);
  card.appendChild(top);

  if (memory.note) {
    const note = document.createElement('p');
    note.className = 'memory-card-note';
    note.textContent = memory.note;
    card.appendChild(note);
  }

  const tags = document.createElement('div');
  tags.className = 'memory-tags';
  memory.tags.forEach((tag) => tags.appendChild(createTag(tag)));
  memory.avoidTags.forEach((tag) => tags.appendChild(createTag(`避开：${tag}`)));
  card.appendChild(tags);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-memory';
  deleteButton.textContent = '删除';
  deleteButton.addEventListener('click', () => {
    if (!window.confirm('要删除这条出游回忆吗？')) return;
    memories = memories.filter((item) => item.id !== memory.id);
    persistMemories();
    renderAllMemoryFeatures();
  });
  card.appendChild(deleteButton);
  return card;
}

function renderMemories() {
  memoryList.replaceChildren();
  memoryCount.textContent = `${memories.length} 次记录`;
  if (!memories.length) {
    const empty = document.createElement('div');
    empty.className = 'memory-empty';
    empty.textContent = '还没有记录。保存一次出游后，系统会自动整理标签并生成下一次建议。';
    memoryList.appendChild(empty);
    return;
  }

  [...memories]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((memory) => memoryList.appendChild(createMemoryCard(memory)));
}

function getMoodScore(plan) {
  const moodTags = {
    relaxed: ['散步', '咖啡', '安静', '甜品'],
    outdoor: ['户外', '散步', '运动', '拍照'],
    tired: ['室内', '咖啡', '甜品', '看电影'],
    food: ['日料', '火锅', '杭帮菜', '甜品'],
    quiet: ['安静', '咖啡', '逛展', '室内'],
    novel: ['新鲜', '手作', '桌游', '运动'],
  };
  const preferred = moodTags[window.dailyMood] || [];
  return plan.tags.filter((tag) => preferred.includes(tag)).length * 5;
}

function scoreRecommendation(plan, profile, recentTags) {
  const preferenceScore = plan.tags.reduce((score, tag) => {
    const match = profile.positive.find(([profileTag]) => profileTag === tag);
    return score + (match ? match[1] * 3 : 0);
  }, 0);
  const repeatPenalty = plan.tags.filter((tag) => recentTags.includes(tag)).length * 2;
  const noveltyScore = plan.tags.filter((tag) => !profile.positive.some(([profileTag]) => profileTag === tag)).length * 2;
  return preferenceScore + noveltyScore + getMoodScore(plan) - repeatPenalty;
}

function chooseRecommendations() {
  const profile = getPreferenceProfile();
  const recentTags = memories
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2)
    .flatMap((memory) => memory.tags);

  const ranked = recommendationPool
    .map((plan) => ({ ...plan, score: scoreRecommendation(plan, profile, recentTags) }))
    .sort((a, b) => b.score - a.score);

  const rotated = ranked.map((_, index) => ranked[(index + recommendationOffset) % ranked.length]);
  if (!memories.length) return rotated.slice(0, 3);

  const safe = rotated[0];
  const explore = rotated.find((plan) => plan.title !== safe.title
    && plan.tags.some((tag) => profile.positive.some(([profileTag]) => profileTag === tag))) || rotated[1];
  const surprise = rotated.find((plan) => ![safe.title, explore.title].includes(plan.title)
    && plan.tags.filter((tag) => profile.positive.some(([profileTag]) => profileTag === tag)).length <= 1)
    || rotated.find((plan) => ![safe.title, explore.title].includes(plan.title));
  return [safe, explore, surprise];
}

function getRecommendationReason(plan, index) {
  if (!memories.length) {
    const starterReasons = [
      '先从轻松、好执行的组合开始，适合建立第一条共同偏好记录。',
      '保留熟悉的偏好，同时加入一个新的体验变量。',
      '提供一个探索性选项，用于发现此前未被验证的偏好。',
    ];
    return starterReasons[index];
  }

  const profile = getPreferenceProfile();
  const matched = plan.tags.filter((tag) => profile.positive.some(([profileTag]) => profileTag === tag));
  if (index === 0 && matched.length) {
    return `历史记录对“${matched.slice(0, 2).join('、')}”的反馈较好，该方案延续了高权重偏好。`;
  }
  if (index === 1 && matched.length) {
    return `保留高频偏好“${matched[0]}”，同时更换场景以降低近期重复度。`;
  }
  return '这次故意多放一点新鲜感，同时避开明显低评分的体验。';
}

function createRecommendationCard(plan, index) {
  const card = document.createElement('article');
  card.className = 'recommendation-card';
  const labels = ['稳妥推荐', '相似探索', '惊喜选项'];

  const type = document.createElement('span');
  type.className = 'recommendation-type';
  type.textContent = labels[index];
  const title = document.createElement('h3');
  title.textContent = plan.title;
  const tags = document.createElement('div');
  tags.className = 'recommendation-tags';
  plan.tags.forEach((tag) => tags.appendChild(createTag(tag)));
  const reason = document.createElement('p');
  reason.className = 'recommendation-reason';
  reason.textContent = getRecommendationReason(plan, index);
  const detail = document.createElement('p');
  detail.className = 'recommendation-detail';
  detail.textContent = plan.detail;

  card.append(type, title, tags, reason, detail);
  return card;
}

function renderRecommendations() {
  recommendationGrid.replaceChildren();
  const moodNote = window.dailyMoodLabel ? `，并参考了今天“${window.dailyMoodLabel}”的状态` : '';
  recommendationIntro.textContent = memories.length
    ? `已经结合 ${memories.length} 次出游的高评分标签、近期重复度和新鲜感${moodNote}，生成三个方向。`
    : `先从三种低门槛灵感开始${moodNote}；记录第一次真实出游后，推荐会更准确。`;
  chooseRecommendations().forEach((plan, index) => {
    recommendationGrid.appendChild(createRecommendationCard(plan, index));
  });
}

function renderAllMemoryFeatures() {
  renderMemories();
  renderPreferenceSummary();
  renderRecommendations();
}

memoryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(memoryForm);
  const entry = {
    id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    date: String(formData.get('date')),
    place: String(formData.get('place')).trim(),
    activity: String(formData.get('activity')).trim(),
    food: String(formData.get('food')).trim(),
    rating: Number(formData.get('rating')),
    note: String(formData.get('note')).trim(),
    repeat: formData.get('repeat') === 'on',
  };

  if (!entry.date || !entry.place || !entry.activity) {
    memoryFeedback.textContent = '还差日期、地点或做了什么，补充一下就能保存啦。';
    return;
  }

  if (new Date(`${entry.date}T00:00:00`) > MEMORY_TODAY) {
    memoryFeedback.textContent = '足迹日期不能晚于今天；未来的安排可以放在“下一次出游”里。';
    return;
  }

  entry.tags = getAutomaticTags(entry);
  entry.avoidTags = getAvoidTags(entry);
  memories.unshift(entry);
  persistMemories();
  memoryForm.reset();
  memoryDate.value = formatInputDate(MEMORY_TODAY);
  document.getElementById('memoryRating').value = '5';
  document.getElementById('memoryRepeat').checked = true;
  memoryFeedback.textContent = entry.tags.length
    ? `保存好啦，自动识别了：${entry.tags.join('、')}。`
    : '保存好啦！再多写一点感受，下次就能识别出更准确的标签。';
  renderAllMemoryFeatures();
});

refreshRecommendations.addEventListener('click', () => {
  recommendationOffset = (recommendationOffset + 1) % recommendationPool.length;
  renderRecommendations();
});

memoryDate.max = formatInputDate(MEMORY_TODAY);
memoryDate.value = formatInputDate(MEMORY_TODAY);
renderAllMemoryFeatures();
