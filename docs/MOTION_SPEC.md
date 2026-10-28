# MOTION_SPEC.md — Spesifikasi Sistem Animasi & Koreografi

> **Proyek**: Portofolio Aryo Ristiawan Machfudz (`https://aryomachfudz.vercel.app/`)  
> **Tema Visual**: *Technical HUD / Swiss Engineering Editorial* (Dark Dossier, Cyber-Physical Telemetry)  
> **Tujuan**: Merancang sistem gerak yang kohesif, responsif, dan taktis dengan mengadopsi prinsip kehalusan *Lando Norris — On Track* tanpa mengorbankan integritas identitas visual yang sudah ada.  
> **Prinsip Dasar**:
> - *Spend your boldness in one place* (`frontend-design`): Satu sekuens pembuka (Hero) yang terorkestrasi matang, bukan efek berserakan di setiap sudut.
> - *Unseen details compound* (`emil-design-eng`): Easing asimetris, mikro-interaksi instan (< 200ms), zero `linear`, zero `scale(0)`, serta animasi berbasis GPU transform & opacity.
> - *Kosa Kata Presisi* (`animation-vocabulary`): Menggunakan terminologi standar industri untuk setiap pola gerak.

---

## 1. Fondasi Motion Tokens

Semua token gerak didefinisikan secara sentral untuk digunakan serentak oleh **CSS Variables**, **Motion (Framer Motion)**, dan **GSAP**.

### 1.1 Timing Tokens & Kurva Easing

UI interaktif **dilarang keras** menggunakan `ease-in` atau `linear`. Gerakan yang merespons pengguna harus selalu menggunakan `ease-out` agresif (cepat di awal, meredam di akhir). Khusus animasi *scroll-scrub* (yang terikat langsung 1:1 dengan roda scroll), easing diatur ke `none` karena akselerasi dan deselerasi diatur sepenuhnya oleh momentum inersia Lenis.

```typescript
// src/lib/motion-tokens.ts
export const MOTION_TIMINGS = {
  instant: 0.12,   // 120ms: press feedback, hover state, tab underline indicator
  snappy: 0.2,     // 200ms: tooltip, dropdown, quick badges, bracket expansion
  standard: 0.35,  // 350ms: scramble text, panel reveal, modal dialog
  deliberate: 0.6, // 600ms: card scroll reveal, section transition
  cinematic: 0.95, // 950ms: hero headline kinetic mask, topographic line draw
} as const;

export const MOTION_EASINGS = {
  // 1. Primary UI Ease-Out: Sangat responsif, hentakan instan di awal
  easeOutStrong: [0.23, 1, 0.32, 1] as const, // cubic-bezier(0.23, 1, 0.32, 1)
  
  // 2. Cinematic Expo-Out: Untuk entrance elemen berbobot besar
  easeOutExpo: [0.16, 1, 0.3, 1] as const,   // cubic-bezier(0.16, 1, 0.3, 1)
  
  // 3. Smooth In-Out: Khusus pergerakan elemen yang sudah ada di viewport (tab swap, modal re-center)
  easeInOutStrong: [0.77, 0, 0.175, 1] as const,
  
  // 4. GSAP String Equivalents
  gsapEaseOut: "power3.out",
  gsapEaseExpo: "expo.out",
  gsapScrub: "none", // Wajib untuk scrubbed timeline agar tidak melawan inersia Lenis
} as const;

export const SPRING_PHYSICS = {
  // Tombol, badge, arrow drift: Sangat kaku, redaman tinggi, tanpa goyangan berlebih
  snappy: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 },
  
  // Layout shift, active pill transition (layoutId): Mengikuti gerak tanpa lag
  layout: { type: "spring", stiffness: 350, damping: 28, mass: 0.9 },
  
  // Dialog modal & drawer: Halus, tidak memantul liar
  modal: { type: "spring", stiffness: 220, damping: 24, mass: 0.95 },
} as const;
```

Dalam CSS global (`globals.css`):
```css
:root {
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  
  --duration-instant: 120ms;
  --duration-snappy: 200ms;
  --duration-standard: 350ms;
  --duration-deliberate: 600ms;
}
```

