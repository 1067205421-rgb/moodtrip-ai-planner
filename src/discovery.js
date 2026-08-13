const discoveryConfig = {
  咖啡: { query: '咖啡店', icon: '☕', products: ['招牌奶咖', '手冲咖啡', '巴斯克蛋糕'] },
  手作: { query: '陶艺 DIY 手作', icon: '🎨', products: ['双人陶艺体验', '手作饰品', '成品烧制'] },
  日料: { query: '日本料理', icon: '🍣', products: ['招牌寿司', '寿喜锅', '烧鸟拼盘'] },
  甜品: { query: '甜品店', icon: '🍰', products: ['当季蛋糕', '招牌冰品', '双人下午茶'] },
  逛展: { query: '美术馆 博物馆 艺术中心', icon: '🖼️', products: ['近期特展', '常设展览', '文创商店'] },
  看电影: { query: '电影院', icon: '🎬', products: ['情侣座', '杜比影厅', '晚场电影'] },
  火锅: { query: '火锅', icon: '🍲', products: ['招牌锅底', '双人套餐', '特色涮菜'] },
  杭帮菜: { query: '杭帮菜', icon: '🥢', products: ['东坡肉', '龙井虾仁', '时令杭帮菜'] },
  桌游: { query: '桌游店', icon: '🎲', products: ['双人桌游', '店员教学', '多人轻策桌游'] },
  室内: { query: '室内体验馆', icon: '🏠', products: ['双人体验项目', '主题打卡', '雨天套餐'] },
  新鲜: { query: '体验馆 DIY', icon: '✨', products: ['近期热门体验', '双人项目', '限定活动'] },
};

const routeTags = new Set(['散步', '户外', '运动', '拍照', '浪漫', '安静']);
const hangzhouRoutes = [
  {
    title: '良渚古城公园慢游线',
    area: '余杭区 · 良渚',
    route: '南城墙入口 → 雉山观景台 → 鹿苑 → 莫角山',
    distance: '约 4–5 公里',
    duration: '约 2.5 小时',
    tags: ['散步', '户外', '拍照', '安静'],
    review: '视野开阔、节奏舒缓，适合边走边聊；晴天注意防晒。',
    product: '建议体验：观景台合照、草地休息、日落时段',
    query: '良渚古城遗址公园',
  },
  {
    title: '小河直街运河慢游线',
    area: '拱墅区 · 运河边',
    route: '小河公园 → 小河直街 → 桥西历史街区 → 拱宸桥',
    distance: '约 3.5 公里',
    duration: '约 2 小时',
    tags: ['散步', '拍照', '浪漫', '咖啡'],
    review: '沿河景观和老街氛围都不错，傍晚到夜间体验更舒适。',
    product: '建议体验：河边散步、老街拍照、途中找咖啡馆休息',
    query: '杭州小河直街历史文化街区',
  },
  {
    title: '西溪湿地轻徒步线',
    area: '西湖区 · 西溪湿地',
    route: '周家村 → 烟水渔庄 → 深潭口 → 河渚街',
    distance: '约 5–6 公里',
    duration: '约 3 小时',
    tags: ['户外', '散步', '运动', '安静'],
    review: '绿意多、路线完整，适合天气凉爽时慢慢走；建议穿舒适的鞋。',
    product: '建议体验：湿地步道、摇橹船、河渚街小吃',
    query: '西溪国家湿地公园周家村',
  },
  {
    title: '西湖日落经典线',
    area: '西湖区 · 北山街',
    route: '断桥 → 北山街 → 曲院风荷 → 苏堤入口',
    distance: '约 4 公里',
    duration: '约 2 小时',
    tags: ['浪漫', '拍照', '散步', '户外'],
    review: '景色稳定、拍照友好，工作日傍晚体验更好，周末需要避开高峰。',
    product: '建议体验：北山街树影、湖边日落、苏堤夜景',
    query: '杭州北山街断桥',
  },
];

const discoverySection = document.getElementById('tag-discovery');
const discoveryTag = document.getElementById('discoveryTag');
const discoveryDescription = document.getElementById('discoveryDescription');
const discoveryStatus = document.getElementById('discoveryStatus');
const discoveryResults = document.getElementById('discoveryResults');
const discoverySource = document.getElementById('discoverySource');

