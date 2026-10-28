# MOTION_AUDIT.md — Audit Sistem Animasi

> Lingkup: `src/app/layout.tsx`, `src/app/template.tsx`, `src/hooks/useSmoothScroll.tsx`, semua pemakaian `gsap` / `ScrollTrigger` / `SplitText` / `lenis` / `motion/react`, CSS motion di `globals.css`, dan struktur tiap section di `/` serta `/projects/[slug]`.
> Versi terpasang: `next 16.4.3`, `react 19.3.0`, `gsap 3.15.0`, `lenis 1.3.27`, `motion ^14.6`, `three 0.186`.
> Dokumen ini **hanya temuan**. Rancangan solusi ada di [`MOTION_SPEC.md`](./MOTION_SPEC.md).

---

## 0. Ringkasan eksekutif

Situs ini **bukan kekurangan animasi secara jumlah**. Ada ±20 titik animasi. Masalahnya ada di empat hal:

1. **Semua gerak adalah "play once on enter"** yang dipicu di `top 80–85%`, jadi animasi sudah selesai sebelum mata pengguna sampai ke sana. Setelah itu tidak ada yang merespons scroll: tidak ada parallax, tidak ada handoff antar section, tidak ada scrub. Lenis membuat scroll halus, tapi kontennya diam seperti kertas yang digeser.
2. **Tiga mesin animasi dengan tiga jam berbeda.** GSAP + Lenis berjalan di `gsap.ticker`, Motion di frameloop-nya sendiri, dan WebGL portrait di `requestAnimationFrame` sendiri yang terus berjalan walau tidak terlihat. Kurva ease, durasi, dan titik trigger tiap section berbeda-beda, jadi gerak tidak terasa sebagai satu sistem.
3. **Ada flash sebelum animasi (FOUC) dan kasus sebaliknya (konten tersembunyi tanpa JS).** Hero dirender terlihat oleh SSR, lalu disembunyikan oleh `gsap.fromTo` setelah hydration, lalu dianimasikan masuk. Section GitHub justru mengirim `opacity:0` di HTML SSR.
4. **Bahasa visual HUD tidak punya bahasa gerak.** Label `SYS.HUD // 0X`, angka statistik, garis border, spine timeline, bracket `┌ ┐ └ ┘`, dan bar bahasa semuanya statis. Gerak yang ada (slide-up mask, bounce, blur per huruf) generik dan tidak "berbicara HUD".

---

## 1. Inventaris: apa yang sudah ada

### 1.1 Infrastruktur

| Bagian | File | Status |
| --- | --- | --- |
| Lenis provider | [useSmoothScroll.tsx](../src/hooks/useSmoothScroll.tsx) | ✅ `autoRaf: false`, digerakkan oleh `gsap.ticker`, `lagSmoothing(0)`, `lenis.on("scroll", ScrollTrigger.update)`, cleanup lengkap, dimatikan saat reduced-motion. `duration: 1.15` + easing expo. Touch tetap native (default `syncTouch: false`). |
| API scroll | `scrollTo`, `stopScroll`, `startScroll` lewat context | ✅ Dipakai oleh navbar, hero CTA, dan modal. |
| Route wrapper | [template.tsx](../src/app/template.tsx) | ⚠️ Motion `opacity 0→1, y 12→0, blur 2px→0` dengan spring, plus `scrollTo(0, immediate)` saat mount. |
| Token | [motion-tokens.ts](../src/lib/motion-tokens.ts), CSS vars `--ease-*` di [globals.css](../src/app/globals.css) | ⚠️ Hanya untuk Motion & CSS. GSAP tidak memakai token sama sekali (durasi dan ease ditulis langsung). |
| Reduced motion | [useReducedMotion.ts](../src/hooks/useReducedMotion.ts) + safety net CSS global | ✅ Ada, dipakai hampir di semua komponen. |
| `@gsap/react` (`useGSAP`) | `package.json` | ❌ Terpasang tapi **tidak dipakai di mana pun**. |

