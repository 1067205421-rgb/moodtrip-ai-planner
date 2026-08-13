const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const DEFAULT_DATE = {
  year: TODAY.getFullYear(),
  month: TODAY.getMonth() + 1,
  day: TODAY.getDate(),
};

const DEFAULT_CENTER = [120.1551, 30.2741];
const DEFAULT_PLACE_TEXT = '杭州市';
window.travelDiscoveryCenter = [...DEFAULT_CENTER];

const PLACE_SEARCH_PRESETS = [
  { keywords: ['良渚文化村', '良渚'], name: '杭州市余杭区良渚文化村', center: [120.0478, 30.3712] },
  { keywords: ['小河直街', '运河'], name: '杭州市拱墅区小河直街历史文化街区', center: [120.1418, 30.3125] },
  { keywords: ['西湖文化广场'], name: '杭州市拱墅区西湖文化广场', center: [120.1641, 30.2798] },
  { keywords: ['西溪湿地', '西溪国家湿地公园'], name: '杭州市西湖区西溪国家湿地公园', center: [120.0623, 30.2693] },
  { keywords: ['湖滨银泰', 'in77', '湖滨'], name: '杭州市上城区湖滨银泰 in77', center: [120.1645, 30.2554] },
];

const foodOptions = [
  {
    id: 'hotpot',
    icon: '🍲',
    title: '热乎乎火锅',
    desc: '适合边吃边聊，气氛又热闹又放松。',
  },
  {
    id: 'japanese',
    icon: '🍣',
    title: '寿司 / 日料',
    desc: '节奏轻松、选择丰富，适合慢慢用餐。',
  },
  {
    id: 'brunch',
    icon: '🥞',
    title: 'brunch / 咖啡馆',
    desc: '面包、咖啡和甜品，适合轻松的下午安排。',
  },
  {
    id: 'dessert',
    icon: '🍰',
    title: '先吃甜品也可以',
    desc: '蛋糕和冰淇淋也可以成为本次计划的重点。',
  },
];

const state = {
  year: DEFAULT_DATE.year,
  month: DEFAULT_DATE.month,
  day: DEFAULT_DATE.day,
  hour: '',
  minute: '',
  place: DEFAULT_PLACE_TEXT,
  placeShort: DEFAULT_PLACE_TEXT,
  placeHint: '你可以拖动地图、放大缩小，然后点击更准确的位置。',
  placeCoords: null,
  foodPreset: null,
  foodCustom: '',
};

const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const daySelect = document.getElementById('daySelect');
const hourSelect = document.getElementById('hourSelect');
const minuteSelect = document.getElementById('minuteSelect');
const foodInput = document.getElementById('foodInput');
const summaryTime = document.getElementById('summaryTime');
const summaryPlace = document.getElementById('summaryPlace');
const summaryFood = document.getElementById('summaryFood');
const selectedPlaceText = document.getElementById('selectedPlaceText');
const selectedPlaceHint = document.getElementById('selectedPlaceHint');
const feedbackText = document.getElementById('feedbackText');
const meterFill = document.getElementById('meterFill');
const meterText = document.getElementById('meterText');
const finalMessage = document.getElementById('finalMessage');
const copyPlanBtn = document.getElementById('copyPlanBtn');
const sharePlanBtn = document.getElementById('sharePlanBtn');
const resetMapBtn = document.getElementById('resetMapBtn');
const mapFallbackText = document.getElementById('mapFallbackText');
const todayHelper = document.getElementById('todayHelper');
const placeSearchForm = document.getElementById('placeSearchForm');
const placeSearchInput = document.getElementById('placeSearchInput');
const placeSearchStatus = document.getElementById('placeSearchStatus');
const foodContainer = document.querySelector('[data-choice-group="food"]');

let mapInstance = null;
let mapMarker = null;
let mapGeocoder = null;

function createOptionElement(value, label, selected = false, disabled = false) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  option.selected = selected;
  option.disabled = disabled;
  return option;
}

function populateYearOptions() {
  yearSelect.replaceChildren();
  for (let year = DEFAULT_DATE.year; year <= DEFAULT_DATE.year + 2; year += 1) {
    yearSelect.appendChild(createOptionElement(String(year), `${year} 年`, year === state.year));
  }
}