### 1.2 Spatial Translation Tokens (Jarak Translasi)

Hindari pergeseran piksel yang terlalu jauh karena memicu mabuk gerak (*motion sickness*) dan memecah fokus mata:
- **Micro (`2px - 4px`)**: Arrow drift, button active compress (`scale: 0.97`), corner bracket hover offset (`±1.5px`).
- **Standard (`8px - 14px`)**: Dropdown, tooltip, tab switch content glide.
- **Section Entry (`20px - 28px`)**: Card entrance, list stagger cascade (maksimal 28px, dilarang > 40px).
- **Mask Kinetic (`100%`)**: Teks mask slide-up (`overflow: hidden` + `yPercent: 100%` -> `0%`).

### 1.3 Stagger Rules
- **Delay per item**: `40ms – 60ms`. Dilarang menggunakan stagger > 80ms karena membuat antarmuka terasa lambat (*sluggish*).
- **Stagger Cap**: Sekuens stagger untuk daftar panjang (misal 52 minggu heatmap GitHub atau puluhan pill) tidak boleh melebihi total waktu **320ms**. Elemen selebihnya muncul serentak.

---

## 2. Arsitektur Sinkronisasi Jam (Clock Architecture)

Untuk menyelesaikan isu "Tiga Jam Animasi" pada audit (P1-1), seluruh sistem gerak disatukan ke dalam **satu loop referensi waktu utama**:

```mermaid
flowchart TD
    RAF["gsap.ticker (Single Primary Clock)"]
    RAF -->|lagSmoothing: 0| LENIS["Lenis Virtual Scroll Engine"]
    LENIS -->|lenis.on('scroll')| ST["ScrollTrigger.update()"]
    RAF -->|Uniform Time Delta| SHADER["PortraitAuraCanvas (Three.js WebGL)"]
    ST -->|Scroll-Scrubbed Progress| PARALLAX["Section Parallax & Line Drawing"]
    
    subgraph UI_ISOLATION["UI Thread Safe"]
      CSS_SPRING["CSS Hardware Transitions & Motion layoutId"]
    end
```

1. **Lenis + GSAP**: Dipertahankan pada `gsap.ticker.add((time) => lenis.raf(time * 1000))` dengan `gsap.ticker.lagSmoothing(0)`.
2. **Three.js Portrait Aura Shader**: Loop `requestAnimationFrame` mandiri di dalam `PortraitAuraCanvas.tsx` dihentikan. Waktu animasi (`uTime`) dan pemanggilan render diikat langsung ke `gsap.ticker` atau di-pause otomatis menggunakan `IntersectionObserver` saat hero berada di luar viewport (`boundingClientRect.bottom < 0`).
3. **Dynamic Refresh Bus**: Setiap perubahan layout (toggle *Carousel vs Grid* di Projects, switch *Work vs Organization* tab di Experience) wajib memancarkan pemanggilan debounced `ScrollTrigger.refresh()`.

---

## 3. Koreografi Per Section

Sistem gerak dirancang bertahap mengikuti perjalanan gulir (*scroll narrative*) dari landing page hingga case study.

```
[ HERO STAGE ]         -> Orchestrated Entrance: Canvas + Mask + Scramble + Stat Ticker
       │
[ SKILLS ARSENAL ]     -> Telemetry Decode + Bracket Frame Snap + Interactive Pill Hover
       │
[ ACHIEVEMENTS ]       -> National Champion Badge Shimmer + Structural Panel Reveal
       │
[ SELECTED PROJECTS ]  -> Clean Kinetic Title + Viewport-Aware Carousel + Bracket Expansion
       │
[ EXPERIENCE SPINE ]   -> Scroll-Scrubbed Line Drawing (Spine) + Instant Track Switch
       │
[ GITHUB TELEMETRY ]   -> SSR-Hydrated Clean Entrance + Uncontrolled Matrix Tooltip
       │
[ TRANSMISSION/FOOTER] -> Intentional Cyber Glitch on Enter (Single-Shot) + Telemetry Colophon
```

---

