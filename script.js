/* =================================================================
   script.js — data.js の内容をHTMLに反映する処理
   （このファイルは通常編集不要です）
   ================================================================= */

// ---- localStorage から保存データを取得（なければ data.js の定数を使う） ----
function getHPData() {
  try {
    const raw = localStorage.getItem('hp_data');
    if (!raw) {
      console.info('[HP] localStorage にデータなし → data.js の初期データを使用');
      return null;
    }
    const parsed = JSON.parse(raw);
    console.info('[HP] localStorage からデータを読み込みました（保存日時:', parsed.savedAt || '不明', '）');
    return parsed;
  } catch (e) {
    console.warn('[HP] localStorage 読み込みエラー:', e.message, '→ data.js を使用');
    return null;
  }
}

// ---- ユーティリティ: 写真またはプレースホルダーを返す ----
function photoOrPlaceholder(src, alt, size) {
  if (src) {
    return `<img src="${src}" alt="${alt}" class="staff-img">`;
  }
  if (size === 'lg') {
    return `<div class="photo-dummy">
      <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="30" r="18" stroke="currentColor" stroke-width="1.5"/><path d="M10 72c0-16.6 13.4-30 30-30s30 13.4 30 30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span>写真</span></div>`;
  }
  return `<div class="photo-dummy-sm">
    <svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="22" r="12" stroke="currentColor" stroke-width="1.5"/><path d="M8 54c0-12.15 9.85-22 22-22s22 9.85 22 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </div>`;
}

// ---- テーマ（カラー・セクション写真）----
function renderTheme(theme) {
  if (!theme) return;

  // CSS カスタムプロパティを上書き（!important で style.css に勝つ）
  let st = document.getElementById('__theme_style__');
  if (!st) {
    st = document.createElement('style');
    st.id = '__theme_style__';
    document.head.appendChild(st);
  }
  const v = (key, fallback) => (theme[key] && theme[key].trim()) ? theme[key].trim() : fallback;
  st.textContent = [
    ':root {',
    `  --navy:       ${v('navy',      '#003478')} !important;`,
    `  --navy-mid:   ${v('navyMid',   '#004fa3')} !important;`,
    `  --gold:       ${v('gold',      '#b8832a')} !important;`,
    `  --gold-light: ${v('goldLight', '#d4a84b')} !important;`,
    `  --navy-bg:    color-mix(in srgb, ${v('navy','#003478')} 8%, white) !important;`,
    '}',
  ].join('\n');

  // セクション背景写真
  _applySecBg('about',     theme.photoAbout);
  _applySecBg('education', theme.photoEducation);
}

function _applySecBg(sectionId, photoDataUrl) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  if (photoDataUrl && photoDataUrl.trim()) {
    el.style.backgroundImage  = `linear-gradient(rgba(240,245,251,0.88),rgba(240,245,251,0.88)), url("${photoDataUrl}")`;
    el.style.backgroundSize   = '100% 100%, cover';
    el.style.backgroundPosition = 'center, center';
    el.style.backgroundRepeat = 'no-repeat, no-repeat';
  } else {
    el.style.removeProperty('background-image');
    el.style.removeProperty('background-size');
    el.style.removeProperty('background-position');
    el.style.removeProperty('background-repeat');
  }
}

// ---- ニュース ----
function renderNews(news) {
  const el = document.getElementById('news-ticker');
  if (!el) return;
  el.innerHTML = news.map(n => `
    <div class="news-item">
      <time class="news-date">${n.date}</time>
      <a href="${n.url}" class="news-text">${n.text}</a>
    </div>`).join('');
}

