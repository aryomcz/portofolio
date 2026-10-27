# Implementation Plan & Task Breakdown (`docs/TASKS.md`)
## Personal Portfolio Website — Aryo Ristiawan Machfudz

| Metadata | Detail |
| :--- | :--- |
| **Source PRD** | [docs/PRD.md](./PRD.md) (`v1.2`) |
| **Technical Spec** | [docs/TECH_SPEC.md](./TECH_SPEC.md) |
| **System Guardrails** | [SYSTEM_RULES.md](../SYSTEM_RULES.md) |
| **Primary Standards** | `.agents/skills/` (`emil-design-eng`, `frontend-design`, `ui-ux-pro-max`, `animation-vocabulary`, `vercel-react-best-practices`) |

---

## Roadmap & Checklist

- [x] **Fase 1: Setup Proyek & Konfigurasi Paket**
  - [x] 1.1 Inisialisasi Next.js dengan TypeScript, Tailwind CSS, ESLint
  - [x] 1.2 Instalasi pustaka: `gsap`, `@gsap/react`, `lenis`, `motion`, `lucide-react`, `clsx`, `tailwind-merge`
  - [x] 1.3 Konfigurasi `tailwind.config.ts` (design tokens, font, easing variables)
- [x] **Fase 2: Fondasi Data & Smooth Scrolling**
  - [x] 2.1 Buat tipe data dan berkas `src/data/portfolio.ts` berdasarkan CV Aryo
  - [x] 2.2 Buat wrapper `SmoothScrollProvider` yang mengintegrasikan Lenis dengan RAF GSAP
- [x] **Fase 3: Komponen Antarmuka & Layout**
  - [x] 3.1 Buat Navbar adaptif dengan status indikator ketersediaan kerja
  - [x] 3.2 Implementasikan Section Hero dengan metrik ringkas (*At a glance*) ala rinlayheang.me
  - [x] 3.3 Implementasikan Section Selected Projects dengan hover physics dan badge teknologi
  - [x] 3.4 Implementasikan Section Experience & Organization Timeline
  - [x] 3.5 Implementasikan Section Skills Grid, Achievments & Footer
- [x] **Fase 4: Polish Animasi & Optimasi**
  - [x] 4.1 Tambahkan stagger reveal pada judul seksi menggunakan GSAP ScrollTrigger
  - [x] 4.2 Tambahkan micro-interactions pada tombol (magnetic hover / spring press)
  - [x] 4.3 Verifikasi responsive mobile & testing build produksi (`npm run build`)

---

## Execution Details & Acceptance Mapping

### Fase 1: Setup Proyek & Konfigurasi Paket
1. **1.1 Struktur Next.js (`src/app`) & TypeScript Strict**:
   - Migrasi struktur root `app/` ke `src/app/` sesuai arsitektur di `docs/TECH_SPEC.md`.
   - Pastikan `tsconfig.json` memetakan `"@/*": ["./src/*"]` dengan `"strict": true`.
2. **1.2 Instalasi Pustaka Inti**:
   - Pasang `gsap`, `@gsap/react`, `lenis`, `motion`, `lucide-react`, `clsx`, `tailwind-merge`.
3. **1.3 Konfigurasi Design Tokens & Easing (`tailwind.config.ts` & `src/app/globals.css`)**:
   - Definisikan palet warna semantik (`--bg-primary`, `--bg-elevated`, `--text-primary`, `--accent-primary`, `--accent-emerald`) untuk Dark Mode (*Deep Carbon `#0C0C0C`*) dan Light Mode (*Warm Alabaster `#F7F6F2`*).
   - Definisikan tipografi (`Geist Sans`, `Geist Mono` dengan `tabular-nums`, dan `Instrument Serif Italic`) serta kurva easing presisi (`--ease-out-expo`, `--ease-out-quint`, `--ease-drawer`) tanpa `linear` untuk transisi UI.

