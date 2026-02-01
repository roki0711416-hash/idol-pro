(function () {
  'use strict';

  var legacy = window.IdolProGame;

  var STORAGE_KEY = 'idol-pro:idols';
  var WALLET_KEY = 'idol-pro:wallet';
  var INVENTORY_KEY = 'idol-pro:inventory';
  var SNS_KEY = 'idol-pro:sns';

  var COSTUMES = [
    { id: 'costume_common_casual01', name: 'カジュアル・ホワイト', rarity: 'COMMON', bonus: { fansPct: 0.00, liveSuccessPct: 0.00 } },
    { id: 'costume_common_casual02', name: 'カジュアル・ブラック', rarity: 'COMMON', bonus: { fansPct: 0.01, liveSuccessPct: 0.00 } },
    { id: 'costume_common_sport01', name: 'スポーツ・セット', rarity: 'COMMON', bonus: { fansPct: 0.00, liveSuccessPct: 0.01 } },
    { id: 'costume_common_stage01', name: 'ステージ・ライト', rarity: 'COMMON', bonus: { fansPct: 0.01, liveSuccessPct: 0.01 } },
    { id: 'costume_common_hoodie01', name: 'フーディー', rarity: 'COMMON', bonus: { fansPct: 0.02, liveSuccessPct: 0.00 } },

    { id: 'costume_rare_pop01', name: 'ポップ・スター', rarity: 'RARE', bonus: { fansPct: 0.03, liveSuccessPct: 0.01 } },
    { id: 'costume_rare_cool01', name: 'クール・エッジ', rarity: 'RARE', bonus: { fansPct: 0.02, liveSuccessPct: 0.02 } },
    { id: 'costume_rare_classic01', name: 'クラシック・ドレス', rarity: 'RARE', bonus: { fansPct: 0.04, liveSuccessPct: 0.00 } },

    { id: 'costume_sr_idol01', name: 'アイドル・ユニフォーム', rarity: 'SR', bonus: { fansPct: 0.05, liveSuccessPct: 0.02 } },
    { id: 'costume_sr_sparkle01', name: 'スパークル', rarity: 'SR', bonus: { fansPct: 0.06, liveSuccessPct: 0.02 } },

    { id: 'costume_ssr_legend01', name: 'レジェンド・ドリーム', rarity: 'SSR', bonus: { fansPct: 0.08, liveSuccessPct: 0.04 } }
  ];

  function nowMs() {
    return Date.now();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  function todayYmd() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function createInitialIdols() {
    return [
      {
        id: 'luna',
        name: 'ルナ',
        level: 1,
        fans: 0,
        stats: { vocal: 10, dance: 10, visual: 10 },
        stamina: 100,
        updatedAt: 0
      },
      {
        id: 'mika',
        name: 'ミカ',
        level: 1,
        fans: 0,
        stats: { vocal: 10, dance: 10, visual: 10 },
        stamina: 100,
        updatedAt: 0
      },
      {
        id: 'yui',
        name: 'ユイ',
        level: 1,
        fans: 0,
        stats: { vocal: 10, dance: 10, visual: 10 },
        stamina: 100,
        updatedAt: 0
      }
    ];
  }

  function createInitialWallet() {
    return { coins: 500, gems: 0 };
  }

  function createInitialInventory() {
    return {
      costumes: {},
      items: {},
      equipped: {}
    };
  }

  function createInitialSns() {
    return { postsToday: 0, lastPostDate: todayYmd(), hype: 0 };
  }

  function ensureInitialized() {
    // idols
    var idolsRaw = localStorage.getItem(STORAGE_KEY);
    if (!idolsRaw) {
      saveIdols(createInitialIdols());
    }

    // wallet
    var walletRaw = localStorage.getItem(WALLET_KEY);
    if (!walletRaw) {
      localStorage.setItem(WALLET_KEY, JSON.stringify(createInitialWallet()));
    }

    // inventory
    var invRaw = localStorage.getItem(INVENTORY_KEY);
    if (!invRaw) {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(createInitialInventory()));
    }

    // sns
    var snsRaw = localStorage.getItem(SNS_KEY);
    if (!snsRaw) {
      localStorage.setItem(SNS_KEY, JSON.stringify(createInitialSns()));
    }
  }

  function normalizeIdol(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var idol = {
      id: String(raw.id || ''),
      name: String(raw.name || ''),
      level: Number.isFinite(raw.level) ? raw.level : 1,
      fans: Number.isFinite(raw.fans) ? raw.fans : 0,
      stats: {
        vocal: raw.stats && Number.isFinite(raw.stats.vocal) ? raw.stats.vocal : 10,
        dance: raw.stats && Number.isFinite(raw.stats.dance) ? raw.stats.dance : 10,
        visual: raw.stats && Number.isFinite(raw.stats.visual) ? raw.stats.visual : 10
      },
      stamina: Number.isFinite(raw.stamina) ? raw.stamina : 100,
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0
    };

    idol.level = Math.max(1, Math.floor(idol.level));
    idol.fans = Math.max(0, Math.floor(idol.fans));
    idol.stats.vocal = Math.max(0, Math.floor(idol.stats.vocal));
    idol.stats.dance = Math.max(0, Math.floor(idol.stats.dance));
    idol.stats.visual = Math.max(0, Math.floor(idol.stats.visual));
    idol.stamina = clamp(Math.floor(idol.stamina), 0, 100);

    if (!idol.id) return null;
    if (!idol.name) idol.name = idol.id;

    return idol;
  }

  function loadIdols() {
    ensureInitialized();
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      var initial = createInitialIdols();
      saveIdols(initial);
      return initial;
    }

    var arr = safeJsonParse(raw, null);
    if (!Array.isArray(arr)) {
      var fallback = createInitialIdols();
      saveIdols(fallback);
      return fallback;
    }

    var normalized = [];
    for (var i = 0; i < arr.length; i++) {
      var idol = normalizeIdol(arr[i]);
      if (idol) normalized.push(idol);
    }

    if (normalized.length === 0) {
      var initial2 = createInitialIdols();
      saveIdols(initial2);
      return initial2;
    }

    return normalized;
  }

  function saveIdols(idols) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(idols));
  }

  function loadWallet() {
    ensureInitialized();
    var raw = localStorage.getItem(WALLET_KEY);
    var wallet = safeJsonParse(raw, null);
    if (!wallet || typeof wallet !== 'object') wallet = createInitialWallet();
    if (!Number.isFinite(wallet.coins)) wallet.coins = 0;
    if (!Number.isFinite(wallet.gems)) wallet.gems = 0;
    wallet.coins = Math.max(0, Math.floor(wallet.coins));
    wallet.gems = Math.max(0, Math.floor(wallet.gems));
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    return wallet;
  }

  function saveWallet(wallet) {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  }

  function addCoins(amount) {
    var wallet = loadWallet();
    wallet.coins = Math.max(0, wallet.coins + Math.floor(amount));
    saveWallet(wallet);
    return wallet;
  }

  function addGems(amount) {
    var wallet = loadWallet();
    wallet.gems = Math.max(0, wallet.gems + Math.floor(amount));
    saveWallet(wallet);
    return wallet;
  }

  function loadInventory() {
    ensureInitialized();
    var raw = localStorage.getItem(INVENTORY_KEY);
    var inv = safeJsonParse(raw, null);
    if (!inv || typeof inv !== 'object') inv = createInitialInventory();
    if (!inv.costumes || typeof inv.costumes !== 'object') inv.costumes = {};
    if (!inv.items || typeof inv.items !== 'object') inv.items = {};
    if (!inv.equipped || typeof inv.equipped !== 'object') inv.equipped = {};
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
    return inv;
  }

  function saveInventory(inv) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  }

  function getCostumeById(costumeId) {
    for (var i = 0; i < COSTUMES.length; i++) {
      if (COSTUMES[i].id === costumeId) return COSTUMES[i];
    }
    return null;
  }

  function getOwnedCostumes() {
    var inv = loadInventory();
    var result = [];
    for (var i = 0; i < COSTUMES.length; i++) {
      var c = COSTUMES[i];
      var entry = inv.costumes[c.id];
      if (!entry) continue;
      if (entry.owned || (Number.isFinite(entry.qty) && entry.qty > 0)) {
        result.push({
          costume: c,
          qty: Number.isFinite(entry.qty) ? entry.qty : 1
        });
      }
    }
    return result;
  }

  function getEquippedCostumeId(idolId) {
    var inv = loadInventory();
    var v = inv.equipped[String(idolId || '')];
    return v ? String(v) : null;
  }

  function equipCostume(idolId, costumeIdOrNull) {
    var inv = loadInventory();
    var key = String(idolId || '');
    if (!key) return { ok: false, reason: 'invalid-idol' };

    if (costumeIdOrNull === null) {
      inv.equipped[key] = null;
      saveInventory(inv);
      return { ok: true, equipped: null };
    }

    var costumeId = String(costumeIdOrNull || '');
    var costume = getCostumeById(costumeId);
    if (!costume) return { ok: false, reason: 'invalid-costume' };

    var entry = inv.costumes[costumeId];
    var qty = entry && Number.isFinite(entry.qty) ? entry.qty : 0;
    if (qty <= 0) return { ok: false, reason: 'not-owned' };

    inv.equipped[key] = costumeId;
    saveInventory(inv);
    return { ok: true, equipped: costumeId };
  }

  function getEquippedBonus(idolId) {
    var costumeId = getEquippedCostumeId(idolId);
    if (!costumeId) return { costume: null, bonus: { fansPct: 0, liveSuccessPct: 0 } };
    var costume = getCostumeById(costumeId);
    if (!costume) return { costume: null, bonus: { fansPct: 0, liveSuccessPct: 0 } };
    var b = costume.bonus || {};
    return {
      costume: costume,
      bonus: {
        fansPct: Number.isFinite(b.fansPct) ? b.fansPct : 0,
        liveSuccessPct: Number.isFinite(b.liveSuccessPct) ? b.liveSuccessPct : 0
      }
    };
  }

  function getIdolById(id) {
    var idols = loadIdols();
    var targetId = String(id || '');
    for (var i = 0; i < idols.length; i++) {
      if (idols[i].id === targetId) return idols[i];
    }
    return null;
  }

  function replaceIdol(nextIdol) {
    var idols = loadIdols();
    var found = false;
    for (var i = 0; i < idols.length; i++) {
      if (idols[i].id === nextIdol.id) {
        idols[i] = nextIdol;
        found = true;
        break;
      }
    }
    if (!found) idols.push(nextIdol);
    saveIdols(idols);
    return nextIdol;
  }

  function maybeLevelUp(idol) {
    var leveledUp = false;
    while (idol.fans >= 100 * idol.level) {
      idol.level += 1;
      idol.stamina = 100;
      leveledUp = true;
    }
    return leveledUp;
  }

  function applyLesson(id, type) {
    var valid = type === 'vocal' || type === 'dance' || type === 'visual';
    if (!valid) {
      return { ok: false, reason: 'invalid-type' };
    }

    var idols = loadIdols();
    var targetId = String(id || '');

    for (var i = 0; i < idols.length; i++) {
      if (idols[i].id !== targetId) continue;

      var idol = idols[i];
      if (idol.stamina <= 0) {
        return { ok: false, reason: 'need-rest', idol: idol };
      }

      var statInc = randInt(1, 3);
      var fansInc = randInt(5, 15);
      var coinsInc = 50;
      var prevLevel = idol.level;

      idol.stats[type] += statInc;
      idol.stamina = clamp(idol.stamina - 10, 0, 100);
      idol.fans += fansInc;
      idol.updatedAt = nowMs();

      var leveledUp = maybeLevelUp(idol);

      saveIdols(idols);

      addCoins(coinsInc);

      return {
        ok: true,
        idol: idol,
        delta: { stat: statInc, fans: fansInc, stamina: -10, coins: coinsInc },
        leveledUp: leveledUp,
        prevLevel: prevLevel,
        nextLevel: idol.level
      };
    }

    return { ok: false, reason: 'not-found' };
  }

  function rest(id) {
    var idols = loadIdols();
    var targetId = String(id || '');

    for (var i = 0; i < idols.length; i++) {
      if (idols[i].id !== targetId) continue;

      var idol = idols[i];
      var prevStamina = idol.stamina;
      idol.stamina = clamp(idol.stamina + 30, 0, 100);
      idol.updatedAt = nowMs();
      saveIdols(idols);

      return {
        ok: true,
        idol: idol,
        delta: { stamina: idol.stamina - prevStamina }
      };
    }

    return { ok: false, reason: 'not-found' };
  }

  function computeLiveChance(idolId) {
    var idol = getIdolById(idolId);
    if (!idol) return { ok: false, reason: 'not-found' };

    var avg = (idol.stats.vocal + idol.stats.dance + idol.stats.visual) / 3;
    var base = 0.45;
    var byStats = (avg / 100) * 0.35;
    var byLevel = Math.min(0.15, idol.level * 0.01);

    var eq = getEquippedBonus(idol.id);
    var bonus = eq.bonus.liveSuccessPct;

    var chance = clamp(base + byStats + byLevel + bonus, 0.05, 0.95);
    return { ok: true, idol: idol, chance: chance, equipped: eq.costume, bonus: eq.bonus };
  }

  function runLive(idolId) {
    var info = computeLiveChance(idolId);
    if (!info.ok) return info;

    var idol = info.idol;
    var success = Math.random() < info.chance;
    var coinsGain = success ? 200 : 80;
    var baseFansGain = success ? randInt(20, 40) : randInt(5, 15);
    var fansBonus = 1 + (info.bonus.fansPct || 0);
    var fansGain = Math.floor(baseFansGain * fansBonus);

    var idols = loadIdols();
    for (var i = 0; i < idols.length; i++) {
      if (idols[i].id !== idol.id) continue;
      idols[i].fans += fansGain;
      idols[i].updatedAt = nowMs();
      var prevLevel = idols[i].level;
      var leveledUp = maybeLevelUp(idols[i]);
      saveIdols(idols);
      addCoins(coinsGain);

      return {
        ok: true,
        idol: idols[i],
        success: success,
        chance: info.chance,
        delta: { coins: coinsGain, fans: fansGain },
        leveledUp: leveledUp,
        prevLevel: prevLevel,
        nextLevel: idols[i].level,
        equipped: info.equipped,
        bonus: info.bonus
      };
    }

    return { ok: false, reason: 'not-found' };
  }

  window.IdolProGame = {
    STORAGE_KEY: STORAGE_KEY,
    WALLET_KEY: WALLET_KEY,
    INVENTORY_KEY: INVENTORY_KEY,
    SNS_KEY: SNS_KEY,
    loadIdols: loadIdols,
    saveIdols: saveIdols,
    getIdolById: getIdolById,
    applyLesson: applyLesson,
    rest: rest,
    maybeLevelUp: maybeLevelUp,
    loadWallet: loadWallet,
    saveWallet: saveWallet,
    addCoins: addCoins,
    addGems: addGems,
    loadInventory: loadInventory,
    saveInventory: saveInventory,
    getCostumeById: getCostumeById,
    getOwnedCostumes: getOwnedCostumes,
    getEquippedCostumeId: getEquippedCostumeId,
    getEquippedBonus: getEquippedBonus,
    equipCostume: equipCostume,
    computeLiveChance: computeLiveChance,
    runLive: runLive,
    COSTUMES: COSTUMES
  };
})();