// ---- ヒーロー（背景写真・キャッチコピー） ----
function renderHero(heroData) {
  if (!heroData) heroData = {};

  // キャッチコピー
  const cpEl = document.getElementById('hero-catchphrase');
  if (cpEl) {
    const line1 = heroData.catchphraseLine1 || '診て。支えて。';
    const line2 = heroData.catchphraseEm    || '未来につなぐ。';
    cpEl.innerHTML = line1 + '<br><em>' + line2 + '</em>';
  }

  // 背景写真 — <img> 要素で確実に表示
  let bgImg = document.getElementById('__hero_photo_img__');
  if (!bgImg) {
    bgImg = document.createElement('img');
    bgImg.id  = '__hero_photo_img__';
    bgImg.alt = '';
    bgImg.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;' +
      'object-fit:cover;z-index:0;pointer-events:none;';
    const bgEl = document.getElementById('hero-bg');
    if (bgEl) bgEl.insertBefore(bgImg, bgEl.firstChild);
  }

  // 半透明ダーク・オーバーレイ（写真の上に重ねてテキスト可読性を確保）
  let overlay = document.getElementById('__hero_overlay__');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = '__hero_overlay__';
    overlay.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;';
    const bgEl = document.getElementById('hero-bg');
    if (bgEl) bgEl.appendChild(overlay);
  }

  if (heroData.photo) {
    // overlayOpacity: 0（明るい）〜 1（暗い）、デフォルト 0.45
    const op = (heroData.overlayOpacity !== undefined && heroData.overlayOpacity !== '')
      ? parseFloat(heroData.overlayOpacity)
      : 0.45;
    overlay.style.background =
      'linear-gradient(rgba(0,15,50,' + op + '),rgba(0,40,100,' + (op * 0.85).toFixed(2) + '))';

    bgImg.src             = heroData.photo;
    bgImg.style.display   = 'block';
    overlay.style.display = 'block';
    // hero-bg 本来の背景グラデを透明にして img を見えるようにする
    const bgEl = document.getElementById('hero-bg');
    if (bgEl) bgEl.style.background = 'transparent';
    console.info('[HP] ヒーロー写真を <img> で適用（' + Math.round(heroData.photo.length * 0.75 / 1024) + ' KB）');
  } else {
    bgImg.src             = '';
    bgImg.style.display   = 'none';
    overlay.style.display = 'none';
    const bgEl = document.getElementById('hero-bg');
    if (bgEl) bgEl.style.removeProperty('background');
    console.info('[HP] ヒーロー写真なし');
  }
}

// ---- 診断オーバーレイ（localhost のみ表示、6秒後に消える） ----
function showDiagnostic() {
  const isLocal = location.hostname === 'localhost'
               || location.hostname === '127.0.0.1'
               || location.port    !== '';
  if (!isLocal) return;
  try {
    const raw = localStorage.getItem('hp_data');
    const el  = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99999;background:rgba(0,0,0,0.85);color:#fff;padding:10px 14px;font-size:11px;line-height:1.7;max-width:280px;border:1px solid #555;';
    if (!raw) {
      el.innerHTML = '⚠️ <b>保存データなし</b><br>admin で「💾 保存する」を押してください';
    } else {
      const d = JSON.parse(raw);
      const photo = d.hero && d.hero.photo;
      const kb    = photo ? Math.round(photo.length * 0.75 / 1024) : 0;
      el.innerHTML =
        '💾 <b>保存データあり</b><br>' +
        'ヒーロー写真: ' + (photo ? '<span style="color:#6f6">あり（' + kb + ' KB）</span>' : '<span style="color:#f66">なし</span>') + '<br>' +
        '保存日時: ' + (d.savedAt ? new Date(d.savedAt).toLocaleTimeString('ja-JP') : '不明');
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 8000);
  } catch(e) {}
}

// ---- 科長挨拶 ----
function renderChief(chief) {
  const photoEl = document.getElementById('chief-photo');
  const nameEl  = document.getElementById('chief-name');
  const msgEl   = document.getElementById('chief-message');

  if (photoEl) photoEl.innerHTML = photoOrPlaceholder(chief.photo, chief.name, 'lg');
  if (nameEl) {
    nameEl.querySelector('strong').textContent = chief.name + ' 教授';
    nameEl.querySelector('span').textContent   = chief.title;
  }
  if (msgEl) {
    const [lead, ...rest] = chief.greeting;
    msgEl.innerHTML = `<p class="about-lead">${lead}</p>` +
      rest.map(p => `<p>${p}</p>`).join('');
  }
}

