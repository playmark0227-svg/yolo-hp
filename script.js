// ============================================
// 株式会社YOLO
// ============================================

// 会場データ（↓ここに代表者名と会社HPを入れてください）
const venues = {
    sapporo:   { name: '札幌会場',   rep: '代表 田中太郎',   url: '#' },
    asahikawa: { name: '旭川会場',   rep: '代表 佐藤花子',   url: '#' },
    hakodate:  { name: '函館会場',   rep: '代表 鈴木一郎',   url: '#' },
    kushiro:   { name: '釧路会場',   rep: '代表 高橋美咲',   url: '#' },
    obihiro:   { name: '帯広会場',   rep: '代表 渡辺健太',   url: '#' },
    kitami:    { name: '北見会場',   rep: '代表 伊藤由美',   url: '#' },
    tomakomai: { name: '苫小牧会場', rep: '代表 山田翔太',   url: '#' },
};

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initChapters();
    initMap();
    initReveal();
    initMobileNav();
    initContactForm();
});

// ---- nav scroll state ----
function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ---- chapter tab switching ----
function initChapters() {
    const btns = document.querySelectorAll('.chapter-nav__item');
    const chapters = document.querySelectorAll('.chapter');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.tab;
            btns.forEach(b => b.classList.toggle('is-active', b === btn));
            chapters.forEach(c => c.classList.toggle('is-active', c.dataset.chapter === id));
        });
    });
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
    const x = e.clientX - r.left + 16;
    const y = e.clientY - r.top - 60;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
}

// ---- scroll reveal ----
function initReveal() {
    const targets = document.querySelectorAll(
        '.hero__body, .section-head, .chapter__aside, .chapter__feature, .about__quote, .about__body, .pillar, .team-card, .contact__note, .contact__form'
    );
    targets.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-in');
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    targets.forEach(el => io.observe(el));
}

// ---- mobile nav ----
function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const links = document.querySelector('.nav__links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('is-open');
        links.classList.toggle('is-open');
        document.body.style.overflow = links.classList.contains('is-open') ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        toggle.classList.remove('is-open');
        links.classList.remove('is-open');
        document.body.style.overflow = '';
    }));
}

// ---- contact form (placeholder handler) ----
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.form__submit');
        const orig = btn.innerHTML;
        btn.innerHTML = '送りました &nbsp;✓';
        btn.style.background = 'var(--matcha-deep)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; form.reset(); }, 2600);
    });
}