### 1.2 Peta animasi per section

| Section | Mesin | Yang bergerak | Trigger |
| --- | --- | --- | --- |
| Navbar ([AdaptiveNavbar.tsx](../src/components/ui/AdaptiveNavbar.tsx)) | Motion | 3 "island" `layout` split/merge di `scrollY > 50`; pill aktif `layoutId`; pill hover `layoutId`; drawer mobile `opacity/y/scale` 180ms | scroll listener + IntersectionObserver |
| Hero ([HeroSection.tsx](../src/components/sections/HeroSection.tsx)) | GSAP (load) + Three.js | `.hero-hud-reveal` ×3 `y18→0, opacity`, 0.65s, stagger 0.07, `power3.out`; portrait: aura hold 0.5s → dissolve 0.8s (shader) | `useEffect` setelah hydration; portrait setelah tekstur selesai dimuat |
| Skills ([CapabilitiesSection.tsx](../src/components/sections/CapabilitiesSection.tsx)) | GSAP | judul mask `yPercent 105→0` 1.1s; kartu `scale .94, y36` 1.0s stagger 0.16; bracket `scale .6` 0.75s | ScrollTrigger `top 85%` / `top 80%`, sekali |
| Achievements ([SelectedWorksSection.tsx](../src/components/sections/SelectedWorksSection.tsx)) | GSAP | judul mask 1.1s; kartu `scale .94, y40` 1.05s; bracket | `top 85%` / `top 82%` |
| Projects (file yang sama) | GSAP SplitText + Motion | "SELECTED": per huruf `y50` + `back.out(1.7)` (bounce); "PROJECTS": per huruf `blur(4px) scale .8`; carousel drag + spring; grid `AnimatePresence popLayout`; pill `layoutId` | `top 85%`; interaksi |
| Experience ([ExperienceTracks.tsx](../src/components/sections/ExperienceTracks.tsx)) | GSAP + Motion | judul mask 1.1s; indikator tab `layoutId`; panel `opacity/y8` 280ms | `top 85%`; klik tab |
| GitHub ([GithubActivitySection.tsx](../src/components/sections/GithubActivitySection.tsx)) | **Motion** `whileInView` | judul `y100%` 1.1s; kartu `y32` 1.0s; pill tahun `layoutId`; sel heatmap `hover:scale-125` | IntersectionObserver `margin -10%` / `-8%` |
| Contact/Footer ([ContactFooter.tsx](../src/components/sections/ContactFooter.tsx)) | GSAP + CSS keyframes | glitch `x/skewX` timeline repeat 2 + pseudo-element RGB split; bracket kanal bergeser saat hover; `animate-ping` status | `top 90%` onEnter **dan** onEnterBack, hover, klik, plus timer 250ms |
| Modal ([CaseStudyQuickModal.tsx](../src/components/ui/CaseStudyQuickModal.tsx)) | Motion | backdrop fade 200ms; panel `scale .96, y10` spring | klik |
| `/projects/[slug]` ([page.tsx](../src/app/projects/[slug]/page.tsx)) | — | **Tidak ada animasi** selain fade dari `template.tsx` dan hover CSS | — |
| Mikro-interaksi global | CSS | `.press-scale` (`scale .97`, 160ms), `.arrow-drift` (overshoot), `.badge-spring` (overshoot), corner bracket hover | hover/active |

---

## 2. Masalah yang ditemukan

Tingkat: **P0** = rusak / terlihat oleh pengguna, **P1** = merusak kehalusan atau performa, **P2** = konsistensi / kebersihan.

### P0 — Rusak atau terlihat jelas