### 3.1 Hero Section (`#hero`) — *The Single Orchestrated Moment*
Hero adalah satu-satunya momen panggung yang diizinkan memiliki durasi di atas 500ms. Seluruh elemen harus sinkron, tidak boleh ada pop-in tiba-tiba.

| Elemen | Kosa Kata Gerak | Parameter / Easing | Keterangan & Anti-FOUC |
| :--- | :--- | :--- | :--- |
| **Topographic Bg** | *Line drawing* / *Fade in* | Opacity `0` -> `0.06`, durasi `800ms`, `easeOutExpo` | Digambar halus di background saat awal mount. |
| **Giant Display Name ("ARYO MACHFUDZ")** | *Kinetic reveal* | Mask container `overflow: hidden`, `yPercent: 105%` -> `0%`, durasi `750ms`, `power3.out` | Dibungkus dalam tag ber-overflow clip; CSS class default memiliki `visibility: visible`. |
| **Three.js Aura Portrait** | *Crossfade* / *Aura dissolve* | Metallic Aura hold `400ms` -> dissolve noise `700ms` via shader cubic curve | Kanvas WebGL diaktifkan setelah tekstur terunggah; tidak boleh ada canvas putih kosong. |
| **HUD Subtitles (Location, IPB, Role)** | *Stagger fade & slide* | `y: 12px` -> `0px`, opacity `0` -> `1`, durasi `400ms`, stagger `50ms` | Muncul tepat saat nama utama mencapai 60% perjalanan (orchestrated delay `300ms`). |
| **Telemetry Blocks (At a Glance)** | *Number ticker* & *Scramble* | Angka `0` -> target (`4+`, `3.83`, `1`), durasi `650ms`, `tabular-nums` | Nilai angka bergulir presisi; label `"SYS.HUD"` menjalankan scramble text. |
| **Hero Parallax on Scroll** | *Parallax scrub* | Portrait: `y: 0` -> `-45px`, Anton text: `y: 0` -> `+25px`, durasi scroll `100vh` | Menggunakan `ScrollTrigger` scrub: `0.5`, `ease: "none"`. Menciptakan kedalaman ruang seperti referensi Lando Norris. |

---

### 3.2 Skills Section (`#skills`) — *Technical Arsenal Matrix*
Fokus: Ketelitian bracket corner dan interaktivitas antar modul.

| Elemen | Kosa Kata Gerak | Parameter / Easing | Keterangan |
| :--- | :--- | :--- | :--- |
| **Header `SYS.HUD // 02`** | *Scramble text* | Durasi `350ms`, glyph set `_ / # [ ] 0 1 X` | Terpicu sekali saat `start: "top 75%"`. |
| **Heading "SKILLS"** | *Kinetic reveal* | `yPercent: 105%` -> `0%`, durasi `600ms`, `power3.out` | Bebas dari blur multi-elemen. |
| **3 Bracket Cards** | *Staggered scroll reveal* | `y: 20px` -> `0px`, scale `0.98` -> `1`, opacity `0` -> `1`, stagger `70ms`, durasi `500ms` | Trigger di `top 75%` (bukan 85%) agar animasi terlihat saat mata tiba. |
| **Corner Brackets `┌ ┐ └ ┘`** | *Line drawing* / *Snap* | Scale `0.85` -> `1.0`, opacity `0` -> `1`, durasi `300ms` | Memisahkan CSS hover dari GSAP tween agar tidak saling tarik-menarik. |
| **Interactive Tech Pills** | *Tactile spring hover* | Hover: `translateY(-2px)`, scale `1.02`. Active: `scale(0.97)`. Spring `snappy` | Saat di-hover, linked case studies di bagian bawah kartu memancarkan highlight warna emerald seketika. |

---

### 3.3 Achievements Section (`#achievements`) — *Honors & Recognition*
Fokus: Menghadirkan wibawa piala kejuaraan nasional (*Juara 1 Prisma Fest*) tanpa kesan norak.

