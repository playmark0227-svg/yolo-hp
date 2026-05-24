// ============================================
// 株式会社YOLO
// ============================================
// venues データは src/data/venues.json に切り出し（追加更新を容易にするため）。
// 1会場 = { id, name, representative, url, x, y } の形式。x/y は北海道マップ画像上の位置 (%) 。
// 会場が増えた際は venues.json に追記するだけで OK。
// ローカル file:// プレビュー用に、fetch 失敗時は下記 FALLBACK_VENUES を使う。

const FALLBACK_VENUES = [
    { id: 'sapporo',   name: '札幌会場',   representative: '代表 佐藤光',     url: '#', x: 23, y: 60 },
    { id: 'asahikawa', name: '旭川会場',   representative: '代表 ── ──',     url: '#', x: 38, y: 45 },
    { id: 'hakodate',  name: '函館会場',   representative: '代表 ── ──',     url: '#', x: 14, y: 74 },
    { id: 'kushiro',   name: '釧路会場',   representative: '代表 ── ──',     url: '#', x: 50, y: 62 },
    { id: 'obihiro',   name: '帯広会場',   representative: '代表 ── ──',     url: '#', x: 39, y: 62 },
    { id: 'kitami',    name: '北見会場',   representative: '代表 ── ──',     url: '#', x: 50, y: 38 },
    { id: 'tomakomai', name: '苫小牧会場', representative: '代表 和泉',       url: '#', x: 28, y: 64 },
];

// document.currentScript はパース時のみ参照可。トップ用 / サブページ用どちらでも
// このスクリプトファイル自身のパスからベースURLを算出する。
const SCRIPT_BASE = (() => {
    if (document.currentScript && document.currentScript.src) {
        return document.currentScript.src.replace(/[^/]+$/, '');
    }
    return new URL('.', window.location.href).href;
})();

let VENUES = FALLBACK_VENUES;

async function loadVenues() {
    try {
        const res = await fetch(SCRIPT_BASE + 'src/data/venues.json', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) return data;
        }
    } catch (e) {
        // ローカル file:// などで fetch 不可 → フォールバックを使用
    }
    return FALLBACK_VENUES;
}

document.addEventListener('DOMContentLoaded', async () => {
    initMobileNav();
    initContactForm();
    initSmoothScroll();
    initReveal();
    initScrollUI();

    // venues をロードしてから地図を初期化
    VENUES = await loadVenues();
    initMap();
});

// ---- mobile nav ----
function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('is-open');
    }));
}

// ---- Hokkaido venue map ----
// venues 配列を元にピンを動的生成（地図エリアがあるページのみ）
function initMap() {
    const wrap = document.querySelector('.hokkaido-map-container');
    const tip  = document.getElementById('venueTooltip');
    if (!wrap || !tip) return;

    // 既存ピンがあればクリア（ホットリロード時等）
    wrap.querySelectorAll('.venue-pin').forEach(p => p.remove());

    VENUES.forEach(v => {
        const a = document.createElement('a');
        a.className = 'venue-pin';
        a.dataset.venue = v.id;
        a.href = v.url || '#';
        a.style.left = v.x + '%';
        a.style.top  = v.y + '%';
        a.innerHTML = `<span class="pin__dot"></span><span class="pin__label">${v.name.replace('会場','')}</span>`;
        wrap.insertBefore(a, tip);
    });

    const pins = wrap.querySelectorAll('.venue-pin');

    pins.forEach(pin => {
        const id = pin.dataset.venue;
        const d = VENUES.find(v => v.id === id);
        if (!d) return;

        pin.addEventListener('mouseenter', (e) => {
            tip.querySelector('.tt__venue').textContent = d.name;
            tip.querySelector('.tt__rep').textContent = d.representative;
            tip.classList.add('is-visible');
            placeTip(e, tip, wrap);
        });
        pin.addEventListener('mousemove', (e) => placeTip(e, tip, wrap));
        pin.addEventListener('mouseleave', () => tip.classList.remove('is-visible'));
    });

    // venue-list があれば JSON データから再生成
    const list = document.querySelector('.venue-list ul');
    if (list) {
        list.innerHTML = '';
        VENUES.forEach((v, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="vno">${String(i + 1).padStart(2, '0')}</span><span class="vname">${v.name}</span><span class="vrep">${v.representative}</span>`;
            list.appendChild(li);
        });
    }
}

function placeTip(e, tip, wrap) {
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left + 18;
    const y = e.clientY - r.top - 70;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
}

// ---- contact form (placeholder handler) ----
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.form__submit');
        const orig = btn.innerHTML;
        btn.innerHTML = '送信しました ✓';
        btn.style.background = 'var(--matcha)';
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.background = '';
            form.reset();
        }, 2600);
    });
}

// ---- smooth scroll for anchor links ----
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        const href = a.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        a.addEventListener('click', (e) => {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ---- scroll progress bar + back-to-top ----
function initScrollUI() {
    const bar = document.getElementById('scrollProgress');
    const btn = document.getElementById('backToTop');

    const onScroll = () => {
        const h = document.documentElement;
        const max = (h.scrollHeight - h.clientHeight) || 1;
        const pct = Math.min(100, Math.max(0, (h.scrollTop / max) * 100));
        if (bar) bar.style.width = pct + '%';
        if (btn) btn.classList.toggle('is-visible', h.scrollTop > 600);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ---- scroll reveal ----
function initReveal() {
    const targets = document.querySelectorAll(
        '.section-title, .section-sub, .yc__intro-text, .yc__intro-stats, .map-wrap, .service-card, .about__grid, .member-card, .contact__grid, .slogan-band__lead, .cta-band__inner, .intro-band__inner, .page-hero__inner, .social-cta__inner, .coming-soon__inner'
    );
    targets.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-in');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
}