function populateMonthOptions() {
  monthSelect.replaceChildren();
  for (let month = 1; month <= 12; month += 1) {
    const isPastMonth = state.year === TODAY.getFullYear() && month < TODAY.getMonth() + 1;
    monthSelect.appendChild(createOptionElement(String(month), `${month} 月`, month === state.month, isPastMonth));
  }
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function populateDayOptions() {
  const dayCount = getDaysInMonth(state.year, state.month);
  if (state.day > dayCount) {
    state.day = dayCount;
  }

  daySelect.replaceChildren();
  for (let day = 1; day <= dayCount; day += 1) {
    const isPastDay = state.year === TODAY.getFullYear()
      && state.month === TODAY.getMonth() + 1
      && day < TODAY.getDate();
    daySelect.appendChild(createOptionElement(String(day), `${day} 日`, day === state.day, isPastDay));
  }
}

function populateHourOptions() {
  hourSelect.replaceChildren();
  hourSelect.appendChild(createOptionElement('', '选择小时', state.hour === '', true));
  for (let hour = 0; hour <= 23; hour += 1) {
    const value = String(hour).padStart(2, '0');
    hourSelect.appendChild(createOptionElement(value, `${value} 时`, state.hour === value));
  }
}

function populateMinuteOptions() {
  const minuteValues = ['00', '15', '30', '45'];
  minuteSelect.replaceChildren();
  minuteSelect.appendChild(createOptionElement('', '选择分钟', state.minute === '', true));
  minuteValues.forEach((minute) => {
    minuteSelect.appendChild(createOptionElement(minute, `${minute} 分`, state.minute === minute));
  });
}

function formatTimeText() {
  const dateText = `${state.year} 年 ${state.month} 月 ${state.day} 日`;
  if (!state.hour || !state.minute) {
    return `${dateText} · 待选择时分`;
  }
  return `${dateText} ${state.hour}:${state.minute}`;
}

function getPresetFood() {
  return foodOptions.find((item) => item.id === state.foodPreset) || null;
}

function formatFoodText() {
  const presetFood = getPresetFood();
  const customFood = state.foodCustom.trim();

  if (presetFood && customFood) {
    return `${presetFood.title}；另外还想吃：${customFood}`;
  }
  if (customFood) {
    return customFood;
  }
  if (presetFood) {
    return presetFood.title;
  }
  return '尚未选择餐饮偏好';
}

function buildPlanText() {
  return `出游方案\n时间：${formatTimeText()}\n地点：${state.place}\n餐饮偏好：${formatFoodText()}\n\n方案已整理完成，可按需调整。`;
}

function updateMeter() {
  let score = 0;
  if (state.hour && state.minute) score += 34;
  if (state.place) score += 33;
  if (state.foodPreset || state.foodCustom.trim()) score += 33;

  meterFill.style.width = `${Math.max(score, 12)}%`;

  if (score < 40) {
    meterText.textContent = '方案还没选完，继续补充';
  } else if (score < 100) {
    meterText.textContent = '方案基本成形，再补一项即可';
  } else {
    meterText.textContent = '方案已完成，可以分享';
  }
}

function updateSummary() {
  summaryTime.textContent = formatTimeText();
  summaryPlace.textContent = state.place;
  summaryFood.textContent = formatFoodText();
  selectedPlaceText.textContent = state.place;
  selectedPlaceHint.textContent = state.placeHint;

  updateMeter();

  if (state.hour && state.minute && (state.foodPreset || state.foodCustom.trim())) {
    finalMessage.textContent = `当前方案：${formatTimeText()} · ${state.placeShort} · ${formatFoodText()}。`;
  } else {
    finalMessage.textContent = '选完后，这里会整理成一份可直接分享的出游方案。';
  }
}

function createFoodCard(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice-card';
  button.dataset.id = item.id;
  button.innerHTML = `
    <span class="choice-icon">${item.icon}</span>
    <span class="choice-title">${item.title}</span>
    <span class="choice-desc">${item.desc}</span>
  `;

  button.addEventListener('click', () => {
    state.foodPreset = item.id;
    syncFoodActiveStates();
    updateSummary();
  });

  return button;
}

function renderFoodOptions() {
  foodContainer.innerHTML = '';
  foodOptions.forEach((item) => {
    foodContainer.appendChild(createFoodCard(item));
  });
}

function syncFoodActiveStates() {
  document.querySelectorAll('.choice-card').forEach((button) => {
    const isActive = button.dataset.id === state.foodPreset;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function bindSelectEvents() {
  yearSelect.addEventListener('change', (event) => {
    state.year = Number(event.target.value);
    if (state.year === TODAY.getFullYear() && state.month < TODAY.getMonth() + 1) {
      state.month = TODAY.getMonth() + 1;
      state.day = TODAY.getDate();
    }
    populateMonthOptions();
    populateDayOptions();
    updateSummary();
  });

  monthSelect.addEventListener('change', (event) => {
    state.month = Number(event.target.value);
    if (state.year === TODAY.getFullYear() && state.month === TODAY.getMonth() + 1) {
      state.day = Math.max(state.day, TODAY.getDate());
    }
    populateDayOptions();
    updateSummary();
  });

  daySelect.addEventListener('change', (event) => {
    state.day = Number(event.target.value);
    updateSummary();
  });

  hourSelect.addEventListener('change', (event) => {
    state.hour = event.target.value;
    updateSummary();
  });

  minuteSelect.addEventListener('change', (event) => {
    state.minute = event.target.value;
    updateSummary();
  });
}

function initializeSelectors() {
  populateYearOptions();
  populateMonthOptions();
  populateDayOptions();
  populateHourOptions();
  populateMinuteOptions();
  bindSelectEvents();
  todayHelper.textContent = `今天是 ${DEFAULT_DATE.year} 年 ${DEFAULT_DATE.month} 月 ${DEFAULT_DATE.day} 日，日期已默认选中今天，过去的日期不可选择。`;
}

function setPlaceSelection(placeText, hintText, lnglat = null) {
  state.place = placeText;
  state.placeShort = placeText.split('·')[0].trim();
  state.placeHint = hintText;
  state.placeCoords = lnglat;
  window.travelSelectedPlaceName = state.placeShort;
  window.travelDiscoveryCenter = lnglat
    ? [Number(lnglat.lng), Number(lnglat.lat)]
    : [...DEFAULT_CENTER];
  window.dispatchEvent(new CustomEvent('travel-place-change', {
    detail: { center: window.travelDiscoveryCenter, place: state.placeShort },
  }));
  updateSummary();
}

function resetPlaceSelection() {
  setPlaceSelection(DEFAULT_PLACE_TEXT, '你可以拖动地图、放大缩小，然后点击更准确的位置。');
  placeSearchInput.value = '';
  placeSearchStatus.textContent = '';
  if (mapInstance) {
    mapInstance.setZoomAndCenter(11.5, DEFAULT_CENTER);
  }
  if (mapMarker) {
    mapMarker.setPosition(DEFAULT_CENTER);
  }
}

function updateMarker(AMap, lnglat) {
  if (!mapMarker) {
    mapMarker = new AMap.Marker({
      position: lnglat,
      content: '<div class="map-pin"><span>📍</span></div>',
      offset: new AMap.Pixel(-18, -36),
    });
    mapInstance.add(mapMarker);
  } else {
    mapMarker.setPosition(lnglat);
  }
}

function handleMapClick(AMap, lnglat) {
  updateMarker(AMap, lnglat);
  mapInstance.setCenter(lnglat);

  const fallbackText = `杭州市 · ${lnglat.lng.toFixed(4)}, ${lnglat.lat.toFixed(4)}`;
  const fallbackHint = '已记录地图坐标；如需更换位置，可再次点击地图。';

  if (mapGeocoder) {
    mapGeocoder.getAddress(lnglat, (status, result) => {
      if (status === 'complete' && result.regeocode) {
        const address = result.regeocode.formattedAddress || fallbackText;
        setPlaceSelection(address, fallbackHint, lnglat);
      } else {
        setPlaceSelection(fallbackText, fallbackHint, lnglat);
      }
    });
    return;
  }

  setPlaceSelection(fallbackText, fallbackHint, lnglat);
}

function applySearchLocation(name, location, keyword) {
  if (mapInstance && window.AMap) {
    updateMarker(window.AMap, location);
    mapInstance.setZoomAndCenter(15, location);
  }
  setPlaceSelection(name, `已通过演示地点定位到“${keyword}”。`, {
    lng: Number(location[0] ?? location.lng),
    lat: Number(location[1] ?? location.lat),
  });
  placeSearchStatus.textContent = `已定位：${name}`;
}

function showExternalSearchFallback(keyword) {
  placeSearchStatus.replaceChildren();
  placeSearchStatus.append('站内暂时无法解析这个地点，');
  const link = document.createElement('a');
  link.href = `https://www.amap.com/search?query=${encodeURIComponent(`杭州 ${keyword}`)}&city=330100`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '去高德地图搜索并确认位置 →';
  placeSearchStatus.appendChild(link);
}

function searchPlaceByKeyword(keyword) {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) {
    placeSearchStatus.textContent = '先输入一个商圈、景点或具体地址吧。';
    placeSearchInput.focus();
    return;
  }
  const preset = PLACE_SEARCH_PRESETS.find((item) => item.keywords.some((term) => cleanKeyword.toLowerCase().includes(term.toLowerCase())));
  if (preset) {
    applySearchLocation(preset.name, preset.center, cleanKeyword);
    return;
  }

  if (!mapInstance || !window.AMap) {
    showExternalSearchFallback(cleanKeyword);
    return;
  }

  if (!mapGeocoder) {
    showExternalSearchFallback(cleanKeyword);
    return;
  }

  let finished = false;
  placeSearchStatus.textContent = `正在搜索“${cleanKeyword}”…`;
  const timeoutId = window.setTimeout(() => {
    if (finished) return;
    finished = true;
    showExternalSearchFallback(cleanKeyword);
  }, 5000);

  mapGeocoder.getLocation(`杭州市 ${cleanKeyword}`, (status, result) => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timeoutId);
    const geocode = status === 'complete' ? result.geocodes?.[0] : null;
    if (!geocode?.location) {
      showExternalSearchFallback(cleanKeyword);
      return;
    }

    const location = geocode.location;
    const address = geocode.formattedAddress || cleanKeyword;
    applySearchLocation(address, location, cleanKeyword);
  });
}

function initMap() {
  const amapKey = window.MOODTRIP_CONFIG?.amapKey?.trim();
  if (!window.AMapLoader || !amapKey || amapKey === 'YOUR_AMAP_WEB_KEY') {
    mapFallbackText.textContent = '公开演示版未内置地图密钥。可使用预设地点，或通过搜索跳转高德地图确认位置。';
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.classList.add('map-unavailable');
    mapContainer.innerHTML = '<div><strong>地图为可选能力</strong><p>复制 src/config.example.js 为 src/config.js 并填写自己的高德 Web Key，即可启用地图选点。</p></div>';
    resetMapBtn.addEventListener('click', resetPlaceSelection);
    return;
  }

  window.AMapLoader.load({
    key: amapKey,
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geocoder'],
  })
    .then((AMap) => {
      mapInstance = new AMap.Map('mapContainer', {
        viewMode: '2D',
        zoom: 11.5,
        center: DEFAULT_CENTER,
      });

      mapInstance.addControl(new AMap.Scale());
      mapInstance.addControl(new AMap.ToolBar({ position: 'RB' }));
      mapGeocoder = new AMap.Geocoder();

      updateMarker(AMap, DEFAULT_CENTER);

      mapInstance.on('click', (event) => {
        handleMapClick(AMap, event.lnglat);
      });

      resetMapBtn.addEventListener('click', () => {
        resetPlaceSelection();
      });
    })
    .catch((error) => {
      console.error(error);
      mapFallbackText.textContent = '地图暂时不可用，仍可使用预设地点和外部搜索入口。';
      resetMapBtn.disabled = true;
    });
}

foodInput.addEventListener('input', (event) => {
  state.foodCustom = event.target.value;
  updateSummary();
});

placeSearchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchPlaceByKeyword(placeSearchInput.value);
});

copyPlanBtn.addEventListener('click', async () => {
  const text = buildPlanText();
  try {
    await navigator.clipboard.writeText(text);
    feedbackText.textContent = '方案已复制，可以直接粘贴发送。';
  } catch (error) {
    feedbackText.textContent = '复制失败了，可能是浏览器限制。你也可以手动全选复制。';
    console.error(error);
  }
});

sharePlanBtn.addEventListener('click', async () => {
  const text = buildPlanText();
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'MoodTrip 出游方案',
        text,
      });
      feedbackText.textContent = '已打开系统分享。';
      return;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    feedbackText.textContent = '当前设备不支持系统分享，方案已复制到剪贴板。';
  } catch (error) {
    feedbackText.textContent = '分享未成功，出游方案仍可在页面中查看。';
    console.error(error);
  }
});

initializeSelectors();
renderFoodOptions();
syncFoodActiveStates();
updateSummary();
initMap();