let currentDiscoveryTag = '';
let placeSearchService = null;
let amapReadyPromise = null;

function getDiscoveryCenter() {
  const center = window.travelDiscoveryCenter;
  return Array.isArray(center) && center.length === 2 ? center : [120.29986, 30.41829];
}

function getMapPoint(value) {
  if (!value) return null;
  if (typeof value.getLng === 'function') return [value.getLng(), value.getLat()];
  if (Number.isFinite(value.lng) && Number.isFinite(value.lat)) return [value.lng, value.lat];
  if (Array.isArray(value)) return value;
  return null;
}

function openMapLink(name, location) {
  const point = getMapPoint(location);
  if (point) {
    return `https://uri.amap.com/marker?position=${point[0]},${point[1]}&name=${encodeURIComponent(name)}&callnative=1`;
  }
  return `https://www.amap.com/search?query=${encodeURIComponent(name)}&city=330100`;
}

function setActiveDiscoveryTags(tag) {
  document.querySelectorAll('[data-discovery-tag]').forEach((button) => {
    button.classList.toggle('active', button.dataset.discoveryTag === tag);
  });
}

function createDiscoveryBadge(text) {
  const badge = document.createElement('span');
  badge.className = 'discovery-badge';
  badge.textContent = text;
  return badge;
}

function createPlatformLinks(keyword) {
  const area = window.travelSelectedPlaceName || '杭州';
  const query = `${area} ${keyword}`;
  const actions = document.createElement('div');
  actions.className = 'platform-links';
  const links = [
    ['小红书攻略', `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(query)}&source=web_explore_feed`],
    ['大众点评', `https://www.dianping.com/search/keyword/3/0_${encodeURIComponent(query)}`],
  ];
  links.forEach(([label, href]) => {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    actions.appendChild(link);
  });
  return actions;
}

function renderRouteResults(tag) {
  const matching = hangzhouRoutes
    .filter((route) => route.tags.includes(tag))
    .concat(hangzhouRoutes.filter((route) => !route.tags.includes(tag)))
    .slice(0, 4);

  discoverySource.textContent = '路线为杭州公开演示数据，可打开高德确认实时路况';
  discoveryDescription.textContent = `“${tag}”属于活动型标签，所以这里不只给一个地点，而是直接给出可执行的路线、时长和沿途体验。`;
  discoveryStatus.textContent = `已找到 ${matching.length} 条适合“${tag}”的杭州路线。`;
  discoveryResults.replaceChildren();

  matching.forEach((route, index) => {
    const card = document.createElement('article');
    card.className = 'discovery-card route-card';

    const visual = document.createElement('div');
    visual.className = 'discovery-visual route-visual';
    visual.innerHTML = `<span>0${index + 1}</span><strong>${route.distance}</strong>`;

    const body = document.createElement('div');
    body.className = 'discovery-card-body';
    const top = document.createElement('div');
    top.className = 'discovery-card-top';
    const titleWrap = document.createElement('div');
    const area = document.createElement('span');
    area.className = 'discovery-eyebrow';
    area.textContent = route.area;
    const title = document.createElement('h3');
    title.textContent = route.title;
    titleWrap.append(area, title);
    const duration = createDiscoveryBadge(route.duration);
    top.append(titleWrap, duration);

    const routeLine = document.createElement('p');
    routeLine.className = 'route-line';
    routeLine.textContent = route.route;
    const review = document.createElement('p');
    review.className = 'discovery-review';
    review.textContent = `体验评价：${route.review}`;
    const product = document.createElement('p');
    product.className = 'discovery-product';
    product.textContent = route.product;

    const footer = document.createElement('div');
    footer.className = 'discovery-card-footer';
    const tags = document.createElement('div');
    tags.className = 'discovery-card-tags';
    route.tags.forEach((routeTag) => tags.appendChild(createDiscoveryBadge(routeTag)));
    const link = document.createElement('a');
    link.className = 'map-action';
    link.href = openMapLink(route.query);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '打开地图查看 →';
    footer.append(tags, link);

    body.append(top, routeLine, review, product, footer);
    card.append(visual, body);
    discoveryResults.appendChild(card);
  });
}