**P0-1. Flash sebelum animasi di Hero (FOUC).**
`HeroSection` menjalankan `gsap.fromTo(".hero-hud-reveal", { opacity: 0, y: 18 }, …)` di dalam `useEffect`. Urutannya: SSR melukis nama, metadata, dan HUD dalam keadaan **terlihat**, lalu React hydrate, lalu `useEffect` berjalan **setelah paint** dan menyetel `opacity:0`, lalu animasi masuk. Hasilnya konten berkedip: terlihat → hilang → muncul lagi. Di koneksi lambat, jeda antara paint pertama dan hydration bisa ratusan milidetik, jadi kedipannya makin jelas. Pola yang sama berlaku untuk setiap section kalau halaman di-reload saat posisi scroll sudah di tengah (ScrollTrigger yang `start`-nya sudah terlewati langsung menyetel state awal setelah paint).

**P0-2. Kebalikannya: konten tersembunyi tanpa JS.**
`GithubActivitySection` memakai `initial={{ opacity: 0, y: 32 }}` pada `motion.h2` dan `motion.div`. Motion menuliskan style ini ke **HTML SSR**, jadi sebelum JS dimuat (atau kalau JS gagal) seluruh section GitHub tidak terlihat. Selain itu `isReducedMotion` di server selalu `false`, jadi pengguna reduced-motion tetap menerima HTML `opacity:0`.

**P0-3. Transisi rute hanya "enter", dan blur diterapkan ke seluruh halaman.**
- `template.tsx` di-mount ulang setiap navigasi, jadi **exit tidak mungkin terjadi**. Halaman lama hilang seketika, lalu halaman baru fade in.
- `filter: blur(2px)` dianimasikan pada **wrapper seluruh halaman**. Itu repaint satu layar penuh per frame. Setelah selesai, Motion bisa meninggalkan `filter: blur(0px)` yang tetap membuat stacking context dan containing block untuk turunan `position: fixed`. Komentar di `CaseStudyQuickModal` ("never trapped by ancestor transforms") menunjukkan masalah ini sudah pernah muncul.
- `scrollTo(0, { immediate: true })` di `template.tsx` berjalan setiap mount, termasuk saat link **"BACK TO PROJECTS" → `/#projects`**. Ini berebut dengan scroll ke hash, jadi pengguna berisiko kembali ke atas halaman, bukan ke section Projects. *(lihat §4 untuk verifikasi live)*
- Tidak ada kontinuitas visual. Gambar `ProjectVisualPreview` di kartu dan gambar showcase di halaman case study adalah aset yang sama, tapi tidak terhubung secara visual.

**P0-4. CSS transition berebut dengan tween GSAP pada bracket.**
`.hud-corner-ornament` di [TechBracketCard.tsx](../src/components/ui/TechBracketCard.tsx) memiliki `transition-transform duration-200`, sementara GSAP men-tween `scale` elemen yang sama (Skills & Achievements). Setiap frame GSAP menulis `transform`, lalu CSS mencoba menginterpolasinya selama 200ms. Akibatnya tween terasa "lembek" dan tertinggal. Saat `clearProps` dijalankan, CSS transition memicu satu animasi tambahan kembali ke nilai awal.

### P1 — Merusak kehalusan atau performa

**P1-1. Tiga jam animasi.** `gsap.ticker` (Lenis + GSAP), frameloop Motion (rAF), dan loop rAF `PortraitAuraCanvas` yang **tidak pernah berhenti**: tetap me-render shader dengan dua lapis simplex noise per frame walau hero sudah di luar layar. Ini melanggar `SYSTEM_RULES.md` Rule 2.2 ("Never run a separate requestAnimationFrame loop alongside gsap.ticker"). Pada saat yang sama, container canvas memakai `drop-shadow` (CSS filter), sehingga filter dihitung ulang setiap frame karena isi canvas selalu berubah.