// ---- スタッフカード（showCard: true） ----
function renderStaffCards(staff) {
  const el = document.getElementById('staff-cards');
  if (!el) return;
  el.innerHTML = staff.filter(s => s.showCard).map(s => `
    <article class="staff-card">
      <div class="staff-photo">${photoOrPlaceholder(s.photo, s.name, 'sm')}</div>
      <div class="staff-body">
        <h4>${s.name}</h4>
        <p class="staff-rank">${s.rank}</p>
        <p class="staff-spec">専門：${s.specialty}</p>
      </div>
    </article>`).join('');
}

// ---- スタッフ一覧テーブル ----
function renderStaffTable(staff) {
  const el = document.getElementById('staff-table-body');
  if (!el) return;
  el.innerHTML = staff.map(s => `
    <tr><td>${s.name}</td><td>${s.rank}</td><td>${s.specialty}</td></tr>`).join('');
}

// ---- 非常勤・名誉教授テーブル ----
function renderNonregularTable(staffNonregular) {
  const el = document.getElementById('nonregular-table-body');
  if (!el) return;
  el.innerHTML = staffNonregular.map(s => `
    <tr><td>${s.name}</td><td>${s.rank}</td><td>${s.specialty}</td></tr>`).join('');
}

// ---- 研究テーマ ----
function renderResearch(research) {
  const el = document.getElementById('research-areas');
  if (!el) return;
  el.innerHTML = research.map((r, i) => `
    <div class="research-item">
      <span class="research-num">${String(i + 1).padStart(2, '0')}</span>
      <h3>${r.title}</h3>
      <p>${r.desc}</p>
    </div>`).join('');
}

// ---- 業績・論文 ----
function renderPublications(publications) {
  const el = document.getElementById('pub-list');
  if (!el) return;
  el.innerHTML = publications.map(p => `
    <li class="pub-item">
      <span class="pub-year">${p.year}</span>
      <div>
        <p class="pub-title">${p.title}</p>
        <p class="pub-meta">${p.meta}</p>
      </div>
    </li>`).join('');
}

// ---- 研修プログラム ----
function renderTraining(training) {
  const el = document.getElementById('training-steps');
  if (!el) return;
  el.innerHTML = training.map(t => `
    <div class="step-item">
      <span class="step-tag">${t.tag}</span>
      <div class="step-body">
        <h4>${t.heading}</h4>
        <p>${t.desc}</p>
      </div>
    </div>`).join('');
}

