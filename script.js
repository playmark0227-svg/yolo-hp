// ============================================
// 株式会社YOLO
// ============================================
// venues データは src/data/venues.json に切り出し（追加更新を容易にするため）。
// 1会場 = { id, name, representative, url, x, y } の形式。x/y は北海道マップ画像上の位置 (%) 。
// 会場が増えた際は venues.json に追記するだけで OK。
// ローカル file:// プレビュー用に、fetch 失敗時は下記 FALLBACK_VENUES を使う。

const FALLBACK_VENUES = [
    { id: 'sapporo',   name: '札幌会場',   representative: '組合長 佐藤光',      url: '#chief-sapporo', x: 21,   y: 57.5 },
    { id: 'otaru',     name: '小樽会場',   representative: '組合長（2名体制）',  url: '#chief-otaru', x: 17, y: 53.5 },
    { id: 'asahikawa', name: '旭川会場',   representative: '組合長 ── ──',      url: '#chief-asahikawa', x: 37,   y: 42 },
    { id: 'hakodate',  name: '函館会場',   representative: '組合長 ── ──',      url: '#chief-hakodate', x: 13.5,   y: 71 },
    { id: 'obihiro',   name: '帯広会場',   representative: '直営運営',           url: '#chief-obihiro', x: 42,   y: 58 },
    { id: 'tomakomai', name: '苫小牧会場', representative: '組合長 和泉',        url: '#chief-tomakomai', x: 27,   y: 61.5 },
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

// モーション減退設定（酔いやすいユーザー配慮）— JS駆動アニメはこれ広で無効化
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- オープニング演出（金のYOLOマーク → 幕が上がる / セッション初回のみ） ----
(function initIntroVeil() {
    if (REDUCED_MOTION) return;
    try {
        if (sessionStorage.getItem('yoloIntroSeen')) return;
        sessionStorage.setItem('yoloIntroSeen', '1');
    } catch (e) { return; }
    const veil = document.createElement('div');
    veil.className = 'intro-veil';
    veil.setAttribute('aria-hidden', 'true');
    const mark = document.createElement('img');
    mark.src = SCRIPT_BASE + 'assets/photos/logo/yolo-one-gold.png';
    mark.alt = '';
    veil.appendChild(mark);
    document.body.appendChild(veil);
    setTimeout(() => veil.classList.add('is-done'), 1350);
    veil.addEventListener('transitionend', () => veil.remove());
    setTimeout(() => veil.remove(), 3000);  // 保険
})();

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
    initCharSplit();
    initReveal();
    initScrollUI();
    initParallax();

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
    // stage（画像と同サイズ）にピンを置くことで、座標% = 画像上の位置になる
    const wrap = document.querySelector('.hokkaido-map-stage') || document.querySelector('.hokkaido-map-container');
    const tip  = document.getElementById('venueTooltip');
    if (!wrap || !tip) return;

    // 既存ピンがあればクリア（ホットリロード時等）
    wrap.querySelectorAll('.venue-pin').forEach(p => p.remove());

    VENUES.forEach((v, i) => {
        const a = document.createElement('a');
        a.className = 'venue-pin';
        a.dataset.venue = v.id;
        a.href = v.url || '#';
        a.style.left = v.x + '%';
        a.style.top  = v.y + '%';
        a.style.setProperty('--pd', (i * 0.13) + 's');   // ドロップの時間差
        a.setAttribute('aria-label', `${v.name}（${v.representative}）`);
        a.innerHTML = `<span class="pin__dot"></span><span class="pin__label">${v.name.replace('会場','')}</span>`;
        wrap.insertBefore(a, tip);
    });

    // 地図が見えたらピンを順番に落とす
    if (!REDUCED_MOTION && 'IntersectionObserver' in window) {
        const pinIO = new IntersectionObserver((entries) => {
            entries.forEach(en => {
                if (en.isIntersecting) { wrap.classList.add('pins-ready'); pinIO.disconnect(); }
            });
        }, { threshold: 0.25 });
        pinIO.observe(wrap);
    } else {
        wrap.classList.add('pins-ready');
    }

    const pins = wrap.querySelectorAll('.venue-pin');

    pins.forEach(pin => {
        const id = pin.dataset.venue;
        const d = VENUES.find(v => v.id === id);
        if (!d) return;

        const showTip = () => {
            tip.querySelector('.tt__venue').textContent = d.name;
            tip.querySelector('.tt__rep').textContent = d.representative;
            tip.classList.add('is-visible');
        };
        pin.addEventListener('mouseenter', (e) => { showTip(); placeTip(e, tip, wrap); });
        pin.addEventListener('mousemove', (e) => placeTip(e, tip, wrap));
        pin.addEventListener('mouseleave', () => tip.classList.remove('is-visible'));
        // キーボード操作（Tabでフォーカス）でもツールチップを表示
        pin.addEventListener('focus', () => { showTip(); placeTipAtPin(pin, tip, wrap); });
        pin.addEventListener('blur', () => tip.classList.remove('is-visible'));
        // クリックで該当会場カードへスクロール（href の #chief-xxx は CSS の scroll-behavior:smooth が処理）＋ハイライト
        pin.addEventListener('click', () => {
            tip.classList.remove('is-visible');
            const href = pin.getAttribute('href') || '';
            if (href.startsWith('#')) highlightVenueCard(href.slice(1));
        });
    });

    // venue-list があれば JSON データから再生成（各行も会場カードへのリンクに）
    const list = document.querySelector('.venue-list ul');
    if (list) {
        list.innerHTML = '';
        VENUES.forEach((v, i) => {
            const li = document.createElement('li');
            const anchor = (v.url && v.url.startsWith('#')) ? v.url : ('#chief-' + v.id);
            li.innerHTML = `<a href="${anchor}" class="venue-list__link"><span class="vno">${String(i + 1).padStart(2, '0')}</span><span class="vname">${v.name}</span><span class="vrep">${v.representative}</span></a>`;
            li.querySelector('a').addEventListener('click', () => highlightVenueCard(anchor.slice(1)));
            list.appendChild(li);
        });
    }

    // 直接 /yc/#chief-xxx で開かれた場合もハイライト
    if (location.hash && location.hash.startsWith('#chief-')) {
        setTimeout(() => highlightVenueCard(location.hash.slice(1)), 400);
    }
}