**P1-2. ScrollTrigger tidak pernah di-refresh setelah layout berubah.** `ScrollTrigger.refresh()` hanya dipanggil sekali saat Lenis diinisialisasi. Posisi trigger jadi basi setelah:
- font **Anton** selesai dimuat (Google Fonts `display=swap` mengubah tinggi semua heading display);
- toggle **Carousel ↔ Grid** di Projects (tinggi section berubah ratusan piksel, jadi semua trigger di bawahnya, yaitu Experience, GitHub, dan Footer, meleset);
- ganti **tab Experience** (tinggi panel berbeda);
- gambar lazy dimuat;
- navigasi kembali ke `/` (instance Lenis tetap hidup di layout, sedangkan trigger section baru diukur saat wrapper `template` masih bergeser `y:12`).

**P1-3. Dua sistem reveal dengan perilaku berbeda.** Section GSAP memicu di `top 80–85%`, sedangkan GitHub (Motion) memakai IntersectionObserver `margin -10%`. Kurvanya juga berbeda: `power3.out`, `power2.out`, `back.out(1.7)`, `[0.16,1,0.3,1]`, dan spring. Durasinya berbeda pula: 0.65 / 0.75 / 1.0 / 1.05 / 1.1s. Pengguna merasakan setiap section "bergerak dengan aksen yang berbeda".

**P1-4. SplitText di judul Projects.**
- Dijalankan sebelum `document.fonts.ready`, jadi huruf dipecah saat masih memakai font fallback (`Impact`), lalu metrik berubah saat Anton dimuat.
- "PROJECTS" men-tween `filter: blur(4px)` pada **8 elemen huruf sekaligus**. Blur per huruf mahal, terutama di Safari.
- "SELECTED" memakai `back.out(1.7)` (bounce), yang bertentangan dengan karakter HUD yang presisi dan dengan `SYSTEM_RULES` Rule 1 (`expo/power3/power4.out`).
- Dua efek berbeda di **satu** heading membuatnya tidak koheren.

**P1-5. Lenis vs `scroll-behavior: smooth`.** `body { scroll-behavior: smooth }` aktif bersamaan dengan Lenis. CSS rekomendasi Lenis (`lenis/dist/lenis.css`: `.lenis-smooth { scroll-behavior: auto !important }`, `[data-lenis-prevent] { overscroll-behavior: contain }`) tidak diimpor. Link TOC di halaman case study (`href="#overview"`, dst.) tidak lewat `lenis.scrollTo`, jadi browser melakukan smooth-scroll native sementara Lenis juga aktif. Hasilnya lompatan/jitter dan posisi internal Lenis tidak sinkron.

**P1-6. Carousel Projects punya geometri hardcoded.** `dragConstraints.left = -(n-1) * 584` memakai lebar desktop, padahal di mobile lebar kartu `85vw + 24`. Akibatnya batas drag dan rubber-band salah di ponsel. `getCardOffset()` membaca `window.innerWidth` saat render tanpa listener resize, jadi carousel meleset saat rotasi layar atau resize.

**P1-7. Hover heatmap me-render ulang seluruh section.** 371 tombol sel masing-masing memanggil `setHoveredCellInfo` saat `mouseenter`, sehingga seluruh `GithubActivitySection` (termasuk 371 node) di-render ulang setiap kali kursor berpindah sel. Ini sumber jank hover dan memperburuk INP.

**P1-8. `backdrop-filter` di mana-mana.** Setiap `TechBracketCard` memakai `backdrop-blur-xs` di atas `TopographicBg` yang `position: fixed` satu layar penuh. Saat scroll, semua area kartu yang terlihat harus di-blur ulang terhadap latar yang bergerak relatif. Navbar juga punya `backdrop-blur-md` dan ikut di-`layout`-animate (FLIP scale) saat split/merge. Biaya GPU-nya terasa di ponsel kelas menengah.

**P1-9. Hero tidak diorkestrasi.** Reveal teks dimulai saat hydration, sedangkan intro aura portrait dimulai saat **dua tekstur PNG** selesai dimuat. Di jaringan lambat, teks sudah selesai jauh sebelum portrait muncul tiba-tiba (`uReady = 0` → canvas transparan → pop-in). Akibatnya ada dua momen yang tidak saling kenal, padahal hero seharusnya menjadi satu-satunya momen yang diorkestrasi.