// ─────────────────────────────────────────────────────────────
// vNext override (stamina removed, live ticket system)
// This block overwrites window.IdolProGame with the new spec APIs.
// ─────────────────────────────────────────────────────────────
(function () {
  'use strict';

  var legacy = window.IdolProGame;

  var WALLET_KEY = 'idol-pro:wallet';
  var DAILY_KEY = 'idol-pro:daily';
  var STATS_KEY = 'idol-pro:stats';
  var EQUIPPED_KEY = 'idol-pro:equipped';

  var SUBSCRIPTION_KEY = 'idol-pro:subscription';

  // keep legacy inventory key (used for items)
  var LEGACY_INVENTORY_KEY = 'idol-pro:inventory';

  // Costume master (keep the existing one if available)
  var COSTUMES = (legacy && legacy.COSTUMES) ? legacy.COSTUMES : [];
  // Extend bonus with score (missing ones treated as 0)
  for (var i = 0; i < COSTUMES.length; i++) {
    if (!COSTUMES[i].bonus) COSTUMES[i].bonus = {};
    if (!Number.isFinite(COSTUMES[i].bonus.score)) COSTUMES[i].bonus.score = 0;
  }

  var ITEMS = [
    { id: 'item_lightstick', name: 'ペンライト', score: 2 },
    { id: 'item_banner', name: '応援バナー', score: 3 },
    { id: 'item_stage_smoke', name: 'スモーク演出', score: 4 }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  function todayYmd() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function createInitialWallet() {
    return { coins: 500, gems: 0 };
  }

  function createInitialDaily(dateStr) {
    return { date: dateStr, liveTickets: 3, snsPowerUsed: 0, hype: 0 };
  }

  function createInitialStats() {
    return { vocal: 10, dance: 10, expression: 10, fans: 0 };
  }

  function createInitialEquipped() {
    return { costumeId: null };
  }

  function normalizePlan(value) {
    var v = String(value || '').toLowerCase();
    if (v === 'premium') return 'premium';
    if (v === 'basic') return 'basic';
    return 'free';
  }

  function planRank(plan) {
    var p = normalizePlan(plan);
    if (p === 'premium') return 2;
    if (p === 'basic') return 1;
    return 0;
  }

  function getSubscriptionPlan() {
    ensureInitialized();
    return normalizePlan(localStorage.getItem(SUBSCRIPTION_KEY));
  }

  function setSubscriptionPlan(nextPlan) {
    var p = normalizePlan(nextPlan);
    localStorage.setItem(SUBSCRIPTION_KEY, p);
    ensureEquippedValid();
    return p;
  }

  var FREE_COSTUME_IDS = [
    'costume_common_casual01'
  ];

  var BASIC_COSTUME_IDS = [
    'costume_common_casual02',
    'costume_common_sport01',
    'costume_common_stage01',
    'costume_common_hoodie01',
    'costume_rare_pop01'
  ];

  function getRequiredPlanForCostumeId(costumeId) {
    var id = String(costumeId || '');
    for (var i = 0; i < FREE_COSTUME_IDS.length; i++) {
      if (FREE_COSTUME_IDS[i] === id) return 'free';
    }
    for (var j = 0; j < BASIC_COSTUME_IDS.length; j++) {
      if (BASIC_COSTUME_IDS[j] === id) return 'basic';
    }
    return 'premium';
  }

  function isPlanSufficient(currentPlan, requiredPlan) {
    return planRank(currentPlan) >= planRank(requiredPlan);
  }

  function ensureEquippedValid() {
    // NOTE: Must not call loadEquipped()/ensureInitialized() to avoid recursion.
    var raw = localStorage.getItem(EQUIPPED_KEY);
    var e = safeJsonParse(raw, createInitialEquipped());
    if (!e || typeof e !== 'object') e = createInitialEquipped();
    if (e.costumeId === undefined) e.costumeId = null;
    if (e.costumeId !== null) e.costumeId = String(e.costumeId);

    if (!e.costumeId) {
      localStorage.setItem(EQUIPPED_KEY, JSON.stringify(e));
      return;
    }

    var required = getRequiredPlanForCostumeId(e.costumeId);
    var current = normalizePlan(localStorage.getItem(SUBSCRIPTION_KEY));
    if (!isPlanSufficient(current, required)) {
      e.costumeId = null;
      localStorage.setItem(EQUIPPED_KEY, JSON.stringify(e));
    }
  }

  function ensureInitialized() {
    if (!localStorage.getItem(WALLET_KEY)) {
      localStorage.setItem(WALLET_KEY, JSON.stringify(createInitialWallet()));
    }
    if (!localStorage.getItem(STATS_KEY)) {
      localStorage.setItem(STATS_KEY, JSON.stringify(createInitialStats()));
    }
    if (!localStorage.getItem(EQUIPPED_KEY)) {
      localStorage.setItem(EQUIPPED_KEY, JSON.stringify(createInitialEquipped()));
    }

    if (!localStorage.getItem(SUBSCRIPTION_KEY)) {
      localStorage.setItem(SUBSCRIPTION_KEY, 'free');
    }

    var today = todayYmd();
    var raw = localStorage.getItem(DAILY_KEY);
    if (!raw) {
      localStorage.setItem(DAILY_KEY, JSON.stringify(createInitialDaily(today)));
      return;
    }

    var daily = safeJsonParse(raw, null);
    if (!daily || typeof daily !== 'object' || typeof daily.date !== 'string') {
      localStorage.setItem(DAILY_KEY, JSON.stringify(createInitialDaily(today)));
      return;
    }

    if (daily.date !== today) {
      localStorage.setItem(DAILY_KEY, JSON.stringify(createInitialDaily(today)));
      return;
    }

    if (!Number.isFinite(daily.liveTickets)) daily.liveTickets = 3;
    if (!Number.isFinite(daily.snsPowerUsed)) daily.snsPowerUsed = 0;
    if (!Number.isFinite(daily.hype)) daily.hype = 0;

    daily.liveTickets = clamp(Math.floor(daily.liveTickets), 0, 99);
    daily.snsPowerUsed = clamp(Math.floor(daily.snsPowerUsed), 0, 99);
    daily.hype = clamp(Math.floor(daily.hype), 0, 999);
    localStorage.setItem(DAILY_KEY, JSON.stringify(daily));

    ensureEquippedValid();
  }

  function loadWallet() {
    ensureInitialized();
    var raw = localStorage.getItem(WALLET_KEY);
    var w = safeJsonParse(raw, createInitialWallet());
    if (!Number.isFinite(w.coins)) w.coins = 0;
    if (!Number.isFinite(w.gems)) w.gems = 0;
    w.coins = Math.max(0, Math.floor(w.coins));
    w.gems = Math.max(0, Math.floor(w.gems));
    localStorage.setItem(WALLET_KEY, JSON.stringify(w));
    return w;
  }

  function saveWallet(wallet) {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  }

  function addCoins(amount) {
    var w = loadWallet();
    w.coins = Math.max(0, w.coins + Math.floor(amount));
    saveWallet(w);
    return w;
  }

  function addGems(amount) {
    var w = loadWallet();
    w.gems = Math.max(0, w.gems + Math.floor(amount));
    saveWallet(w);
    return w;
  }

  function loadDaily() {
    ensureInitialized();
    return safeJsonParse(localStorage.getItem(DAILY_KEY), createInitialDaily(todayYmd()));
  }

  function saveDaily(daily) {
    localStorage.setItem(DAILY_KEY, JSON.stringify(daily));
  }

  function loadStats() {
    ensureInitialized();
    var raw = localStorage.getItem(STATS_KEY);
    var s = safeJsonParse(raw, createInitialStats());
    if (!Number.isFinite(s.vocal)) s.vocal = 10;
    if (!Number.isFinite(s.dance)) s.dance = 10;
    if (!Number.isFinite(s.expression)) s.expression = 10;
    if (!Number.isFinite(s.fans)) s.fans = 0;
    s.vocal = Math.max(0, Math.floor(s.vocal));
    s.dance = Math.max(0, Math.floor(s.dance));
    s.expression = Math.max(0, Math.floor(s.expression));
    s.fans = Math.max(0, Math.floor(s.fans));
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
    return s;
  }

  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  function loadEquipped() {
    ensureInitialized();
    var raw = localStorage.getItem(EQUIPPED_KEY);
    var e = safeJsonParse(raw, createInitialEquipped());
    if (!e || typeof e !== 'object') e = createInitialEquipped();
    if (e.costumeId === undefined) e.costumeId = null;
    if (e.costumeId !== null) e.costumeId = String(e.costumeId);
    localStorage.setItem(EQUIPPED_KEY, JSON.stringify(e));
    return e;
  }

  function saveEquipped(equipped) {
    localStorage.setItem(EQUIPPED_KEY, JSON.stringify(equipped));
  }

  function getCostumeById(costumeId) {
    for (var i = 0; i < COSTUMES.length; i++) {
      if (COSTUMES[i].id === costumeId) return COSTUMES[i];
    }
    return null;
  }

  function loadLegacyInventory() {
    var raw = localStorage.getItem(LEGACY_INVENTORY_KEY);
    var inv = safeJsonParse(raw, null);
    if (!inv || typeof inv !== 'object') inv = { costumes: {}, items: {}, equipped: {} };
    if (!inv.costumes || typeof inv.costumes !== 'object') inv.costumes = {};
    if (!inv.items || typeof inv.items !== 'object') inv.items = {};
    if (!inv.equipped || typeof inv.equipped !== 'object') inv.equipped = {};
    localStorage.setItem(LEGACY_INVENTORY_KEY, JSON.stringify(inv));
    return inv;
  }

  function getOwnedCostumes() {
    // Backward-compatible name: returns "currently usable" costumes by subscription.
    var plan = getSubscriptionPlan();
    var result = [];
    for (var i = 0; i < COSTUMES.length; i++) {
      var c = COSTUMES[i];
      var required = getRequiredPlanForCostumeId(c.id);
      if (!isPlanSufficient(plan, required)) continue;
      result.push({ costume: c, qty: 1 });
    }
    return result;
  }

  function getCostumeCatalog() {
    var plan = getSubscriptionPlan();
    var list = [];
    for (var i = 0; i < COSTUMES.length; i++) {
      var c = COSTUMES[i];
      var required = getRequiredPlanForCostumeId(c.id);
      list.push({
        costume: c,
        requiredPlan: required,
        available: isPlanSufficient(plan, required)
      });
    }
    return list;
  }

  function setEquippedCostume(costumeIdOrNull) {
    var e = loadEquipped();
    if (costumeIdOrNull === null) {
      e.costumeId = null;
      saveEquipped(e);
      return { ok: true, equipped: null };
    }

    var costumeId = String(costumeIdOrNull || '');
    var costume = getCostumeById(costumeId);
    if (!costume) return { ok: false, reason: 'invalid-costume' };

    var required = getRequiredPlanForCostumeId(costumeId);
    var current = getSubscriptionPlan();
    if (!isPlanSufficient(current, required)) {
      return { ok: false, reason: 'requires-plan', requiredPlan: required, currentPlan: current };
    }

    e.costumeId = costumeId;
    saveEquipped(e);
    return { ok: true, equipped: costumeId };
  }

  function getEquippedBonus() {
    ensureEquippedValid();
    var e = loadEquipped();
    if (!e.costumeId) return { costume: null, bonus: { fansPct: 0, liveSuccessPct: 0, score: 0 } };
    var c = getCostumeById(e.costumeId);
    if (!c) return { costume: null, bonus: { fansPct: 0, liveSuccessPct: 0, score: 0 } };
    var b = c.bonus || {};

    var rarityScore = 0;
    if (c.rarity === 'SSR') rarityScore = 7;
    else if (c.rarity === 'SR') rarityScore = 4;
    else if (c.rarity === 'RARE') rarityScore = 2;
    else if (c.rarity === 'COMMON') rarityScore = 1;

    var scoreBonus = Number.isFinite(b.score) ? b.score : rarityScore;
    if (!Number.isFinite(scoreBonus) || scoreBonus <= 0) scoreBonus = rarityScore;
    return {
      costume: c,
      bonus: {
        fansPct: Number.isFinite(b.fansPct) ? b.fansPct : 0,
        liveSuccessPct: Number.isFinite(b.liveSuccessPct) ? b.liveSuccessPct : 0,
        score: scoreBonus
      }
    };
  }

  // SNS: up to 3 boosts/day
  function addHypeFromSns() {
    var daily = loadDaily();
    if (daily.snsPowerUsed >= 3) return { ok: false, reason: 'limit', daily: daily };
    daily.snsPowerUsed += 1;
    daily.hype += 1;
    saveDaily(daily);
    return { ok: true, daily: daily };
  }

  // Training: unlimited (no stamina)
  function applyLesson(type) {
    var valid = type === 'vocal' || type === 'dance' || type === 'expression';
    if (!valid) return { ok: false, reason: 'invalid-type' };

    var stats = loadStats();
    var statInc = randInt(1, 3);
    var fansInc = randInt(5, 15);
    var coinsInc = 50;

    stats[type] += statInc;
    stats.fans += fansInc;
    saveStats(stats);
    addCoins(coinsInc);

    return { ok: true, stats: stats, delta: { stat: statInc, fans: fansInc, coins: coinsInc } };
  }

  function difficultyConfig(key) {
    if (key === 'easy') return { key: 'easy', needScore: 45, coinsSuccess: 200, coinsFail: 80, fansSuccess: [25, 45], fansFail: [8, 18], hypeFactor: 5 };
    if (key === 'hard') return { key: 'hard', needScore: 90, coinsSuccess: 260, coinsFail: 90, fansSuccess: [40, 70], fansFail: [10, 22], hypeFactor: 6 };
    return { key: 'normal', needScore: 70, coinsSuccess: 220, coinsFail: 80, fansSuccess: [30, 55], fansFail: [9, 20], hypeFactor: 5 };
  }

  function getItemBonusScore() {
    var raw = localStorage.getItem(LEGACY_INVENTORY_KEY);
    if (!raw) return 0;
    var inv = safeJsonParse(raw, null);
    if (!inv || !inv.items) return 0;

    var total = 0;
    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i];
      var qty = inv.items[it.id];
      if (!Number.isFinite(qty) || qty <= 0) continue;
      total += it.score;
    }
    return clamp(total, 0, 12);
  }

  function computeLiveScore(difficultyKey) {
    var cfg = difficultyConfig(difficultyKey);
    var stats = loadStats();
    var daily = loadDaily();
    var eq = getEquippedBonus();

    var base = stats.vocal + stats.dance + stats.expression;
    var costumeBonusScore = eq.bonus.score;
    var hypeScore = daily.hype * cfg.hypeFactor;
    var itemBonusScore = getItemBonusScore();

    var score = base + costumeBonusScore + hypeScore + itemBonusScore;

    return {
      ok: true,
      difficulty: cfg,
      score: score,
      parts: { base: base, costumeBonusScore: costumeBonusScore, hypeScore: hypeScore, itemBonusScore: itemBonusScore },
      daily: daily,
      stats: stats,
      equipped: eq.costume,
      bonus: eq.bonus
    };
  }

  function runLive(difficultyKey) {
    var daily = loadDaily();
    if (daily.liveTickets <= 0) return { ok: false, reason: 'no-tickets', daily: daily };

    var info = computeLiveScore(difficultyKey);
    var cfg = info.difficulty;

    daily.liveTickets -= 1;
    daily.liveTickets = clamp(daily.liveTickets, 0, 99);
    saveDaily(daily);

    var success = info.score >= cfg.needScore;
    var coinsGain = success ? cfg.coinsSuccess : cfg.coinsFail;
    var fansBase = success ? randInt(cfg.fansSuccess[0], cfg.fansSuccess[1]) : randInt(cfg.fansFail[0], cfg.fansFail[1]);
    var eq = getEquippedBonus();
    var fansGain = Math.floor(fansBase * (1 + (eq.bonus.fansPct || 0)));

    var stats = loadStats();
    stats.fans += fansGain;
    saveStats(stats);
    addCoins(coinsGain);

    return {
      ok: true,
      success: success,
      difficulty: cfg,
      score: info.score,
      needScore: cfg.needScore,
      parts: info.parts,
      delta: { coins: coinsGain, fans: fansGain },
      daily: loadDaily(),
      stats: loadStats(),
      equipped: eq.costume,
      bonus: eq.bonus
    };
  }

  // ───────────────────────────────────────────────────────────
  // Training v2 (no stamina): unified state model
  // ───────────────────────────────────────────────────────────
  var STATE_KEY = 'idol-pro:state';

  function initState() {
    var state = {
      coins: 0,
      fans: 0,
      gems: 0,
      currentIdolId: 'luna',
      idols: {
        luna: {
          id: 'luna',
          name: 'ルナ',
          stats: { vocal: 10, dance: 10, expression: 10 },
          level: 1,
          exp: 0
        }
      }
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    // mirror for legacy UI bits (e.g. dashboard coin/gem display)
    localStorage.setItem('coins', String(state.coins));
    localStorage.setItem('gems', String(state.gems));
    localStorage.setItem('fans', String(state.fans));
    return state;
  }

  function normalizeState(state) {
    if (!state || typeof state !== 'object') return initState();

    if (!Number.isFinite(state.coins)) state.coins = 0;
    if (!Number.isFinite(state.fans)) state.fans = 0;
    if (!Number.isFinite(state.gems)) state.gems = 0;
    state.coins = Math.max(0, Math.floor(state.coins));
    state.fans = Math.max(0, Math.floor(state.fans));
    state.gems = Math.max(0, Math.floor(state.gems));

    if (!state.currentIdolId) state.currentIdolId = 'luna';
    state.currentIdolId = String(state.currentIdolId);

    if (!state.idols || typeof state.idols !== 'object') state.idols = {};
    var id = state.currentIdolId;
    if (!state.idols[id] || typeof state.idols[id] !== 'object') {
      // ensure at least one idol exists
      state.idols.luna = {
        id: 'luna',
        name: 'ルナ',
        stats: { vocal: 10, dance: 10, expression: 10 },
        level: 1,
        exp: 0
      };
      state.currentIdolId = 'luna';
    }

    var idol = state.idols[state.currentIdolId];
    if (!idol.stats || typeof idol.stats !== 'object') idol.stats = { vocal: 10, dance: 10, expression: 10 };
    if (!Number.isFinite(idol.stats.vocal)) idol.stats.vocal = 10;
    if (!Number.isFinite(idol.stats.dance)) idol.stats.dance = 10;
    if (!Number.isFinite(idol.stats.expression)) idol.stats.expression = 10;
    idol.stats.vocal = Math.max(0, Math.floor(idol.stats.vocal));
    idol.stats.dance = Math.max(0, Math.floor(idol.stats.dance));
    idol.stats.expression = Math.max(0, Math.floor(idol.stats.expression));

    if (!Number.isFinite(idol.level)) idol.level = 1;
    if (!Number.isFinite(idol.exp)) idol.exp = 0;
    idol.level = Math.max(1, Math.floor(idol.level));
    idol.exp = Math.max(0, Math.floor(idol.exp));

    if (!idol.id) idol.id = state.currentIdolId;
    idol.id = String(idol.id);
    if (!idol.name) idol.name = 'ルナ';
    idol.name = String(idol.name);

    return state;
  }

  function getState() {
    var raw = localStorage.getItem(STATE_KEY);
    if (!raw) return initState();
    var parsed = safeJsonParse(raw, null);
    var state = normalizeState(parsed);
    // persist normalized form
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    return state;
  }

  function saveState(state) {
    var s = normalizeState(state);
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
    // mirror for legacy UI bits
    localStorage.setItem('coins', String(s.coins));
    localStorage.setItem('gems', String(s.gems));
    localStorage.setItem('fans', String(s.fans));
    return s;
  }

  function getCurrentIdol() {
    var s = getState();
    return s.idols[s.currentIdolId];
  }

  function levelUpIfNeeded(state, idol) {
    var leveled = 0;
    while (idol.exp >= 100) {
      idol.exp -= 100;
      idol.level += 1;
      idol.stats.vocal += 1;
      idol.stats.dance += 1;
      idol.stats.expression += 1;
      leveled += 1;
    }
    return leveled;
  }

  function applyTraining(menuKey) {
    var key = String(menuKey || '');
    var parts = key.split('_');
    if (parts.length !== 2) return { deltaStats: {}, coinsDelta: 0, message: 'メニューが不正です' };

    var mode = parts[0];
    var statKey = parts[1];
    var validMode = (mode === 'basic' || mode === 'hard');
    var validStat = (statKey === 'vocal' || statKey === 'dance' || statKey === 'expression');
    if (!validMode || !validStat) return { deltaStats: {}, coinsDelta: 0, message: 'メニューが不正です' };

    var state = getState();
    var idol = state.idols[state.currentIdolId];
    if (!idol) {
      state = initState();
      idol = state.idols[state.currentIdolId];
    }

    var delta = 0;
    var expDelta = 0;
    if (mode === 'basic') {
      delta = randInt(1, 3);
      expDelta = 10;
    } else {
      delta = randInt(-1, 6);
      expDelta = 15;
    }

    var before = idol.stats[statKey];
    idol.stats[statKey] = Math.max(0, Math.floor(before + delta));
    var applied = idol.stats[statKey] - before;

    idol.exp += expDelta;
    var upCount = levelUpIfNeeded(state, idol);

    var coinsDelta = 0;
    var hardSuccess = (mode === 'hard' && applied > 0);
    if (hardSuccess) {
      coinsDelta = randInt(5, 15);
      state.coins = Math.max(0, state.coins + coinsDelta);
    }

    saveState(state);

    var statLabel = (statKey === 'vocal') ? '歌' : (statKey === 'dance') ? 'ダンス' : '表現';
    var modeLabel = (mode === 'basic') ? '基本' : '強化';
    var msg = modeLabel + '育成（' + statLabel + '）: ' + (applied >= 0 ? '+' : '') + String(applied) + ' / 経験値 +' + String(expDelta);
    if (coinsDelta > 0) msg += ' / コイン +' + String(coinsDelta);
    if (upCount > 0) msg += ' / レベルアップ +' + String(upCount);

    return {
      deltaStats: (function () {
        var o = {};
        o[statKey] = applied;
        return o;
      })(),
      coinsDelta: coinsDelta,
      message: msg
    };
  }

  window.IdolProGame = {
    WALLET_KEY: WALLET_KEY,
    DAILY_KEY: DAILY_KEY,
    STATS_KEY: STATS_KEY,
    EQUIPPED_KEY: EQUIPPED_KEY,

    SUBSCRIPTION_KEY: SUBSCRIPTION_KEY,

    // legacy key (items only)
    INVENTORY_KEY: LEGACY_INVENTORY_KEY,

    loadWallet: loadWallet,
    saveWallet: saveWallet,
    addCoins: addCoins,
    addGems: addGems,

    loadDaily: loadDaily,
    saveDaily: saveDaily,
    addHypeFromSns: addHypeFromSns,

    loadStats: loadStats,
    saveStats: saveStats,
    applyLesson: applyLesson,

    COSTUMES: COSTUMES,
    ITEMS: ITEMS,
    getCostumeById: getCostumeById,
    loadEquipped: loadEquipped,
    saveEquipped: saveEquipped,
    setEquippedCostume: setEquippedCostume,
    getEquippedBonus: getEquippedBonus,
    getOwnedCostumes: getOwnedCostumes,
    getCostumeCatalog: getCostumeCatalog,

    getSubscriptionPlan: getSubscriptionPlan,
    setSubscriptionPlan: setSubscriptionPlan,

    computeLiveScore: computeLiveScore,
    runLive: runLive,

    // Training v2 state APIs
    STATE_KEY: STATE_KEY,
    initState: initState,
    getState: getState,
    saveState: saveState,
    getCurrentIdol: getCurrentIdol,
    applyTraining: applyTraining
  };
})();