### Fase 2: Fondasi Data & Smooth Scrolling
1. **2.1 Single Source of Truth (`src/data/portfolio.ts`)**:
   - Implementasikan skema TypeScript ketat yang mencakup seluruh riwayat CV & Portofolio Aryo:
     - **4 Proyek Utama**: `POS Livingroom` (`living-room-icecream.vercel.app`), `TIGO` (Laravel/Flutter/MongoDB/Xendit), `CMS PT BKS` (`bks-shipmanagement.com`), dan `Driver App PT KJHMS` (Next.js/OCR/Web-to-Printer).
     - **Featured Achievement**: `1st Winner Prisma Fest 2025` — **Lumind** (`lumind.vercel.app`).
     - **Experience & Leadership Timeline**: `GDGoC IPB Technical Core Team`, `Vice Head of Competition IT Festival 2025`, `IPB University Software Engineering (GPA 3.83/4.00)`, dan `Matra Hillindo Intern` *(tanpa Karang Taruna)*.
     - **4-Domain Architectural Capability Matrix** & **GitHub Telemetry Config**.
2. **2.2 Integrasi Lenis + GSAP RAF (`src/hooks/useSmoothScroll.ts` & `src/hooks/useReducedMotion.ts`)**:
   - Gunakan `autoRaf: false` pada Lenis dan sinkronkan dengan `gsap.ticker.add((time) => lenis.raf(time * 1000))` serta `lenis.on("scroll", ScrollTrigger.update)`.
   - Patuhi `prefers-reduced-motion: reduce` (matikan Lenis hijacking jika aktif) dan pastikan cleanup deterministik saat unmount.

### Fase 3: Komponen Antarmuka & Layout
1. **3.1 Adaptive Navbar (`src/components/ui/AdaptiveNavbar.tsx`)**:
   - Masthead editorial dengan jam live Bogor (`UTC+7 WIB`, `tabular-nums`), indikator status ketersediaan kerja (`Available for Internships & Engineering Projects`), pengubah tema Dark/Light bebas FOUC, serta *Floating Pill Navbar* dengan indikator aktif `layoutId="active-nav-pill"` berbasis spring (`SPRING_LAYOUT`).
2. **3.2 Section Hero & Quick Stats (`src/components/sections/HeroSection.tsx`)**:
   - Layout Swiss grid 12-kolom dengan tipografi campuran `Geist Sans` + `Instrument Serif Italic` (*"Technology builds the solution. Operations deliver the impact."*).
   - Dilengkapi bar metrik ringkas (*At a glance* 4 kolom: `3.83 GPA`, `04+ Production Systems`, `1st Winner Prisma Fest 2025`, `150+ Teams Managed`), CTA scroll halus, unduh CV, dan tombol salin email interaktif.
3. **3.3 Section Selected Projects (`src/components/sections/SelectedWorksSection.tsx`)**:
   - Kartu studi kasus bernomor (`01`–`04`), metrik terverifikasi, badge teknologi monospasi, hover physics presisi, serta dukungan navigasi ke halaman detail `/projects/[slug]` dan Quick Preview.
4. **3.4 Section Experience & Organization Timeline (`src/components/sections/TimelineSection.tsx`)**:
   - Timeline vertikal dengan garis progres GSAP ScrollTrigger (`--accent-primary`) untuk `GDGoC IPB`, `IT Festival 2025`, `IPB RPL`, dan `Matra Hillindo`.
5. **3.5 Section Skills Grid, Achievements & Footer**:
   - Matriks kapabilitas arsitektural 4-domain, showcase khusus `Juara 1 Prisma Fest 2025 — Lumind` (`lumind.vercel.app`), aktivitas GitHub, dan footer kolofon teknis dengan tombol salin email bergaya Emil Kowalski.

### Fase 4: Polish Animasi & Optimasi
1. **4.1 Stagger Reveal Judul Seksi**:
   - Bungkus seluruh animasi ScrollTrigger di dalam `gsap.context()` / `useGSAP()` dengan `ctx.revert()` saat unmount.
2. **4.2 Micro-Interactions Tombol & Kartu**:
   - Terapkan feedback tekan fisik (`scale: 0.97` / `0.98`) dan spring physics (`SPRING_SNAPPY`) sesuai panduan `emil-design-eng`.
3. **4.3 Verifikasi Mobile-First & Produksi**:
   - Pastikan zero error TypeScript (`tsc --noEmit`), linter bersih, dan build produksi (`npm run build`) sukses.