| Elemen | Kosa Kata Gerak | Parameter / Easing | Keterangan |
| :--- | :--- | :--- | :--- |
| **Header `SYS.HUD // 03`** | *Scramble text* | Durasi `350ms` | Konsisten dengan seluruh section header. |
| **Champion Badge** | *Subtle sheen / Shimmer* | CSS background gradient shift dari kiri ke kanan, durasi `1.8s`, delay `600ms` setelah muncul | Sheen halus satu kali putar saat pertama terlihat, tidak meloop berulang kali. |
| **Card Container** | *Panel reveal* | `clip-path: inset(0 0 20px 0)` -> `inset(0 0 0 0)` + opacity `0` -> `1`, durasi `550ms` | Gaya buka panel militer/dossier teknis. |
| **Preview Image** | *Subtle scale on hover* | Hover pada frame kartu: gambar scale `1.0` -> `1.03`, durasi `400ms`, `easeOutStrong` | Frame tetap mengunci dengan `overflow: hidden`. |

---

### 3.4 Selected Projects Section (`#projects`) — *Production Portfolio*
Fokus: Menyederhanakan tipografi judul dan memastikan fluiditas peralihan mode *Carousel ↔ Grid*.

| Elemen | Kosa Kata Gerak | Parameter / Easing | Keterangan |
| :--- | :--- | :--- | :--- |
| **Judul "SELECTED PROJECTS"** | *Kinetic reveal* | Bersatu dalam satu timeline tanpa bounce: `yPercent: 100%` -> `0%`, durasi `650ms`, `power3.out` | **Menghapus SplitText bounce** (`back.out`) dan filter blur per huruf yang membebani GPU. |
| **View Switcher Pill** | *Layout animation* | Motion `layoutId="project-view-mode-pill"`, spring `layout` | Perpindahan instan tanpa lag. |
| **Carousel Drag (View A)** | *Drag momentum & rubber-banding* | `dragConstraints` dihitung dinamis via ResizeObserver: `-(cardWidth + gap) * count`. Spring settling | Adaptif otomatis pada layar mobile (lebar `85vw`) vs desktop (`560px`). |
| **Grid Toggle (View B)** | *Layout animation* | `AnimatePresence mode="popLayout"`, durasi `250ms`, `easeOutStrong` | Setelah animasi selesai, jalankan `ScrollTrigger.refresh()`. |
| **Case Study Preview Modal** | *Origin-aware / Modal pop* | Backdrop: opacity `0` -> `1` (160ms). Dialog: scale `0.96` -> `1.0`, y `10px` -> `0` via `SPRING_PHYSICS.modal` | Mengunci Lenis scroll (`lenis.stop()`), fokus keyboard pada tombol tutup. |

---

### 3.5 Experience & Timeline Section (`#timeline`) — *Engineering Cadence*
Fokus: Garis alur karir (*spine*) yang tergambar dinamis mengikuti pergerakan scroll.

| Elemen | Kosa Kata Gerak | Parameter / Easing | Keterangan |
| :--- | :--- | :--- | :--- |
| **Timeline Spine Line** | *Scroll-driven line drawing* | SVG `<line>` atau `<div>` vertical height scale `0%` -> `100%`, terikat `ScrollTrigger` scrub: `true` | Garis vertebra timeline "mengalir" ke bawah seiring user menggulir layar. |
| **Spine Nodes (`●`)** | *State indication* | Node bertransformasi dari `border-border-subtle` ke `border-accent-primary bg-accent-primary` saat kepala garis spine melewatinya | Menggunakan trigger per node: `start: "top center"`. |
| **Track Switcher (Work vs Org)** | *Accordion / Layout continuity* | Panel aktif: opacity `0` -> `1`, `y: 6px` -> `0px`, durasi `200ms`. Underline: `layoutId="activeExperienceTab"` | Panel inactive tetap ada di DOM (`hidden` attribute) untuk zero-layout-shift dan SEO. |

---

### 3.6 GitHub Telemetry Section (`#github`) — *Live Code Matrix*
Fokus: Zero-FOUC saat SSR, performansi rendering sel heatmap, dan tooltip instan.