// ---- 先輩医師の声 ----
function renderVoices(voices) {
  const el = document.getElementById('voices-list');
  if (!el) return;
  const personIcon = `<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="15" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M5 36c0-8.3 6.7-15 15-15s15 6.7 15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  el.innerHTML = voices.map(v => `
    <div class="voice-card">
      <div class="voice-meta">
        <div class="voice-avatar">${personIcon}</div>
        <div><strong>${v.name}</strong><span>${v.role}</span></div>
      </div>
      <p>${v.comment}</p>
    </div>`).join('');
}

// ---- イベントギャラリー（横スクロール） ----
function renderEvents(events) {
  const trackEl = document.getElementById('events-track');
  if (!trackEl) return;
  if (!events || events.length === 0) { trackEl.innerHTML = ''; return; }

  const cameraIcon = `<svg viewBox="0 0 60 60" fill="none"><rect x="6" y="14" width="48" height="36" rx="3" stroke="currentColor" stroke-width="1.5"/><circle cx="30" cy="30" r="9" stroke="currentColor" stroke-width="1.5"/><circle cx="47" cy="22" r="2" fill="currentColor"/></svg>`;

  trackEl.innerHTML = events.map(ev => `
    <div class="event-scroll-card">
      ${ev.photo
        ? `<img src="${ev.photo}" alt="${ev.title}" class="event-img">`
        : `<div class="event-no-photo">${cameraIcon}<span>${ev.title || 'イベント写真'}</span></div>`
      }
      <span class="event-label">${ev.title}${ev.year ? ' ' + ev.year : ''}</span>
    </div>`).join('');
}

// ---- 横スクロール ボタン操作 ----
function scrollCarousel(trackId, dir) {
  const track = document.getElementById(trackId);
  if (!track) return;
  const card = track.querySelector(':scope > *');
  if (!card) return;
  track.scrollBy({ left: dir * (card.offsetWidth + 18), behavior: 'smooth' });
}

// ---- 連絡先（contactセクション） ----
function renderContact(contact) {
  const el = document.getElementById('contact-info-block');
  if (!el) return;
  el.innerHTML = `
    <h3 class="sub-heading">${contact.dept}</h3>
    <dl class="contact-dl">
      <dt>住所</dt><dd>${contact.address}</dd>
      <dt>電話（代表）</dt><dd>${contact.tel}</dd>
      ${contact.ext ? `<dt>外来受付内線</dt><dd>${contact.ext}</dd>` : ''}
      <dt>初診受付</dt><dd>${contact.reception.shinshin}</dd>
      <dt>再診受付</dt><dd>${contact.reception.saishin}</dd>
      <dt>休診日</dt><dd>${contact.reception.kyushin}</dd>
    </dl>`;

  // Google マップ
  const mapEl = document.getElementById('map-block');
  if (!mapEl) return;

  // mapUrl が設定されていればそのまま使用、なければ住所から自動生成
  const rawUrl = (contact.mapUrl && contact.mapUrl.trim()) ? contact.mapUrl.trim() : null;
  const autoUrl = 'https://maps.google.com/maps?q=' +
    encodeURIComponent(contact.address) +
    '&t=&z=16&ie=UTF8&iwloc=&output=embed';
  const src = rawUrl || autoUrl;

  mapEl.innerHTML = `
    <div class="map-wrap">
      <iframe
        src="${src}"
        width="100%" height="100%"
        style="border:0;"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="金沢医科大学病院 地図">
      </iframe>
    </div>
    <a class="map-link"
       href="https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}"
       target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
        <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
      </svg>
      Google マップで開く
    </a>`;
}

// ---- フッター連絡先 & SNS ----
function renderFooter(contact) {
  const nameEl = document.getElementById('footer-dept-name');
  const infoEl = document.getElementById('footer-contact');
  if (nameEl) nameEl.textContent = contact.dept;
  if (infoEl) infoEl.innerHTML =
    `${contact.address}<br>TEL: ${contact.tel}` +
    (contact.ext ? `　内線: ${contact.ext}` : '');

  // SNS アイコン
  const s = contact.social || {};
  const socialItems = [
    {
      key: 'x', url: s.x, label: 'X (Twitter)',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    },
    {
      key: 'instagram', url: s.instagram, label: 'Instagram',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`
    },
    {
      key: 'facebook', url: s.facebook, label: 'Facebook',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
    },
  ];

  const visibleItems = socialItems.filter(item => item.url && item.url.trim() !== '');
  const sectionEl = document.getElementById('footer-social');
  const linksEl   = document.getElementById('social-links');

  if (sectionEl && linksEl) {
    if (visibleItems.length > 0) {
      linksEl.innerHTML = visibleItems.map(item =>
        `<a href="${item.url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${item.label}">${item.svg}</a>`
      ).join('');
      sectionEl.style.display = 'block';
    } else {
      sectionEl.style.display = 'none';
    }
  }
}