**P1-10. Navbar mobile.** Drawer tidak mengunci scroll (`stopScroll` tidak dipanggil), tidak menutup dengan `Escape`, tidak memindahkan fokus, dan tidak punya stagger. Durasi enter dan exit sama (180ms), padahal exit sebaiknya lebih cepat.

### P2 — Konsistensi dan kebersihan

**P2-1. Token tidak sinkron dengan aturan proyek.** `SYSTEM_RULES.md` menetapkan `SPRING_SNAPPY = 400/30/0.8` dan `SPRING_LAYOUT = 380/32/1`, tapi `motion-tokens.ts` berisi `240/24/0.85` dan `170/22/0.95`. Tidak ada token durasi, stagger, atau jarak.

**P2-2. `registerPlugin` tersebar di 5 file** dan diimpor dari `gsap/dist/*` (build UMD), sementara core diimpor dari `gsap` (ESM). Ini berisiko menghasilkan dua salinan modul atau tree-shaking yang buruk. Sebaiknya ada satu modul registrasi pusat yang memakai `gsap/ScrollTrigger` (ESM).

**P2-3. `useEffect` dipakai sebagai pengganti `useGSAP`.** Cleanup sudah benar (`ctx.revert()`), tetapi `useEffect` berjalan setelah paint (lihat P0-1), dan `@gsap/react` sudah terpasang.

**P2-4. `will-change` permanen.** `will-change-transform` menempel terus pada 5 heading section, puluhan `.arrow-drift`, dan `.glitch-text`. Setiap elemen itu mendapat layer GPU permanen walau hanya bergerak sekali.

**P2-5. Glitch footer terlalu sering.** Dipicu pada `onEnter`, **`onEnterBack`**, hover, klik, dan timer awal. Pengguna yang scroll naik-turun di dekat footer melihatnya berulang kali. Efek yang paling "keras" di situs ini jadi kehilangan bobot karena frekuensinya (lihat Emil: *frequency of use*).

**P2-6. Reduced-motion saat hydration.** `useSyncExternalStore` mengembalikan `false` di server. Pada commit hydration pertama, efek berjalan dengan `isReducedMotion = false`: Lenis dibuat lalu langsung dihancurkan, dan `fromTo` hero sempat menyetel `opacity:0` sebelum di-revert. Ini kedipan singkat khusus untuk pengguna reduced-motion.

**P2-7. Konflik aturan "zero linear".** `SYSTEM_RULES` Rule 1 melarang `linear` sepenuhnya. Padahal animasi yang di-*scrub* oleh scroll **harus** memakai `ease: "none"`, karena progresnya dipetakan 1:1 ke posisi scroll dan kehalusannya sudah datang dari Lenis. Aturan ini perlu pengecualian eksplisit sebelum parallax/scrub ditambahkan (lihat SPEC §1.1).

---

## 3. Mengapa situs terasa statis

| Gejala | Penyebab | Istilah |
| --- | --- | --- |
| Konten "sudah di sana" saat dilihat | Trigger di `top 85%` + durasi 1s → animasi selesai di tepi bawah layar, sebelum pandangan sampai | *Scroll reveal* yang salah waktu |
| Scroll halus tapi kontennya diam | Tidak ada satu pun animasi yang terikat ke progres scroll | Tidak ada *scroll-driven animation* / *parallax* |
| Antar section tidak ada "serah terima" | Section hanya masuk; tidak ada yang keluar, mengecil, atau bergeser saat section berikutnya datang | Tidak ada *continuity transition* |
| Pindah halaman terasa seperti reload | Tanpa exit, tanpa arah, tanpa elemen bersama | Tidak ada *page transition* / *shared element transition* |
| Bahasa HUD tidak hidup | Label, angka, garis, bracket, spine, dan bar bahasa semuanya statis | Tidak ada *text morph*, *number ticker*, *line drawing*, *reveal* bergaya panel |
| Semua judul bergerak sama | 5 heading memakai mask slide-up yang identik | Repetisi = terasa templat (lihat `frontend-design`: "fade-and-slide-up on each section… reads as AI-generated") |
| Halaman case study mati | Server component tanpa satu pun gerak setelah fade masuk | — |