| Elemen | Kosa Kata Gerak | Parameter / Easing | Keterangan |
| :--- | :--- | :--- | :--- |
| **Section Wrapper** | *Scroll reveal* | SSR aman: HTML dirender terlihat (`opacity: 1`), GSAP `from` hanya aktif jika JS siap | **Menghilangkan `initial={{ opacity: 0 }}` pada SSR** untuk mencegah konten tak terlihat tanpa JS. |
| **371 Sel Matrix** | *Hardware-accelerated scale* | CSS `:hover`: `transform: scale(1.3); z-index: 20;`, transition `120ms var(--ease-out-strong)` | **Dilarang memicu React re-render state** pada seluruh section hanya untuk menampilkan teks tanggal. |
| **Matrix Tooltip / Status** | *Direct DOM update* | Tulisan status di-update via direct ref DOM textContent atau floating CSS tooltip | Zero rendering overhead, 120 FPS buttery smooth saat kursor melintasi ratusan sel. |
| **Year Switch Transition** | *Crossfade* | Grid matrix memudar tipis `opacity: 0.6` -> `1.0` (durasi `180ms`) saat berganti tahun | Responsif dan tidak ada layout jumping. |

---

### 3.7 Transmission & Contact Footer (`#contact`) — *Mission Control Transmission*
Fokus: Mengurangi kejenuhan glitch teks dan menyajikan mikro-interaksi kontak taktis.

| Elemen | Kosa Kata Gerak | Parameter / Easing | Keterangan |
| :--- | :--- | :--- | :--- |
| **Status Beacon Pulse** | *Ambient pulse* | `animate-ping` lembut pada LED hijau ketersediaan | Menandakan sistem online. |
| **Giant "LET'S WORK." Glitch** | *Shake / Skew glitch* | Timeline durasi `180ms`, displacement `x: ±3px`, `skewX: ±5deg`, pseudo-element chromatic | **Hanya dipicu 1x saat first entrance** (`onEnter`), atau saat user melakukan hover/klik langsung. **Hapus pemicu `onEnterBack`** untuk menghindari *animation fatigue*. |
| **Contact Action Cards** | *Direction-aware hover* | Bracket bergeser keluar `1.5px`, panah pojok bergeser diagonal `(3px, -3px)` dengan spring `snappy` | Interaksi responsif di bawah 160ms. |
| **Copy Email Button** | *Morph / Feedback* | Ikon berganti dari `Copy` ke `Check` dengan skala `0.95` -> `1.0`, pesan pop-up muncul instan | Memberikan konfirmasi fisik bahwa aksi berhasil. |

---

## 4. Spesifikasi HUD Micro-Interactions

### 4.1 Scramble Text Utility (`SYS.HUD // 0X`)
Label diagnostik teknis akan melakukan "dekoding karakter" saat pertama kali terlihat.

- **Karakter Glitch**: `["#", "$", "%", "&", "_", "/", "0", "1", "X", "Z", ">", "<"]`
- **Durasi Total**: `350ms` (maksimal 400ms agar keterbacaan tidak terganggu).
- **Frekuensi Perubahan**: Pergantian karakter acak setiap `35ms` (total ~10 iterasi) sebelum mengunci ke teks asli dari kiri ke kanan.
- **Implementasi**: Custom hook `useScrambleText(text, triggerInView)` yang murni memanipulasi string tanpa reflow tata letak (memastikan lebar kontainer menggunakan monospace `font-mono`).

### 4.2 Spring Number Ticker (`4+`, `3.83`, `1`)
Angka vital berputar cepat dari nol ke nilai target.

- **Durasi**: `550ms` (dengan kurva `expo.out`).
- **Tabular Compliance**: Wajib disematkan class `tabular-nums` agar lebar karakter seragam dan tidak menyebabkan getaran horizontal (*layout jitter*).
- **Desimal Handling**: Untuk GPA `3.83`, angka berputar dari `0.00` hingga `3.83` dengan pembulatan dua desimal presisi pada setiap frame.

### 4.3 Technical Frame Line-Drawing (`stroke-dashoffset`)
Batas garis frame dan corner bracket ditarik dari titik simpul.

- Menggunakan teknik SVG `stroke-dasharray` yang sama dengan panjang path, dimulai dari `stroke-dashoffset: pathLength` ke `0`.
- Durasi: `400ms`, `ease: "power2.out"`.
- Memberikan impresi skema blueprint CAD yang sedang dirender oleh mesin sistem.

