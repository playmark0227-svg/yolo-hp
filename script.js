// ============================================
// 株式会社YOLO
// ============================================

// 会場データ（↓ここに代表者名と会社HPを入れてください）
const venues = {
    sapporo:   { name: '札幌会場',   rep: '代表 田中太郎', url: '#' },
    asahikawa: { name: '旭川会場',   rep: '代表 佐藤花子', url: '#' },
    hakodate:  { name: '函館会場',   rep: '代表 鈴木一郎', url: '#' },
    kushiro:   { name: '釧路会場',   rep: '代表 高橋美咲', url: '#' },
    obihiro:   { name: '帯広会場',   rep: '代表 渡辺健太', url: '#' },
    kitami:    { name: '北見会場',   rep: '代表 伊藤由美', url: '#' },
    tomakomai: { name: '苫小牧会場', rep: '代表 山田翔太', url: '#' },
};

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initMap();
    initContactForm();
    initSmoothScroll();
    initReveal();
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
function initMap() {
    const pins = document.querySelectorAll('.venue-pin');
    const tip = document.getElementById('venueTooltip');
    const wrap = document.querySelector('.hokkaido-map-container');
    if (!pins.length || !tip || !wrap) return;

    pins.forEach(pin => {
        const id = pin.dataset.venue;
        const d = venues[id];
        if (d) pin.setAttribute('href', d.url);

        pin.addEventListener('mouseenter', (e) => {
            if (!d) return;
            tip.querySelector('.tt__venue').textContent = d.name;
            tip.querySelector('.tt__rep').textContent = d.rep;
            tip.classList.add('is-visible');
            placeTip(e, tip, wrap);
        });
        pin.addEventListener('mousemove', (e) => placeTip(e, tip, wrap));
        pin.addEventListener('mouseleave', () => tip.classList.remove('is-visible'));
    });
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

// ---- scroll reveal ----
function initReveal() {
    const targets = document.querySelectorAll(
        '.section-title, .section-sub, .yc__intro-text, .yc__intro-stats, .map-wrap, .service-card, .about__grid, .member-card, .contact__grid, .slogan-band__lead, .cta-band__inner'
    );
    targets.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-in');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
}