Intinya, situs ini sudah punya **mesin** yang benar (Lenis di `gsap.ticker`), tetapi belum punya **koreografi**: kapan, mengapa, dan dengan bahasa gerak apa setiap elemen bergerak.

---

## 4. Observasi live & analisis referensi

### 4.1 Analisis referensi: Landon Norris — On Track (`https://landonorris.com/on-track`)
Berdasarkan data run-log (`ln_scroll_log.txt`) dan rangkaian sekuens tangkapan layar (`ln_00_load.png`, `ln_intro_300.png` s/d `ln_intro_4000.png`):

1. **Intro sequence & brand mask reveal (`ln_00_load.png` & `ln_intro_1500.png` -> `ln_intro_4000.png`)**:
   - **Sekuens**: Dimulai dari kanvas brand penuh warna neon lime (`#E2FE00`) dengan tipografi minimalis `"LOAD NORRIS"`. Pada t ≈ 800ms–1500ms, mark emblem `"LN"` berada tepat di tengah. Pada t ≈ 2500ms, emblem tersebut bermetamorfosis menjadi angka `"4"` berukuran raksasa yang berfungsi sebagai **SVG / clip-path dynamic mask**.
   - **Mekanika gerak**: Mask `"4"` membesar secara eksponensial (scale ~0.1x hingga >15x) dengan kurva expo-out agresif (`cubic-bezier(0.16, 1, 0.3, 1)`), "menggunting" tabir loader dan membuka hero stage di baliknya tanpa ada flash/hard cut. Durasi total intro berkisar 3.2s – 3.8s.
2. **Scroll locking selama inisialisasi**:
   - Log `ln_scroll_log.txt` menunjukkan pembacaan `y: 0` berulang pada pemanggilan scroll standar selama 40 langkah awal. Ini membuktikan referensi menerapkan **scroll-locking ketat** pada `window`/container selama sekuens pembuka berlangsung, mencegah user melakukan scrolling prematur yang dapat merusak sinkronisasi GSAP/ScrollTrigger.
3. **Pemisahan layer & kedalaman (depth / parallax)**:
   - **Background Layer**: Tipografi display ultra-bold condensed `"ON TRACK"` yang statis dan terbentang horizontal di belakang.
   - **Focal Asset Layer**: Cutout helm 3D dengan tekstur metalik gold-black beresolusi tinggi, diposisikan tumpang tindih (*overlapping*) di atas teks display. Layer ini memiliki parallax scrolling halus (~0.85x speed terhadap pergerakan scroll).
   - **Foreground / Telemetry HUD Layer**: Kartu telemetry data modular (`"LAST LAP LANDO"`, `"26 Y.O"`, `"BRISTOL, UK"`, `"RND.19 MEXICO"`, outline trek sirkuit SVG vector, angka balap `"4"`, dan tanda tangan driver).
4. **Karakter & timing interaksi**:
   - Nilai durasi mikro-interaksi sangat disiplin (120ms–180ms untuk tombol & kartu), sementara transisi panggung/seksi berbobot besar (700ms–1100ms) dengan kurva asimetris: gerak awal melesat cepat, lalu mendarat dengan redaman panjang dan anggun.

---

### 4.2 Analisis live: Situs pengguna (`https://aryomachfudz.vercel.app/`)
Membandingkan temuan kode dengan perilaku aktual situs:

1. **Aset visual sudah sangat kuat, tetapi terasa statis**:
   - Desain visual situs Aryo sudah memiliki identitas teknis yang sangat matang: font display *Anton*, font data *Geist Mono*, shader Three.js canvas portrait aura, topographic contour ornament, serta aksen warna teal/emerald dengan frame bracket `┌ ┐ └ ┘`.
   - Namun, setelah page load selesai, situs terasa seperti "brosur cetak di atas layar kaca". Tidak ada elemen yang bereaksi secara kontinu terhadap pergerakan scroll pengguna.
2. **Trigger animasi terlalu dini & ketiadaan scroll-scrub**:
   - Seluruh ScrollTrigger dan `whileInView` diatur dengan `start: "top 80%-85%"`. Ketika user menggeser scroll pelan-pelan dari atas ke bawah, animasi slide/scale pada seksi berikutnya sudah selesai berjalan saat seksi tersebut baru menyentuh sepertiga bawah layar. Akibatnya, saat mata pengguna fokus ke konten, elemen sudah diam sepenuhnya.
3. **Elemen HUD tidak hidup (Dead Telemetry)**:
   - Label `"SYS.HUD // 01"` hingga `"SYS.HUD // 07"` hanya teks polos. Tidak ada efek decode/scramble text khas sistem diagnostik.
   - Angka statistik vital di Hero (`4+ PROJECTS`, `3.83 GPA`, `1 AWARD`) dirender instan tanpa count-up ticker.
   - Garis topografi latar (`TopographicBg`) dan garis spine timeline di Experience hanya gambar vektor pasif tanpa efek penarikan garis (*line drawing*).
4. **Masalah navigasi rute (`/` <-> `/projects/[slug]`)**:
   - Navigasi rute saat ini mengandalkan `template.tsx` yang memaksakan `filter: blur(2px)` ke seluruh `div` pembungkus halaman.
   - Karena `template.tsx` me-mount ulang komponen saat rute berganti, halaman lama di-unmount seketika (tanpa exit transition), lalu halaman baru fade-in dengan blur.
   - `scrollTo(0, { immediate: true })` di `template.tsx` merusak fungsi deep-link hash seperti tombol *"BACK TO PROJECTS"* yang menunjuk ke `/#projects`.

---

## 5. Matriks rekomendasi perbaikan

| Komponen / Titik | Masalah Utama (Audit) | Rekomendasi Solusi Arsitektural |
| :--- | :--- | :--- |
| **`template.tsx`** | Blur seluruh halaman, tidak ada exit transition, merusak deep-link hash | Ganti dengan Next.js / React 19 View Transitions atau Motion layout continuity tanpa `filter: blur` global |
| **Hero Section** | FOUC (flash) pada teks HUD, loop Three.js tidak throttled saat offscreen | Gunakan CSS starting style / `useGSAP` dengan `visibility: hidden` saat prerender; suspend Three.js rAF saat `scrollY > vh` |
| **HUD Labels & Stats** | Teks & angka statis, tidak mencerminkan tema Cyber/Telemetry | Terapkan utility Scramble Text pada label `SYS.HUD` dan Spring Number Ticker pada metrik numerik |
| **Bracket Card Ornaments** | CSS transition bertabrakan dengan GSAP scale tween | Pisahkan DOM node: container luar menangani CSS hover, node dalam atau SVG terpisah menangani entrance tween |
| **SplitText di Projects** | Bounce easing (`back.out`), blur mahal pada 8 huruf, FOUT risiko | Ganti dengan clean kinetic reveal berbasis `power3.out` / `expo.out`, hindari filter blur multi-elemen |
| **ScrollTrigger Lifecycle** | Trigger basi saat bento/grid toggle atau tab experience berganti | Panggil `ScrollTrigger.refresh()` secara terpusat setelah state layout/tab selesai di-render |
| **GitHub Matrix** | SSR HTML tersembunyi (`opacity: 0`), 371 node re-render saat hover | Render SSR dalam keadaan terlihat; gunakan pointer-event listener terisolasi (uncontrolled DOM / CSS tooltip) |