---

## 5. Blueprint Transisi Antar Halaman (`/` <-> `/projects/[slug]`)

Transisi halaman saat ini (fade blur global di `template.tsx`) digantikan dengan arsitektur **Shared Element & Directional View Transition** yang selaras dengan kapabilitas Next.js 16.4 dan React 19.3.

```
NAVIGASI: / (Home) ──[KLIK KARTU PROYEK]──> /projects/[slug]
   │
   ├─ 1. Header Navigation: Terkunci di tempat (viewTransitionName: 'site-header')
   │     -> Tidak bergeser, tidak berkedip. Menjadi anchor visual pengguna.
   │
   ├─ 2. Shared Element Morph:
   │     -> Thumbnail ProjectVisualPreview di grid membesar secara kontinu 
   │        menjadi Banner Showcase di halaman detail.
   │
   ├─ 3. Content Directional Slide:
   │     -> Konten lama meluncur tipis ke kiri (-30px, fade out 140ms).
   │     -> Konten detail masuk dari kanan (+30px, fade in 220ms).
   │
   └─ 4. Navigasi Balik ("BACK TO PROJECTS"):
         -> Membawa transitionType=['nav-back'].
         -> Konten meluncur terbalik (ke kanan).
         -> Hash anchor /#projects dituju mulus tanpa benturan scrollTo(0).
```

### 5.1 Spesifikasi Teknis View Transitions
1. **Penghapusan Global Blur di `template.tsx`**:
   - `filter: blur(2px)` dihapus dari wrapper halaman.
   - Digantikan dengan deklarasi murni `<ViewTransition>` atau transisi transform/opacity Motion ringan (`y: 8px` -> `0px`, opacity `0` -> `1`, durasi `200ms`).
2. **Penyelarasan Scroll Hash**:
   - `scrollTo(0, { immediate: true })` di `template.tsx` diubah menjadi kondisional: jika target URL memiliki hash `#projects` atau `#achievements`, serahkan kendali scroll ke `lenis.scrollTo(hash)` dengan delay `50ms` setelah DOM commit.
3. **Penyematan Identitas Elemen Bersama (*Shared Names*)**:
   - Pada kartu ringkasan: `<div style={{ viewTransitionName: `project-cover-${slug}` }}>`.
   - Pada halaman detail `[slug]/page.tsx`: `<div style={{ viewTransitionName: `project-cover-${slug}` }}>`.
   - Durasi morphing antar rute: `320ms`, kurva `cubic-bezier(0.23, 1, 0.32, 1)`.

---

## 6. Aksesibilitas (`prefers-reduced-motion`) & Adaptasi Mobile

### 6.1 Protokol Reduced-Motion
Animasi tidak dihilangkan hingga 0%, melainkan **diubah sifatnya dari spasial menjadi opasitas**:

- **Bypass Lenis Hijacking**: `SmoothScrollProvider` segera mengembalikan kontrol scrolling ke browser native (`lenis.destroy()`).
- **Zero Spatial Movement**: Semua properti `y`, `x`, `scale`, dan `rotate` diabaikan (`transform: none`). Elemen muncul instan di posisi akhirnya.
- **Transisi Opasitas Lembut**: Transisi visual diganti dengan crossfade opasitas singkat (`100ms - 150ms`) untuk mencegah pergantian konten yang mengejutkan.
- **Glitch & Shimmer Nonaktif**: Efek RGB chromatic aberration dan sheen pada tombol/heading dimatikan sepenuhnya.

### 6.2 Adaptasi Mobile & Layar Sentuh (< 640px)
- **Hover Disabling**: Semua efek hover (`scale(1.02)`, `translateY(-2px)`, border illumination) dibungkus secara disiplin di balik:
  ```css
  @media (hover: hover) and (pointer: fine) { ... }
  ```
  Ini mencegah status hover "tersangkut" (*stuck hover*) saat pengguna mengetuk layar ponsel.