function waitForAmap() {
  if (!window.MOODTRIP_CONFIG?.amapKey) {
    return Promise.reject(new Error('公开演示版未配置地图密钥'));
  }
  if (amapReadyPromise) return amapReadyPromise;
  amapReadyPromise = new Promise((resolve, reject) => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (window.AMap?.plugin) {
        window.clearInterval(timer);
        window.AMap.plugin('AMap.PlaceSearch', () => {
          placeSearchService = new window.AMap.PlaceSearch({
            pageSize: 8,
            pageIndex: 1,
            city: '杭州',
            citylimit: false,
            extensions: 'all',
          });
          resolve(placeSearchService);
        });
      } else if (attempts > 40) {
        window.clearInterval(timer);
        reject(new Error('地图服务暂时不可用'));
      }
    }, 150);
  });
  return amapReadyPromise;
}

function readBizValue(poi, key) {
  const value = poi?.biz_ext?.[key] ?? poi?.bizExt?.[key];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function getPoiPhoto(poi) {
  const photo = Array.isArray(poi.photos) ? poi.photos[0] : null;
  return photo?.url || '';
}

function getPoiReason(poi, tag) {
  const rating = Number(readBizValue(poi, 'rating'));
  if (rating >= 4.5) return `地图评分 ${rating.toFixed(1)}，在附近同类地点里值得优先收藏。`;
  if (rating >= 4) return `地图评分 ${rating.toFixed(1)}，整体口碑表现不错，可打开地图查看近期评价。`;
  return `距离当前选点较近，适合作为“${tag}”候选；建议打开地图查看近期评价和营业状态。`;
}

function renderMerchantCard(poi, tag, config) {
  const card = document.createElement('article');
  card.className = 'discovery-card merchant-card';

  const visual = document.createElement('div');
  visual.className = 'discovery-visual merchant-visual';
  const photo = getPoiPhoto(poi);
  if (photo) {
    const image = document.createElement('img');
    image.src = photo;
    image.alt = poi.name || `${tag}商家`;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    visual.appendChild(image);
  } else {
    visual.textContent = config.icon;
  }

  const body = document.createElement('div');
  body.className = 'discovery-card-body';
  const top = document.createElement('div');
  top.className = 'discovery-card-top';
  const titleWrap = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'discovery-eyebrow';
  eyebrow.textContent = poi.type?.split(';').slice(-1)[0] || tag;
  const title = document.createElement('h3');
  title.textContent = poi.name || `${tag}候选地点`;
  titleWrap.append(eyebrow, title);

  const rating = readBizValue(poi, 'rating');
  const ratingBadge = createDiscoveryBadge(rating ? `★ ${rating}` : '查看评价');
  top.append(titleWrap, ratingBadge);

  const meta = document.createElement('div');
  meta.className = 'merchant-meta';
  const distance = Number(poi.distance);
  if (Number.isFinite(distance)) meta.appendChild(createDiscoveryBadge(distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`));
  const cost = readBizValue(poi, 'cost');
  if (cost) meta.appendChild(createDiscoveryBadge(`人均 ¥${cost}`));
  if (poi.address) meta.appendChild(createDiscoveryBadge(String(poi.address).slice(0, 22)));

  const review = document.createElement('p');
  review.className = 'discovery-review';
  review.textContent = `推荐理由：${getPoiReason(poi, tag)}`;
  const product = document.createElement('p');
  product.className = 'discovery-product';
  product.textContent = `推荐尝试：${config.products.join('、')}`;

  const footer = document.createElement('div');
  footer.className = 'discovery-card-footer';
  const tip = document.createElement('span');
  tip.className = 'data-tip';
  tip.textContent = rating ? '评分来自高德地图' : '打开地图查看完整信息';
  const link = document.createElement('a');
  link.className = 'map-action';
  link.href = openMapLink(poi.name, poi.location);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '查看店铺 →';
  footer.append(tip, link);

  body.append(top, meta, review, product, footer);
  card.append(visual, body);
  return card;
}

function renderMerchantSearchFallback(tag, config) {
  const variants = [
    {
      title: `附近高口碑${tag}`,
      query: `高评分 ${config.query}`,
      review: '优先查看近期评价、营业状态与距离，适合作为稳妥候选。',
      product: config.products[0],
    },
    {
      title: `适合停留的${tag}`,
      query: `环境舒适 ${config.query}`,
      review: '优先关注环境舒适、可停留时间长、多人体验友好的地点。',
      product: config.products[1],
    },
    {
      title: `有特色的${tag}`,
      query: `特色 ${config.query}`,
      review: '适合想增加新鲜感时使用，建议重点查看真实图片与最新评价。',
      product: config.products[2],
    },
  ];

  discoveryResults.replaceChildren();
  variants.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'discovery-card merchant-card fallback-card';
    const visual = document.createElement('div');
    visual.className = 'discovery-visual merchant-visual';
    visual.textContent = config.icon;
    const body = document.createElement('div');
    body.className = 'discovery-card-body';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'discovery-eyebrow';
    eyebrow.textContent = '实时地图探索入口';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const review = document.createElement('p');
    review.className = 'discovery-review';
    review.textContent = `筛选建议：${item.review}`;
    const product = document.createElement('p');
    product.className = 'discovery-product';
    product.textContent = `优先尝试：${item.product}`;
    const footer = document.createElement('div');
    footer.className = 'discovery-card-footer';
    const tip = document.createElement('span');
    tip.className = 'data-tip';
    tip.textContent = '打开地图后查看真实商家、评分和菜单';
    const link = document.createElement('a');
    link.className = 'map-action';
    link.href = openMapLink(item.query);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '查看附近商家 →';
    footer.append(tip, link);
    footer.appendChild(createPlatformLinks(title.textContent));
    body.append(eyebrow, title, review, product, footer);
    card.append(visual, body);
    discoveryResults.appendChild(card);
  });
}

async function searchMerchants(tag) {
  const config = discoveryConfig[tag] || discoveryConfig.新鲜;
  discoverySource.textContent = '正在通过高德地图搜索真实地点';
  discoveryDescription.textContent = `正在以当前地图选点为中心，搜索 8 公里内与“${tag}”相关的真实商家和地点。`;
  discoveryStatus.textContent = '正在寻找附近候选，请稍等…';
  discoveryResults.innerHTML = '<div class="discovery-empty discovery-loading">正在把偏好变成具体地点…</div>';

  try {
    const service = await waitForAmap();
    const center = getDiscoveryCenter();
    const result = await new Promise((resolve, reject) => {
      service.searchNearBy(config.query, center, 8000, (status, data) => {
        if (status === 'complete' && data?.poiList?.pois) resolve(data.poiList.pois);
        else reject(new Error(data?.info || '没有找到匹配结果'));
      });
    });

    const pois = result.slice(0, 6);
    discoveryResults.replaceChildren();
    if (!pois.length) throw new Error('附近暂时没有匹配结果');
    pois.forEach((poi) => discoveryResults.appendChild(renderMerchantCard(poi, tag, config)));
    discoverySource.textContent = '真实地点、评分与人均信息由高德地图提供';
    discoveryStatus.textContent = `已找到 ${pois.length} 个“${tag}”候选，按地图搜索结果展示。`;
  } catch (error) {
    console.error('商家搜索失败', error);
    discoverySource.textContent = '已切换为高德地图商家搜索入口';
    discoveryStatus.textContent = '站内实时商家接口暂时不可用，已为你生成三种可直接打开地图的筛选入口。';
    renderMerchantSearchFallback(tag, config);
  }
}

function exploreTag(tag, shouldScroll = true) {
  currentDiscoveryTag = tag;
  discoveryTag.textContent = `“${tag}”`;
  setActiveDiscoveryTags(tag);
  if (routeTags.has(tag)) renderRouteResults(tag);
  else searchMerchants(tag);
  if (shouldScroll) discoverySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-discovery-tag]');
  if (!target) return;
  exploreTag(target.dataset.discoveryTag);
});

window.addEventListener('travel-place-change', () => {
  if (currentDiscoveryTag && !routeTags.has(currentDiscoveryTag)) {
    searchMerchants(currentDiscoveryTag);
  }
});