// 会場カードを一瞬ハイライト（どのカードに飛んだか分かるように）
function highlightVenueCard(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('is-target');
    void el.offsetWidth;       // アニメーション再スタート用にリフロー強制
    el.classList.add('is-target');
    setTimeout(() => el.classList.remove('is-target'), 2000);
}

function placeTip(e, tip, wrap) {
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left + 18;
    const y = e.clientY - r.top - 70;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
}

// ピン自身の位置を基準にツールチップを配置（キーボードフォーカス用）
function placeTipAtPin(pin, tip, wrap) {
    const pr = pin.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    tip.style.left = (pr.left - wr.left + pr.width / 2 + 14) + 'px';
    tip.style.top  = (pr.top - wr.top - 10) + 'px';
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
    const header = document.getElementById('siteHeader');

    const onScroll = () => {
        const h = document.documentElement;
        const max = (h.scrollHeight - h.clientHeight) || 1;
        const pct = Math.min(100, Math.max(0, (h.scrollTop / max) * 100));
        if (bar) bar.style.width = pct + '%';
        if (btn) btn.classList.toggle('is-visible', h.scrollTop > 600);
        if (header) header.classList.toggle('is-scrolled', h.scrollTop > 64);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ---- scroll reveal ----
function initReveal() {
    const targets = document.querySelectorAll(
        '.section-title, .section-sub, .yc__intro-text, .yc__intro-stats, .map-wrap, .service-card, .about__grid, .member-card, .contact__grid, .slogan-band__lead, .slogan-band__sub, .slogan-band__eyebrow, .cta-band__inner, .intro-band__inner, .page-hero__inner, .social-cta__inner, .coming-soon__inner, .chief-card, .chiefs-note, .fc-recruit__inner, .fc-point, .feature-card, .gallery-item, .stat, .marquee'
    );
    targets.forEach(el => el.classList.add('reveal'));

    // グリッド内の兄弟は 1枚ずつ時間差で出す（表示後はホバーを妨げないよう解除）
    const groups = document.querySelectorAll(
        '.service-grid, .photo-gallery, .chiefs-grid, .feature-grid, .fc-recruit__points, .yc__intro-stats, .team-grid'
    );
    groups.forEach(g => {
        [...g.children].forEach((c, i) => {
            if (c.classList.contains('reveal')) {
                c.style.transitionDelay = Math.min(i * 0.1, 0.6) + 's';
            }
        });
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('is-in');
                io.unobserve(el);
                // スタッガー完了後にディレイを解除（ホバーの transform を即応にする）
                if (el.style.transitionDelay) {
                    setTimeout(() => { el.style.transitionDelay = ''; }, 1800);
                }
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
}

// ---- 一文字ずつ出現させたい要素を span 分割 ----
function initCharSplit() {
    if (REDUCED_MOTION) return;
    document.querySelectorAll('.slogan-band__lead, .fc-recruit__title').forEach(el => {
        el.classList.add('char-split');
        let ci = 0;
        const walk = (node) => {
            [...node.childNodes].forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const frag = document.createDocumentFragment();
                    for (const ch of child.textContent) {
                        if (ch.trim() === '') { frag.appendChild(document.createTextNode(ch)); continue; }
                        const sp = document.createElement('span');
                        sp.className = 'ch';
                        sp.style.setProperty('--ci', ci++);
                        sp.textContent = ch;
                        frag.appendChild(sp);
                    }
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
                    walk(child);
                }
            });
        };
        walk(el);
    });
}

// ---- サブページヒーローのパララックス ----
function initParallax() {
    if (REDUCED_MOTION) return;
    const els = [...document.querySelectorAll('.page-hero__bg, .class-hero__bg')];
    if (!els.length) return;
    let ticking = false;
    const update = () => {
        ticking = false;
        els.forEach(el => {
            const box = el.parentElement.getBoundingClientRect();
            if (box.bottom > 0 && box.top < window.innerHeight) {
                el.style.transform = 'translateY(' + (box.top * -0.16).toFixed(1) + 'px) scale(1.12)';
            }
        });
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
}