// ================================================================
// DOM 読み込み後に実行
// ================================================================
document.addEventListener('DOMContentLoaded', () => {

  // localStorage に保存データがあればそちらを優先、なければ data.js の定数を使う
  const saved = getHPData();
  const news            = saved ? saved.news            : NEWS;
  const chief           = saved ? saved.chief           : CHIEF;
  const staff           = saved ? saved.staff           : STAFF;
  const staffNonregular = saved ? saved.staffNonregular : STAFF_NONREGULAR;
  const events          = saved ? saved.events          : EVENTS;
  const contact         = saved ? saved.contact         : CONTACT;
  const research        = saved ? saved.research        : (typeof RESEARCH !== 'undefined' ? RESEARCH : []);
  const publications    = saved ? saved.publications    : (typeof PUBLICATIONS !== 'undefined' ? PUBLICATIONS : []);
  const training        = saved ? saved.training        : (typeof TRAINING !== 'undefined' ? TRAINING : []);
  const voices          = saved ? saved.voices          : (typeof VOICES !== 'undefined' ? VOICES : []);
  // hero: saved に hero キーがない（旧データ）場合は HERO 定数を使う
  const heroData        = (saved && saved.hero != null)
                          ? saved.hero
                          : (typeof HERO !== 'undefined' ? HERO : {});
  const themeData       = (saved && saved.theme != null)
                          ? saved.theme
                          : (typeof THEME !== 'undefined' ? THEME : {});

  // data.js の内容をページに反映（テーマを最初に適用して色ちらつきを防ぐ）
  renderTheme(themeData);
  renderHero(heroData);
  renderNews(news);
  renderChief(chief);
  renderStaffCards(staff);
  renderStaffTable(staff);
  renderNonregularTable(staffNonregular);
  renderEvents(events);
  renderContact(contact);
  renderFooter(contact);
  renderResearch(research);
  renderPublications(publications);
  renderTraining(training);
  renderVoices(voices);

  // --- ヘッダー スクロール ---
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // --- モバイルメニュー ---
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  navToggle.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('active', open);
  });
  mobileNav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      navToggle.classList.remove('active');
    })
  );

  // --- スムーススクロール ---
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 68, behavior: 'smooth' });
    });
  });

  // --- スクロールフェードイン ---
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }),
    { threshold: 0.08 }
  );
  const fadeTargets = '.qnav-item,.clinical-card,.research-item,.pub-item,.step-item,.voice-card,.recruit-banner';
  document.querySelectorAll(fadeTargets).forEach((el, i) => {
    el.classList.add('fade-up');
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    io.observe(el);
  });

  // 動的生成カードのフェードイン（少し遅らせて適用）
  setTimeout(() => {
    document.querySelectorAll('#staff-cards .staff-card, #events-track .event-scroll-card').forEach((el, i) => {
      el.classList.add('fade-up');
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
  }, 50);

  // --- ナビ アクティブ強調 ---
  const navLinks = document.querySelectorAll('.nav-list a');
  const activeIO = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) navLinks.forEach(a => {
        const active = a.getAttribute('href') === '#' + e.target.id;
        a.style.color      = active ? 'var(--black)' : '';
        a.style.fontWeight = active ? '600' : '';
      });
    }),
    { rootMargin: '-40% 0px -55% 0px' }
  );
  document.querySelectorAll('section[id]').forEach(s => activeIO.observe(s));

  // --- お問い合わせフォーム ---
  document.getElementById('contactForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form    = e.target;
    const toast   = document.getElementById('toast');
    const btn     = form.querySelector('button[type="submit"]');
    const email   = (contact && contact.formEmail && contact.formEmail.trim()) || '';

    // メアドが未設定の場合は案内を表示
    if (!email) {
      toast.textContent = '⚠️ 送信先メールアドレスが設定されていません（管理画面で設定してください）';
      toast.classList.add('show', 'toast-warn');
      setTimeout(() => { toast.classList.remove('show','toast-warn'); toast.textContent = 'お問い合わせを送信しました。'; }, 5000);
      return;
    }

    // ボタンを送信中状態に
    const origText = btn.textContent;
    btn.textContent = '送信中…';
    btn.disabled = true;

    try {
      const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    new FormData(form),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== 'false') {
        toast.textContent = '✅ お問い合わせを送信しました。';
        toast.classList.add('show');
        form.reset();
        setTimeout(() => toast.classList.remove('show'), 4000);
      } else {
        throw new Error(json.message || '送信に失敗しました');
      }
    } catch (err) {
      toast.textContent = '❌ 送信できませんでした。お電話でお問い合わせください。';
      toast.classList.add('show', 'toast-error');
      setTimeout(() => { toast.classList.remove('show','toast-error'); toast.textContent = 'お問い合わせを送信しました。'; }, 6000);
      console.error('[Form]', err);
    } finally {
      btn.textContent = origText;
      btn.disabled = false;
    }
  });
});