- **Carousel Physics**: Jarak drag dibatasi berdasarkan lebar dinamis `85vw + gap`. Resistensi tarikan ujung (*rubber-banding damping*) ditingkatkan menjadi `0.25` agar terasa mantap.
- **Shader Pixel Ratio**: Pada layar seluler resolusi tinggi, batas `devicePixelRatio` kanvas Three.js diturunkan dari `2.0` ke `1.25` guna menghemat daya baterai dan mencegah penurunan frame.
- **Mobile Navigation Drawer**: Saat hamburger dibuka, panggil `stopScroll()` dari Lenis context. Animasi buka menu menggunakan durasi asimetris: **Buka 200ms**, **Tutup 120ms**.

---

## 7. Anggaran Performa (Performance Budget)

| Parameter | Target Minimum | Strategi Pencapaian |
| :--- | :--- | :--- |
| **Target Frame Rate** | **60 FPS** (Mid-range Mobile) / **120 FPS** (ProMotion Desktop) | Hanya menganimasikan `transform` dan `opacity` (skip layout & paint). |
| **Interaction to Next Paint (INP)** | **< 80 ms** | Delegasi event hover tooltip GitHub tanpa me-render ulang React tree; `active:scale(0.97)` via CSS murni. |
| **Cumulative Layout Shift (CLS)** | **0.00** | Semua metrik numerik dan jam menggunakan `font-variant-numeric: tabular-nums`; aspek rasio gambar dan kontainer terkunci kaku. |
| **GPU Layer Memory** | **< 30 MB** | Menghapus deklarasi `will-change: transform` permanen. Gunakan `will-change` hanya saat animasi aktif, lalu hapus via `clearProps`. |
| **Backdrop Filter Budget** | Maksimal 1 layer aktif per viewport | Mengurangi pemakaian `backdrop-blur-xs` bertingkat di atas `TopographicBg`. Gunakan warna latar solid semi-transparan (`rgba(..., 0.95)`). |

---

## 8. Daftar Larangan Teknis (The "Don'ts" / Anti-Patterns)

1. **DILARANG menggunakan `transition: all`**: Wajib mendefinisikan properti eksplisit, contoh: `transition: transform 160ms var(--ease-out-strong), opacity 160ms var(--ease-out-strong)`.
2. **DILARANG menganimasikan dari `scale(0)`**: Elemen di dunia nyata tidak membesar dari ketiadaan mutlak. Titik awal skala minimum adalah `scale(0.92)` dikombinasikan dengan `opacity: 0`.
3. **DILARANG menggunakan easing `linear` atau `ease-in` untuk antarmuka**: `linear` terlihat robotik dan kaku; `ease-in` terasa lamban merespons pengguna.
4. **DILARANG menjalankan `gsap.from()` tanpa pencegahan FOUC**: Jangan biarkan elemen dirender terlihat oleh browser lalu ditarik menghilang oleh JavaScript setelah hidrasi.
5. **DILARANG menggabungkan `motion` dan GSAP pada elemen DOM yang sama**: Selalu bungkus kontainer luar untuk kendali GSAP ScrollTrigger dan kontainer dalam untuk transisi Motion.
6. **DILARANG membiarkan loop WebGL/rAF berjalan di luar viewport**: Hentikan (`cancelAnimationFrame`) atau throttle kalkulasi shader Three.js saat elemen telah terlewati oleh scroll.
7. **DILARANG memicu efek glitch secara repetitif**: Efek cyber glitch pada footer hanya boleh berjalan sekali saat first enter, atau atas inisiatif interaksi kursor user.
8. **DILARANG menerapkan filter blur pada seluruh viewport**: Animasi `filter: blur()` pada root wrapper halaman merusak performa compositing GPU dan mengacaukan z-index modal.
9. **DILARANG menempatkan stagger delay yang memblokir akses pengguna**: Total waktu seluruh elemen stagger tidak boleh melebihi `320ms`.
10. **DILARANG menyalin kode, teks, atau aset langsung dari referensi**: Ambil inspirasi ritme, kehalusan, dan struktur kedalaman panggungnya, namun terapkan sepenuhnya ke dalam konteks arsitektur teknis Aryo.
