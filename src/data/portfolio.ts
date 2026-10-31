export type ProjectSlug =
  | "pos-livingroom"
  | "tigo"
  | "cms-pt-bks"
  | "driver-app-pt-kjhms"
  | "lumind";

export type ProjectThemeId =
  | "orange"
  | "blue"
  | "sky"
  | "red"
  | "fuchsia";

export type SkillDomainId =
  | "architecture-analysis"
  | "fullstack-development"
  | "tools-devops";

/** Calendar month in `YYYY-MM` form, e.g. `"2023-07"`. */
export type YearMonth = `${number}-${| "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"}`;

export type EmploymentType = "Internship" | "Part-time" | "Full-time" | "Freelance";

export type OrganizationType =
  | "Student Developer Community"
  | "Campus Tech Festival"
  | "Student Association";

export interface QuickStatItem {
  readonly id: string;
  readonly indexLabel: string;
  readonly value: string;
  readonly unit?: string;
  readonly label: string;
  readonly description: string;
}

export interface HeroHudData {
  readonly roleSummaryLines: readonly [string, string, string];
  readonly currentlyTitle: string;
  readonly currentlySub: string;
  readonly latestProjectTitle: string;
  readonly latestProjectSub: string;
  readonly sparklinePoints: readonly number[];
  readonly atAGlance: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}

export interface ArchitectureNode {
  readonly id: string;
  readonly layer: "CLIENT" | "GATEWAY / API" | "DATA STORE" | "INTEGRATION";
  readonly title: string;
  readonly tech: string;
  readonly description: string;
}

export interface ArchitectureConnection {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly protocol?: string;
}

export interface ArchitectureBlueprint {
  readonly summary: string;
  readonly nodes: readonly ArchitectureNode[];
  readonly connections: readonly ArchitectureConnection[];
}

export interface CaseStudyMetric {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
}

export interface DummyGalleryPhoto {
  readonly id: string;
  readonly tag: string;
  readonly title: string;
  readonly caption: string;
  readonly imageUrl: string;
}

export interface ProjectCaseStudy {
  readonly slug: ProjectSlug;
  readonly index: string;
  readonly kind: "project" | "achievement";
  readonly themeColor: ProjectThemeId;
  readonly badgeText?: string; // e.g. "CHAMPION" for Achievement
  readonly title: string;
  readonly podium: string;
  readonly univ: string;
  readonly shortTitle: string;
  readonly subtitle: string;
  readonly year: string;
  readonly category: string;
  readonly clientOrContext: string;
  readonly role: string;
  readonly liveUrl?: string;
  readonly repoUrl?: string;
  readonly heroMetricPill: string;
  readonly cardSummary: string;
  readonly previewImage: {
    readonly src: string;
    readonly alt: string;
    readonly secondaryCertificateSrc?: string;
    readonly aspectRatio: "16/10" | "16/9";
  };
  readonly dummyGallery: readonly DummyGalleryPhoto[];
  readonly techStack: readonly {
    readonly name: string;
    readonly layer: "Frontend" | "Backend" | "Database" | "Mobile" | "Integration" | "Design & Cloud";
  }[];
  readonly verifiedMetrics: readonly CaseStudyMetric[];
  readonly problemStatement: {
    readonly headline: string;
    readonly contextParagraphs: readonly string[];
    readonly painPoints: readonly string[];
  };
  readonly systemAnalysis: {
    readonly headline: string;
    readonly methodologyParagraphs: readonly string[];
    readonly keySchemaOrWorkflowBullets: readonly string[];
  };
  readonly architectureBlueprint: ArchitectureBlueprint;
  readonly engineeringExecution: {
    readonly headline: string;
    readonly decisions: readonly {
      readonly title: string;
      readonly description: string;
      readonly techTags: readonly string[];
    }[];
  };
  readonly impactAndOutcomes: {
    readonly summary: string;
    readonly beforeAfterComparison: readonly {
      readonly dimension: string;
      readonly before: string;
      readonly after: string;
    }[];
  };
}

export interface SkillItem {
  readonly name: string;
  readonly relatedProjectSlugs: readonly ProjectSlug[];
  readonly relatedExperienceIds?: readonly string[];
}

export interface CapabilityDomain {
  readonly id: SkillDomainId;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly skills: readonly SkillItem[];
  readonly productionProofSummary: string;
}

export interface ExperienceTenure {
  readonly start: YearMonth;
  /** `null` while the role is still active. */
  readonly end: YearMonth | null;
}

interface ExperienceEntryBase {
  readonly id: string;
  readonly role: string;
  readonly organization: string;
  readonly location: string;
  readonly tenure: ExperienceTenure;
  /** Impact statements; numeric figures (15+, 25%) are highlighted in the UI. */
  readonly highlights: readonly string[];
  /** Technologies and competencies exercised in the role. */
  readonly skills: readonly string[];
}

export interface WorkExperience extends ExperienceEntryBase {
  readonly kind: "work";
  readonly employmentType: EmploymentType;
}

export interface OrganizationalExperience extends ExperienceEntryBase {
  readonly kind: "organization";
  readonly organizationType: OrganizationType;
}

export type ExperienceEntry = WorkExperience | OrganizationalExperience;

export interface GithubContributionDay {
  readonly date: string;
  readonly count: number;
  readonly level: 0 | 1 | 2 | 3 | 4;
}

export interface GithubTelemetryConfig {
  readonly username: string;
  readonly profileUrl: string;
  readonly availableYears: readonly number[];
  readonly languageDistribution: readonly {
    readonly language: string;
    readonly percentage: number;
    readonly colorToken: string;
  }[];
  readonly summaryStats: {
    readonly totalContributionsLabel: string;
    readonly activeReposLabel: string;
    readonly primaryFocusLabel: string;
  };
}

export interface PortfolioData {
  readonly owner: {
    readonly fullName: string;
    readonly shortName: string;
    readonly mastheadIdentity: string;
    readonly roleTagline: string;
    readonly bioSummary: string;
    readonly location: {
      readonly city: string;
      readonly country: string;
      readonly shortLabel: string;
      readonly coordinates: string;
      readonly timezone: "Asia/Jakarta";
    };
    readonly education: {
      readonly university: string;
      readonly degree: string;
      readonly period: string;
      readonly gpa: string;
      readonly coursework: readonly string[];
    };
    readonly availability: {
      readonly isAvailable: boolean;
      readonly statusText: string;
      readonly detailBanner: string;
    };
    readonly contacts: {
      readonly email: string;
      readonly phoneDisplay: string;
      readonly whatsappUrl: string;
      readonly linkedinUrl: string;
      readonly linkedinHandle: string;
      readonly githubUrl: string;
      readonly githubHandle: string;
      readonly resumePdfPath: string;
    };
  };
  readonly heroHud: HeroHudData;
  readonly quickStats: readonly QuickStatItem[];
  readonly capabilityDomains: readonly CapabilityDomain[];
  readonly githubTelemetry: GithubTelemetryConfig;
  readonly projects: readonly ProjectCaseStudy[];
  readonly featuredAchievement: ProjectCaseStudy;
  /** Paid industry roles, newest first. */
  readonly workExperiences: readonly WorkExperience[];
  /** Campus organizations, committees and leadership roles, newest first. */
  readonly organizationalExperiences: readonly OrganizationalExperience[];
}

export const PORTFOLIO_DATA: PortfolioData = {
  owner: {
    fullName: "Aryo Ristiawan Machfudz",
    shortName: "Aryo R. Machfudz",
    mastheadIdentity: "ARYO R. MACHFUDZ",
    roleTagline: "FULL-STACK DEVELOPER · SYSTEM ANALYST · API ARCHITECT",
    bioSummary:
      "Third-year Software Engineering undergraduate at IPB University (GPA 3.83/4.00) shipping end-to-end web, mobile, and API architectures—from custom enterprise CMS and OCR logistics systems to PWA point-of-sale and Xendit ticketing platforms.",
    location: {
      city: "Bogor",
      country: "Indonesia",
      shortLabel: "Bogor, ID",
      coordinates: "6.5971° S, 106.8060° E",
      timezone: "Asia/Jakarta",
    },
    education: {
      university: "IPB University",
      degree: "Software Engineering (Rekayasa Perangkat Lunak)",
      period: "Aug 2024 – Jun 2028 (Expected)",
      gpa: "3.83 / 4.00",
      coursework: [
        "Data Structures & Algorithms",
        "Database Systems & Architecture",
        "Web & Mobile App Dev",
        "Software Engineering Principles",
        "Software Quality Assurance",
        "AR Systems",
      ],
    },
    availability: {
      isAvailable: true,
      statusText: "Available for Work",
      detailBanner:
        "Available for Software Engineering Internships, Full-Stack / System Analyst Roles, and Enterprise Freelance Projects.",
    },
    contacts: {
      email: "machfudzaryo@gmail.com",
      phoneDisplay: "+62 838-7091-1774",
      whatsappUrl: "https://wa.me/6283870911774",
      linkedinUrl: "https://linkedin.com/in/aryomachfudz",
      linkedinHandle: "in/aryomachfudz",
      githubUrl: "https://github.com/aryomcz",
      githubHandle: "@aryomcz",
      resumePdfPath: "/cv/Aryo-Ristiawan-Machfudz-CV.pdf",
    },
  },
  heroHud: {
    roleSummaryLines: [
      "Full-Stack Developer & System Analyst.",
      "Architecting scalable Web, Mobile & REST APIs.",
      "Translating complex operations into crisp software.",
    ],
    currentlyTitle: "Mahasiswa Rekayasa Perangkat Lunak IPB",
    currentlySub: "IPB University · GDGoC Technical Core Team",
    latestProjectTitle: "TIGO / POS Livingroom",
    latestProjectSub: "Xendit Ticketing & Next.js PWA POS",
    sparklinePoints: [24, 38, 32, 54, 48, 72, 66, 95],
    atAGlance: [
      { label: "Projects", value: "4+" },
      { label: "GPA", value: "3.83" },
      { label: "Award", value: "1" },
    ],
  },
  quickStats: [
    {
      id: "stat-gpa",
      indexLabel: "STAT // 01",
      value: "3.83",
      unit: "/ 4.00",
      label: "Academic GPA at IPB University",
      description: "3rd-Year Software Engineering Undergraduate",
    },
    {
      id: "stat-systems",
      indexLabel: "STAT // 02",
      value: "04+",
      unit: "Systems",
      label: "End-to-End Production Architectures",
      description: "Maritime CMS, Logistics OCR, Retail POS & Ticketing",
    },
    {
      id: "stat-award",
      indexLabel: "STAT // 03",
      value: "1st",
      unit: "Winner",
      label: "Prisma Fest Web Design 2025",
      description: "National Competition Winner (Lumind Platform)",
    },
    {
      id: "stat-ops",
      indexLabel: "STAT // 04",
      value: "150+",
      unit: "Teams",
      label: "Technical & Competition Operations",
      description: "GDGoC IPB Core Team & Vice Head IT Fest 2025",
    },
  ],
  capabilityDomains: [
    {
      id: "architecture-analysis",
      code: "COL // 01",
      title: "ARCHITECTURE & ANALYSIS",
      description:
        "Bridging business bottlenecks with normalized schemas, system specifications, and resilient API contracts.",
      skills: [
        { name: "System Analyst", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms", "tigo"] },
        { name: "Database Design", relatedProjectSlugs: ["pos-livingroom", "tigo", "cms-pt-bks"] },
        { name: "API Architecture", relatedProjectSlugs: ["pos-livingroom", "tigo", "cms-pt-bks", "driver-app-pt-kjhms"] },
        { name: "Requirements Engineering", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "tigo"] },
        { name: "RBAC & OAuth Security", relatedProjectSlugs: ["tigo", "cms-pt-bks", "driver-app-pt-kjhms", "pos-livingroom"] },
        { name: "Webhook Orchestration", relatedProjectSlugs: ["tigo", "driver-app-pt-kjhms"] },
      ],
      productionProofSummary:
        "Digitized manual store & logistics workflows, cutting content publishing time by 70% and driver reporting time by 60%.",
    },
    {
      id: "fullstack-development",
      code: "COL // 02",
      title: "FULL-STACK DEVELOPMENT",
      description:
        "End-to-end application engineering across modern SSR web frameworks, RESTful backends, and mobile clients.",
      skills: [
        { name: "Next.js", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms", "lumind"] },
        { name: "TypeScript", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms", "lumind"] },
        { name: "React", relatedProjectSlugs: ["pos-livingroom", "tigo", "cms-pt-bks", "driver-app-pt-kjhms", "lumind"] },
        { name: "Laravel", relatedProjectSlugs: ["tigo"] },
        { name: "Express", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms"] },
        { name: "Flutter", relatedProjectSlugs: ["tigo"] },
        { name: "Tailwind", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms", "lumind", 'tigo'] },
        { name: "Node.js", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms"] },
      ],
      productionProofSummary:
        "Shipped installable Next.js PWAs, high-uptime corporate CMS platforms, and <2s Flutter QR gate scanners.",
    },
    {
      id: "tools-devops",
      code: "COL // 03",
      title: "TOOLS & DEVOPS",
      description:
        "Relational & NoSQL data stores, type-safe ORMs, payment gateways, OCR pipelines, and cloud edge hosting.",
      skills: [
        { name: "PostgreSQL", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms"] },
        { name: "MongoDB", relatedProjectSlugs: ["tigo"] },
        { name: "Prisma ORM", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "driver-app-pt-kjhms"] },
        { name: "Git", relatedProjectSlugs: ["pos-livingroom", "tigo", "cms-pt-bks", "driver-app-pt-kjhms", "lumind"] },
        { name: "Vercel", relatedProjectSlugs: ["pos-livingroom", "cms-pt-bks", "lumind", "driver-app-pt-kjhms"] },
        { name: "Xendit", relatedProjectSlugs: ["tigo"] },
        { name: "Cloudinary", relatedProjectSlugs: ["pos-livingroom", "tigo", "cms-pt-bks", "driver-app-pt-kjhms"] },
        { name: "Figma", relatedProjectSlugs: ["cms-pt-bks", "driver-app-pt-kjhms", "lumind", "tigo", "pos-livingroom"] },
      ],
      productionProofSummary:
        "Managed 99.9% uptime edge deployments, automated Xendit payment settlements, and OCR/Web-to-Printer bridges.",
    },
  ],
  githubTelemetry: {
    username: "aryomcz",
    profileUrl: "https://github.com/aryomcz",
    availableYears: [2026, 2025, 2024, 2023],
    languageDistribution: [
      { language: "TypeScript", percentage: 42, colorToken: "var(--accent-primary)" },
      { language: "JavaScript", percentage: 24, colorToken: "var(--accent-emerald)" },
      { language: "PHP / Laravel", percentage: 18, colorToken: "var(--text-primary)" },
      { language: "Dart / Flutter", percentage: 16, colorToken: "var(--text-secondary)" },
    ],
    summaryStats: {
      totalContributionsLabel: "640+ Contributions (2025–2026)",
      activeReposLabel: "12+ Production & Campus Repositories",
      primaryFocusLabel: "Full-Stack Web, REST APIs & Mobile Systems",
    },
  },
  projects: [
    {
      podium:"",
      univ:"",
      slug: "pos-livingroom",
      index: "01",
      kind: "project",
      themeColor: "orange",
      title: "POS LIVINGROOM",
      shortTitle: "POS Livingroom",
      subtitle: "PWA Point of Sale & Multi-Period Sales Analytics",
      year: "2026",
      category: "PWA Point of Sale & Analytics",
      clientOrContext: "Livingroom Ice Cream Shop",
      role: "Full-Stack Developer & System Analyst",
      liveUrl: "https://living-room-icecream.vercel.app",
      heroMetricPill: "100% Digitized Cashier Logs · 4+ Reporting Windows",
      cardSummary:
        "Digitized manual ice cream shop cashier operations into an installable Next.js PWA backed by Express.js and Prisma ORM, eliminating human logging errors and empowering owners with real-time SKU sales analytics.",
      previewImage: {
        src: "/images/projects/livingroom/livingroom.png",
        alt: "Livingroom POS PWA Dashboard showing Total Items Terjual, Total Pendapatan, and Chart.js sales trends",
        aspectRatio: "16/10",
      },
      dummyGallery: [
        {
          id: "pos-1",
          tag: "FIG 01 // ADMIN ANALYTICS",
          title: "Real-Time Revenue & SKU Velocity Dashboard",
          caption: "Interactive Chart.js dashboard filtering Minggu, 1 Bulan, 3 Bulan, and 6 Bulan sales windows.",
          imageUrl: "/images/projects/livingroom/chart.png",
        },
        {
          id: "pos-2",
          tag: "FIG 02 // CASHIER PWA TERMINAL",
          title: "Touch-Optimized Cashier Checkout Interface",
          caption: "Installable PWA interface for rapid order entry across Kul-kul, 1 Scoop, and Muffle menu items.",
          imageUrl: "/images/projects/livingroom/checkout.png",
        },
        {
          id: "pos-3",
          tag: "FIG 03 // PRISMA LEDGER",
          title: "Transactional Order History & Stock Audit",
          caption: "Normalized relational schema ensuring zero shift-end discrepancies.",
          imageUrl: "/images/projects/livingroom/history.png",
        },
      ],
      techStack: [
        { name: "Next.js", layer: "Frontend" },
        { name: "TypeScript", layer: "Frontend" },
        { name: "Tailwind", layer: "Frontend" },
        { name: "Express", layer: "Backend" },
        { name: "Prisma ORM", layer: "Database" },
        { name: "PostgreSQL", layer: "Database" },
      ],
      verifiedMetrics: [
        {
          value: "100%",
          label: "Digitized Transaction Logging",
          detail: "Replaced error-prone paper cashier logs with atomic database transactions.",
        },
        {
          value: "4+",
          label: "Dynamic Reporting Windows",
          detail: "Instant aggregation across Minggu, 1 Bulan, 3 Bulan, 6 Bulan & Custom Date ranges.",
        },
        {
          value: "Real-Time",
          label: "Top SKU Revenue Ranking",
          detail: "Live performance tracking for Kul-kul, 1 Scoop, and Muffle inventory lines.",
        },
      ],
      problemStatement: {
        headline: "Eliminating Manual Cashier Friction & Blind Inventory Decisions",
        contextParagraphs: [
          "Livingroom Ice Cream operated using manual cashier tally sheets and spreadsheet reconciliations at the end of each shift. As daily order volume grew across signature items like Kul-kul, 1 Scoop, and Muffle, manual calculation errors created discrepancies between physical stock and recorded revenue.",
          "Store management lacked immediate visibility into daily revenue trends or top-performing menu categories without manually compiling weekly reports.",
        ],
        painPoints: [
          "High risk of human calculation and transcription errors during peak store hours.",
          "Delayed financial visibility—owners could not inspect real-time revenue or average order values remotely.",
          "No historical time-series comparison across weekly, monthly, or quarterly windows.",
        ],
      },
      systemAnalysis: {
        headline: "Relational Transaction Modeling & Role-Separated PWA Workflows",
        methodologyParagraphs: [
          "Conducted direct stakeholder interviews and shift observations to map cashier checkout speed requirements alongside owner analytics needs.",
          "Architected a normalized relational schema managed via Prisma ORM, separating product catalog items, transactional order headers, line-item snapshots, and time-bucketed aggregation queries.",
        ],
        keySchemaOrWorkflowBullets: [
          "Atomic Order Creation: Express.js controller wraps order header and line items in a single Prisma transaction.",
          "Installable PWA Shell: Cashiers launch the interface full-screen on tablets or desktops with fast keypad/touch ergonomics.",
          "Time-Series Aggregation Engine: Backend endpoints compute Total Items Terjual, Total Pendapatan, and Rata-Rata Pendapatan dynamically.",
        ],
      },
      architectureBlueprint: {
        summary: "Installable Next.js PWA communicating with an Express.js REST API, Prisma ORM relational layer, and Cloudinary media storage.",
        nodes: [
          {
            id: "pos-client",
            layer: "CLIENT",
            title: "Next.js PWA Cashier & Admin UI",
            tech: "Next.js · Shadcn UI · Chart.js",
            description: "Responsive cashier checkout terminal and interactive owner analytics dashboard.",
          },
          {
            id: "pos-api",
            layer: "GATEWAY / API",
            title: "Transactional REST API",
            tech: "Node.js · Express.js",
            description: "Handles authentication, order validation, and multi-period aggregation queries.",
          },
          {
            id: "pos-db",
            layer: "DATA STORE",
            title: "Relational Ledger & Catalog",
            tech: "Prisma ORM · PostgreSQL / MySQL",
            description: "Stores normalized products, transaction headers, and timestamped line items.",
          },
          {
            id: "pos-cloud",
            layer: "INTEGRATION",
            title: "Product Asset CDN",
            tech: "Cloudinary · Vercel",
            description: "Optimizes menu imagery and serves the web application at the edge.",
          },
        ],
        connections: [
          { from: "pos-client", to: "pos-api", label: "REST JSON / Auth", protocol: "HTTPS" },
          { from: "pos-api", to: "pos-db", label: "Type-Safe Queries", protocol: "Prisma Client" },
          { from: "pos-api", to: "pos-cloud", label: "Image Upload & CDN", protocol: "Cloudinary SDK" },
        ],
      },
      engineeringExecution: {
        headline: "High-Speed Checkout & Interactive Chart.js Telemetry",
        decisions: [
          {
            title: "Multi-Window Financial Visualization",
            description:
              "Built interactive Chart.js bar and trend visualizations with instant filter switching (Minggu, 1 Bulan, 3 Bulan, 6 Bulan, and Custom Date Picker) without full page reloads.",
            techTags: ["Chart.js", "Next.js", "React State"],
          },
          {
            title: "Type-Safe Prisma ORM Data Layer",
            description:
              "Enforced strict schema integrity for menu pricing, quantities, and timestamps so historical revenue reports remain immutable even when catalog prices update.",
            techTags: ["Prisma ORM", "Express.js", "TypeScript"],
          },
        ],
      },
      impactAndOutcomes: {
        summary:
          "Streamlined daily store checkout operations and gave management real-time clarity into revenue and SKU velocity.",
        beforeAfterComparison: [
          {
            dimension: "Transaction Recording",
            before: "Manual paper/spreadsheet logs prone to shift-end mismatches",
            after: "100% digitized atomic POS checkout with instant receipt calculation",
          },
          {
            dimension: "Sales Reporting",
            before: "Hours of manual weekly spreadsheet compilation",
            after: "Instant 1-click filtering across 1W, 1M, 3M, 6M, and custom date ranges",
          },
        ],
      },
    },
    {
      podium:"",
      univ:"",
      slug: "tigo",
      index: "02",
      kind: "project",
      themeColor: "sky",
      title: "TIGO (TICKET ON THE GO)",
      shortTitle: "TIGO Ticketing",
      subtitle: "Full-Stack & Flutter Event Ticketing Ecosystem with Xendit",
      year: "2026",
      category: "Full-Stack & Mobile Event Ticketing",
      clientOrContext: "IPB University Software Engineering Project",
      role: "Full-Stack & Mobile Developer",
      heroMetricPill: "< 2s QR Gate Check-In · 100% Automated Xendit Webhooks",
      cardSummary:
        "Architected a dual-platform event ticketing ecosystem combining a React/Laravel web dashboard, MongoDB NoSQL storage, real-time Xendit payment webhooks, and a cross-platform Flutter RBAC QR scanner.",
      previewImage: {
        src: "/images/projects/tigo/tigo.png",
        alt: "TIGO Event Organizer Web Dashboard and Flutter Mobile QR Code Scanner",
        aspectRatio: "16/10",
      },
      dummyGallery: [
        {
          id: "tigo-1",
          tag: "FIG 01 // WEB TICKETING PORTAL",
          title: "Event Discovery & Xendit Instant Checkout",
          caption: "React & Laravel web interface with Google OAuth and automated Xendit invoice generation.",
          imageUrl: "/images/projects/tigo/checkout.png",
        },
        {
          id: "tigo-2",
          tag: "FIG 02 // FLUTTER QR SCANNER",
          title: "Sub-2-Second RBAC Mobile Gate Scanner",
          caption: "Cross-platform Flutter mobile app validating attendee QR payloads in under 2 seconds.",
          imageUrl: "/images/projects/tigo/scan.png",
        },
        {
          id: "tigo-3",
          tag: "FIG 03 // WEBHOOK TELEMETRY",
          title: "Real-Time MongoDB & Xendit Settlement Logs",
          caption: "Automated webhook reconciliation updating withdrawal status iwth approval from xendit and ticket statuses without manual review.",
          imageUrl: "/images/projects/tigo/xendit-webhook.png",
        },
      ],
      techStack: [
        { name: "Laravel", layer: "Backend" },
        { name: "Flutter", layer: "Mobile" },
        { name: "React", layer: "Frontend" },
        { name: "MongoDB", layer: "Database" },
        { name: "Xendit", layer: "Integration" },
      ],
      verifiedMetrics: [
        {
          value: "< 2s",
          label: "Attendee Gate Check-In",
          detail: "Camera-based Flutter QR scanner with RBAC verification eliminates gate queues.",
        },
        {
          value: "100%",
          label: "Automated Payment Settlement",
          detail: "Real-time Xendit webhook listeners reconcile ticket status and ledgers instantly.",
        },
        {
          value: "2 Platforms",
          label: "Unified Web & Mobile Sync",
          detail: "Shared Laravel REST API serving both the React web portal and Flutter scanner app.",
        },
      ],
      problemStatement: {
        headline: "Solving Event Gate Bottlenecks & Manual Payment Verification",
        contextParagraphs: [
          "Campus and regional event organizers frequently struggled with fragmented ticketing workflows: attendees uploaded manual bank transfer screenshots, and committee staff verified spreadsheets at the venue entrance.",
          "This manual verification caused long check-in queues, counterfeit ticket risks, and delayed financial reconciliation.",
        ],
        painPoints: [
          "Slow manual payment proof checking prior to issuing e-tickets.",
          "Venue gate congestion caused by searching attendee names in shared spreadsheets.",
          "Lack of role-based permissions separating ticket buyers, event organizers, and gate scanners.",
        ],
      },
      systemAnalysis: {
        headline: "Document-Oriented Ticketing Schema & Webhook Idempotency",
        methodologyParagraphs: [
          "Modeled flexible event tiers, dynamic seat quotas, and cryptographic QR payloads inside MongoDB collections exposed via a unified Laravel REST API.",
          "Designed Role-Based Access Control (RBAC) middleware ensuring only authorized event staff devices in the Flutter app can mutate ticket check-in states.",
        ],
        keySchemaOrWorkflowBullets: [
          "Xendit Invoice & Callback Flow: Asynchronous webhook listener verifies callback signatures and issues unique QR tokens immediately upon payment.",
          "Flutter Camera QR Pipeline: Decodes encrypted ticket signatures and validates single-entry status in under 2 seconds.",
          "Google OAuth Onboarding: Frictionless 1-click user authentication across web and mobile.",
        ],
      },
      architectureBlueprint: {
        summary: "React Web + Flutter Mobile clients backed by a Laravel REST API, MongoDB NoSQL cluster, and Xendit Payment Webhooks.",
        nodes: [
          {
            id: "tigo-clients",
            layer: "CLIENT",
            title: "React Web & Flutter Mobile App",
            tech: "React · Flutter (iOS/Android)",
            description: "Web dashboard for organizers/buyers and mobile RBAC camera scanner for gate staff.",
          },
          {
            id: "tigo-api",
            layer: "GATEWAY / API",
            title: "Core Ticketing & RBAC API",
            tech: "PHP · Laravel REST API",
            description: "Orchestrates OAuth, ticket issuance, webhook validation, and QR check-in endpoints.",
          },
          {
            id: "tigo-db",
            layer: "DATA STORE",
            title: "NoSQL Event & Ticket Store",
            tech: "MongoDB",
            description: "Stores dynamic event metadata, order ledgers, and atomic check-in timestamps.",
          },
          {
            id: "tigo-integrations",
            layer: "INTEGRATION",
            title: "Payments, Auth & Media",
            tech: "Xendit · Google OAuth · Cloudinary",
            description: "Processes real-time payment webhooks, social login, and event banner hosting.",
          },
        ],
        connections: [
          { from: "tigo-clients", to: "tigo-api", label: "REST API / Bearer JWT", protocol: "HTTPS" },
          { from: "tigo-api", to: "tigo-db", label: "Document Queries", protocol: "MongoDB Driver" },
          { from: "tigo-integrations", to: "tigo-api", label: "Payment Webhooks", protocol: "Xendit Callback" },
        ],
      },
      engineeringExecution: {
        headline: "Real-Time Xendit Webhooks & Sub-2-Second Flutter QR Scanning",
        decisions: [
          {
            title: "Idempotent Xendit Payment Listeners",
            description:
              "Engineered webhook controllers in Laravel to handle asynchronous payment notifications safely, preventing duplicate ticket generation or race conditions.",
            techTags: ["Laravel", "Xendit API", "Webhooks"],
          },
          {
            title: "RBAC-Protected Flutter Gate Scanner",
            description:
              "Built a dedicated Flutter mobile module utilizing native camera streams to scan, verify, and lock attendee QR codes in <2 seconds with instant visual/haptic status feedback.",
            techTags: ["Flutter", "RBAC", "QR Scanner"],
          },
        ],
      },
      impactAndOutcomes: {
        summary:
          "Delivered an end-to-end automated ticketing lifecycle from discovery and Xendit checkout to sub-2-second venue entry.",
        beforeAfterComparison: [
          {
            dimension: "Payment Verification",
            before: "Manual inspection of uploaded transfer screenshots",
            after: "100% automated real-time Xendit webhook settlement",
          },
          {
            dimension: "Venue Gate Check-In",
            before: "30–60 seconds per attendee via manual spreadsheet lookup",
            after: "< 2 seconds per attendee via Flutter RBAC QR camera scan",
          },
        ],
      },
    },
    {
      podium:"",
      univ:"",
      slug: "cms-pt-bks",
      index: "03",
      kind: "project",
      themeColor: "blue",
      title: "CMS WEBSITE — PT BKS",
      shortTitle: "CMS PT BKS",
      subtitle: "Enterprise Ship Management Platform & Back-Office CMS",
      year: "2026",
      category: "Enterprise Web Platform & Custom CMS",
      clientOrContext: "PT Bahtera Khatulistiwa Shipping",
      role: "Product Developer (Full-Stack & System Analyst)",
      liveUrl: "https://www.bks-shipmanagement.com",
      heroMetricPill: "70% Faster Content Publishing · 99.9% Uptime",
      cardSummary:
        "Modernized the corporate web platform for PT Bahtera Khatulistiwa Shipping from a rigid legacy static site into a high-performance Next.js and Express.js application with a custom back-office CMS.",
      previewImage: {
        src: "/images/projects/bks/bks.png",
        alt: "PT Bahtera Khatulistiwa Shipping Corporate Website and Custom CMS Dashboard",
        aspectRatio: "16/10",
      },
      dummyGallery: [
        {
          id: "bks-1",
          tag: "FIG 01 // CORPORATE PORTAL",
          title: "Modernized Maritime Fleet & Services Showcase",
          caption: "Responsive Next.js corporate landing experience deployed at www.bks-shipmanagement.com.",
          imageUrl: "/images/projects/bks/home.png",
        },
        {
          id: "bks-2",
          tag: "FIG 02 // BACK-OFFICE CMS",
          title: "Self-Service Content & Career Management Console",
          caption: "Custom CMS empowering non-technical staff to publish updates 70% faster.",
          imageUrl: "/images/projects/bks/career.png",
        },
        {
          id: "bks-3",
          tag: "FIG 03 // CLOUDINARY PIPELINE",
          title: "Automated High-Res Vessel Media Delivery",
          caption: "Express.js + Cloudinary integration serving optimized WebP vessel galleries.",
          imageUrl: "/images/projects/bks/vessel.png",
        },
      ],
      techStack: [
        { name: "Next.js", layer: "Frontend" },
        { name: "Tailwind", layer: "Frontend" },
        { name: "Express", layer: "Backend" },
        { name: "Cloudinary", layer: "Design & Cloud" },
        { name: "Vercel", layer: "Design & Cloud" },
      ],
      verifiedMetrics: [
        {
          value: "70%",
          label: "Faster Content Publishing",
          detail: "Non-technical internal staff update fleet, exhibition, and career pages autonomously.",
        },
        {
          value: "99.9%",
          label: "Production Uptime",
          detail: "Deployed on Vercel edge infrastructure with optimized media delivery.",
        },
        {
          value: "100%",
          label: "Legacy Static-to-Dynamic Migration",
          detail: "Transitioned hardcoded HTML pages into structured API-driven CMS collections.",
        },
      ],
      problemStatement: {
        headline: "Breaking the Developer Dependency for Corporate Maritime Updates",
        contextParagraphs: [
          "PT Bahtera Khatulistiwa Shipping previously relied on a legacy static website that required developer intervention for every fleet update, industry exhibition announcement, or maritime career posting.",
          "As an international ship management company, slow content updates and outdated visual presentation hindered their corporate brand authority and recruitment agility.",
        ],
        painPoints: [
          "Internal communications and HR teams could not publish news or job openings without code changes.",
          "Unoptimized maritime fleet photography slowed initial page load performance.",
          "Inconsistent mobile layout across corporate profile sections.",
        ],
      },
      systemAnalysis: {
        headline: "Content Modeling for Fleet, Exhibitions & Maritime Careers",
        methodologyParagraphs: [
          "Collaborated with PT BKS stakeholders to audit all recurring content types and design a Figma system before writing production code.",
          "Structured RESTful API resources in Express.js paired with Cloudinary media pipelines so uploaded vessel and exhibition photos are automatically compressed and served in modern formats.",
        ],
        keySchemaOrWorkflowBullets: [
          "Role-Authenticated CMS Dashboard: Intuitive WYSIWYG and structured form workflows for internal editors.",
          "Automated Media Optimization: Direct Cloudinary integration for high-resolution vessel photography.",
          "Edge-Optimized Public Frontend: Next.js frontend delivering fast SEO-friendly corporate pages.",
        ],
      },
      architectureBlueprint: {
        summary: "Next.js public corporate portal & back-office CMS connected to an Express.js REST API and Cloudinary CDN.",
        nodes: [
          {
            id: "bks-web",
            layer: "CLIENT",
            title: "Next.js Corporate Portal & CMS UI",
            tech: "Next.js · Tailwind CSS · Figma",
            description: "Public ship management showcase and authenticated back-office CMS dashboard.",
          },
          {
            id: "bks-api",
            layer: "GATEWAY / API",
            title: "Content Management REST API",
            tech: "Node.js · Express.js",
            description: "Secures CRUD operations for fleet profiles, exhibitions, news, and career listings.",
          },
          {
            id: "bks-media",
            layer: "INTEGRATION",
            title: "Cloud Media & Edge Hosting",
            tech: "Cloudinary · Vercel",
            description: "Transforms high-res maritime imagery and ensures 99.9% global availability.",
          },
        ],
        connections: [
          { from: "bks-web", to: "bks-api", label: "REST CRUD & Content Fetch", protocol: "HTTPS" },
          { from: "bks-api", to: "bks-media", label: "Asset Optimization", protocol: "Cloudinary API" },
        ],
      },
      engineeringExecution: {
        headline: "Editorial Maritime Design & 70% Faster Back-Office Workflows",
        decisions: [
          {
            title: "Custom Non-Technical CMS Ergonomics",
            description:
              "Tailored the CMS form architecture specifically around PT BKS's operational vocabulary (Fleet Specifications, Exhibition Galleries, Crew/Office Careers), cutting publishing turnaround by 70%.",
            techTags: ["Next.js", "Express.js", "Tailwind CSS"],
          },
          {
            title: "High-Availability Production Deployment",
            description:
              "Configured production deployment at www.bks-shipmanagement.com with responsive Tailwind breakpoints and Cloudinary image optimization, maintaining 99.9% uptime.",
            techTags: ["Vercel", "Cloudinary", "Production DNS"],
          },
        ],
      },
      impactAndOutcomes: {
        summary:
          "Empowered PT Bahtera Khatulistiwa Shipping with complete editorial autonomy and a modern corporate digital presence.",
        beforeAfterComparison: [
          {
            dimension: "Content Publishing Speed",
            before: "Days waiting for external developer code deployments",
            after: "70% faster self-service publishing via custom CMS dashboard",
          },
          {
            dimension: "Platform Architecture",
            before: "Rigid legacy static HTML pages",
            after: "Dynamic Next.js + Express.js platform with 99.9% uptime",
          },
        ],
      },
    },
    {
      podium:"",
      univ:"",
      slug: "driver-app-pt-kjhms",
      index: "04",
      kind: "project",
      themeColor: "red",
      title: "DRIVER APP — PT KJHMS",
      shortTitle: "Driver App PT KJHMS",
      subtitle: "OCR Receipt Extraction, Ritase Analytics & Auto-Print SIJ",
      year: "2025",
      category: "Logistics OCR & Auto-Print System",
      clientOrContext: "PT KJHMS (PT HMS Logistics)",
      role: "Frontend Developer & System Integrator",
      heroMetricPill: "60% Faster Trip Submission · Instant SIJ Auto-Print",
      cardSummary:
        "Engineered an OCR-assisted driver trip (ritase) submission platform and admin dispatch dashboard in Next.js, cutting manual driver reporting time by 60% and automating Surat Izin Jalan (SIJ) printing.",
      previewImage: {
        src: "/images/projects/hms/hms.png",
        alt: "PT KJHMS Driver Management Dashboard showing Grafik Ritase and OCR receipt verification",
        aspectRatio: "16/10",
      },
      dummyGallery: [
        {
          id: "kjhms-1",
          tag: "FIG 01 // OCR RECEIPT UPLOAD",
          title: "Automated Driver Receipt Metadata Extraction",
          caption: "Drivers upload receipt screenshots to auto-populate trip forms, cutting submission time by 60%.",
          imageUrl: "/images/projects/hms/scan.jpeg",
        },
        {
          id: "kjhms-2",
          tag: "FIG 02 // GRAFIK RITASE CONSOLE",
          title: "7-Day Rolling Fleet Ritase Telemetry",
          caption: "Real-time Next.js dashboard tracking driver trip counts and delivery logs.",
          imageUrl: "/images/projects/hms/ritase.jpeg",
        },
        {
          id: "kjhms-3",
          tag: "FIG 03 // WEB-TO-PRINTER SIJ",
          title: "1-Click Surat Izin Jalan (SIJ) Auto-Printing",
          caption: "Direct hardware print bridge issuing physical dispatch slips upon verification.",
          imageUrl: "/images/projects/hms/sij.jpeg",
        },
      ],
      techStack: [
        { name: "Next.js", layer: "Frontend" },
        { name: "Express", layer: "Backend" },
        { name: "OCR Pipeline", layer: "Integration" },
        { name: "Web-to-Printer", layer: "Integration" },
        { name: "Cloudinary", layer: "Design & Cloud" },
      ],
      verifiedMetrics: [
        {
          value: "60%",
          label: "Faster Trip (Ritase) Submission",
          detail: "Automated receipt screenshot upload with OCR metadata pre-filling.",
        },
        {
          value: "1-Click",
          label: "Auto-Print Surat Izin Jalan (SIJ)",
          detail: "Direct web-to-printer hardware bridge triggers physical dispatch slips upon approval.",
        },
        {
          value: "7-Day",
          label: "Real-Time Grafik Ritase Telemetry",
          detail: "Interactive multi-window charts monitoring driver trip counts and delivery logs.",
        },
      ],
      problemStatement: {
        headline: "Eliminating Logistics Dispatch Delays & Manual Receipt Transcription",
        contextParagraphs: [
          "Logistics drivers at PT KJHMS had to manually type long receipt numbers, fuel/toll totals, and trip timestamps after every delivery, while dispatch admins manually drafted and printed Surat Izin Jalan (SIJ) documents.",
          "Manual data entry on mobile devices led to frequent typos, slow daily ritase reconciliation, and dispatch bottlenecks at the depot.",
        ],
        painPoints: [
          "Drivers spent excessive time manually transcribing physical/digital receipt metadata.",
          "Admins had to manually format and print Surat Izin Jalan (SIJ) documents for each verified trip.",
          "Lack of real-time visual monitoring for daily and weekly fleet ritase volume.",
        ],
      },
      systemAnalysis: {
        headline: "OCR-to-Form Pipeline & Hardware Printer Dispatch Integration",
        methodologyParagraphs: [
          "Designed a mobile-first driver upload workflow in Figma and Next.js where uploading a receipt screenshot automatically triggers OCR parsing and populates structured form fields for quick driver confirmation.",
          "Engineered an admin verification queue connected directly to a Web-to-Printer pipeline so approving a trip simultaneously archives the digital record and prints the physical SIJ.",
        ],
        keySchemaOrWorkflowBullets: [
          "Automated OCR Form Hydration: Parses uploaded receipt screenshots into editable Next.js form state.",
          "Direct Web-to-Printer Dispatch: Admin approval triggers instant formatted SIJ printing without manual PDF export steps.",
          "Grafik Ritase Analytics: 7-day rolling window charts tracking completed trips per driver and fleet utilization.",
        ],
      },
      architectureBlueprint: {
        summary: "Next.js driver & admin interfaces integrated with Express.js APIs, OCR receipt parsing, Cloudinary storage, and Web-to-Printer hardware dispatch.",
        nodes: [
          {
            id: "kjhms-client",
            layer: "CLIENT",
            title: "Next.js Driver & Admin Console",
            tech: "Next.js · Mantine/Tailwind · Chart.js",
            description: "Mobile receipt uploader for drivers and Grafik Ritase + SIJ console for admins.",
          },
          {
            id: "kjhms-ocr",
            layer: "INTEGRATION",
            title: "OCR Metadata Extractor",
            tech: "OCR Pipeline · Cloudinary",
            description: "Extracts structured trip and receipt fields from uploaded driver screenshots.",
          },
          {
            id: "kjhms-api",
            layer: "GATEWAY / API",
            title: "Logistics Trip & SIJ API",
            tech: "Express.js REST API",
            description: "Manages ritase verification states, driver logs, and archival records.",
          },
          {
            id: "kjhms-printer",
            layer: "INTEGRATION",
            title: "Web-to-Printer SIJ Bridge",
            tech: "Web Print API / Thermal & Office Print",
            description: "Executes instant physical printing of Surat Izin Jalan upon admin verification.",
          },
        ],
        connections: [
          { from: "kjhms-client", to: "kjhms-ocr", label: "Receipt Image Upload", protocol: "HTTPS / Multipart" },
          { from: "kjhms-ocr", to: "kjhms-client", label: "Extracted Metadata JSON", protocol: "REST" },
          { from: "kjhms-client", to: "kjhms-api", label: "Verify & Archive Ritase", protocol: "HTTPS" },
          { from: "kjhms-client", to: "kjhms-printer", label: "Auto-Print SIJ", protocol: "Web-to-Printer" },
        ],
      },
      engineeringExecution: {
        headline: "Precision OCR Form Handling & Real-Time Fleet Telemetry",
        decisions: [
          {
            title: "Dynamic OCR Form Hydration",
            description:
              "Built resilient frontend form state in Next.js that maps OCR-extracted receipt fields into validated inputs, cutting driver submission time by 60%.",
            techTags: ["Next.js", "OCR Integration", "Form State"],
          },
          {
            title: "One-Click SIJ Auto-Print & Grafik Ritase",
            description:
              "Integrated direct browser-to-printer dispatch for Surat Izin Jalan alongside interactive 7-day Grafik Ritase visualizations for fleet supervisors.",
            techTags: ["Web-to-Printer", "Dashboard Analytics", "Express.js"],
          },
        ],
      },
      impactAndOutcomes: {
        summary:
          "Accelerated daily driver trip reporting by 60% and eliminated manual SIJ printing bottlenecks for PT KJHMS operations.",
        beforeAfterComparison: [
          {
            dimension: "Driver Trip Submission",
            before: "Slow manual typing of receipt numbers and trip details",
            after: "60% faster submission via OCR screenshot upload & auto-fill",
          },
          {
            dimension: "Surat Izin Jalan (SIJ) Issuance",
            before: "Manual document drafting and separate print steps",
            after: "Instant 1-click Web-to-Printer auto-printing & digital archiving",
          },
        ],
      },
    },
  ],
  featuredAchievement: {
    slug: "lumind",
    index: "AWARD // 01",
    univ: "UIN Sunan Ampel Surabaya",
    podium: "1 Nasional",
    kind: "achievement",
    themeColor: "fuchsia",
    badgeText: "CHAMPION",
    title: "1ST WINNER — PRISMA FEST WEB DESIGN COMPETITION",
    shortTitle: "Lumind (Prisma Fest 1st Winner)",
    subtitle: "Lumind — Digital Mental Wellness & Mindful Space Platform",
    year: "2025",
    category: "National Web Design Competition · UIN Sunan Ampel Surabaya",
    clientOrContext: "Prisma Fest 2025 — Representing IPB University",
    role: "Lead Frontend Designer & Web Developer",
    liveUrl: "https://lumind.vercel.app/",
    heroMetricPill: "Juara 1 Nasional · Prisma Fest 2025 (UIN Sunan Ampel Surabaya)",
    cardSummary:
      "Awarded 1st Place Nationally (Champion) at Prisma Fest 2025 for designing and engineering Lumind—an interactive digital mental wellness platform featuring daily mood check-ins, choreographed breathing cadences, and mindful journaling.",
    previewImage: {
      src: "/images/achievements/prisma/winner.png",
      alt: "Lumind Digital Mental Wellness Platform UI and 1st Winner Prisma Fest 2025 Award Certificate",
      secondaryCertificateSrc: "/images/achievements/prisma/certificate.png",
      aspectRatio: "16/9",
    },
    dummyGallery: [
      {
        id: "lumind-1",
        tag: "DOC 01 // CHAMPION AWARDING",
        title: "1st Place Winner (Juara 1) — Prisma Fest 2025",
        caption: "Representing IPB University at the National Web Design Competition, UIN Sunan Ampel Surabaya.",
        imageUrl: "/images/achievements/prisma/photo.jpg",
      },
      {
        id: "lumind-2",
        tag: "DOC 02 // OFFICIAL CERTIFICATE",
        title: "Juara 1 National Web Design Certificate",
        caption: "Official 1st Winner Certificate awarded by UIN Sunan Ampel Surabaya at Prisma Fest 2025.",
        imageUrl: "/images/achievements/prisma/certificate.png",
      },
      {
        id: "lumind-3",
        tag: "DOC 03 // LUMIND SANCTUARY UI",
        title: "Personalized Daily Mood Check-In (Lacak Emosi)",
        caption: "Calming editorial interface at lumind.vercel.app designed for zero cognitive overload.",
        imageUrl: "/images/achievements/prisma/daily-mood.png",
      },
      {
        id: "lumind-4",
        tag: "DOC 04 // MINDFUL RITUALS",
        title: "Choreographed Breathing Cadence (Atur Napas)",
        caption: "Interactive visual breathing guide and distraction-free journaling module.",
        imageUrl: "/images/achievements/prisma/inhale.png",
      },
    ],
    techStack: [
      { name: "Next.js", layer: "Frontend" },
      { name: "TypeScript", layer: "Frontend" },
      { name: "React", layer: "Frontend" },
      { name: "Tailwind", layer: "Frontend" },
      { name: "Figma", layer: "Design & Cloud" },
      { name: "Vercel", layer: "Design & Cloud" },
    ],
    verifiedMetrics: [
      {
        value: "1st Place",
        label: "National Winner (Juara 1)",
        detail: "Prisma Fest 2025 Web Design Competition at UIN Sunan Ampel Surabaya.",
      },
      {
        value: "3 Modules",
        label: "Core Mindful Rituals",
        detail: "Lacak Emosi (Mood Check-In), Atur Napas (Guided Breathing), & Temukan Ketenangan.",
      },
      {
        value: "100%",
        label: "Responsive Cognitive Ergonomics",
        detail: "Engineered for zero visual clutter, accessible contrast, and calming motion physics.",
      },
    ],
    problemStatement: {
      headline: "Designing a Stigma-Free, Low-Friction Digital Sanctuary for Mental Wellness",
      contextParagraphs: [
        "University students and young professionals frequently experience high cognitive overload and emotional burnout, yet existing mental health platforms often feel overly clinical, cluttered, or intimidating to use for daily self-regulation.",
        "For the Prisma Fest 2025 National Web Design Competition at UIN Sunan Ampel Surabaya, our goal was to craft a web experience ('Lumind — Your Safe Space to Feel') that lowers cognitive friction from the very first second.",
      ],
      painPoints: [
        "Clinical, form-heavy mental health apps discourage consistent daily emotional reflection.",
        "Jarring animations and cluttered dashboards increase anxiety rather than promoting calm.",
        "Lack of immediate, browser-accessible guided breathing and mood check-in tools.",
      ],
    },
    systemAnalysis: {
      headline: "Cognitive Ergonomics & Calming State-Driven Interaction Design",
      methodologyParagraphs: [
        "Applied human-centered UI/UX research to structure Lumind around personalized time-of-day greetings ('Selamat Pagi, Aryo. Lumind adalah ruang digital untuk merawat pikiranmu') and immediate 1-click emotional check-ins.",
        "Balanced warm editorial typography with tactile, low-arousal micro-interactions so users can transition seamlessly between tracking emotions, regulating breath, and journaling.",
      ],
      keySchemaOrWorkflowBullets: [
        "Daily Mood Check-In (Lacak Emosi): Interactive state-driven emotional logging with reflective feedback.",
        "Guided Breathing Cadence (Atur Napas): Rhythmically choreographed visual breathing pacing to reduce acute stress.",
        "Mindful Space (Temukan Ketenangan): Distraction-free interface deployed on Vercel at lumind.vercel.app.",
      ],
    },
    architectureBlueprint: {
      summary: "Client-centric interactive web platform engineered with Next.js/React, Tailwind CSS, and state-driven wellness modules on Vercel.",
      nodes: [
        {
          id: "lumind-hero",
          layer: "CLIENT",
          title: "Personalized Editorial Sanctuary",
          tech: "Next.js · Tailwind CSS · Custom Typography",
          description: "Adaptive greeting header and calm visual hierarchy designed for cognitive ease.",
        },
        {
          id: "lumind-modules",
          layer: "CLIENT",
          title: "Interactive Wellness Engine",
          tech: "React State · Choreographed Motion",
          description: "Powers real-time Mood Check-In, Guided Breathing cadence, and Mindful Journaling.",
        },
        {
          id: "lumind-edge",
          layer: "INTEGRATION",
          title: "Global Edge Deployment",
          tech: "Vercel (lumind.vercel.app)",
          description: "Delivers instant page loads and responsive cross-device accessibility.",
        },
      ],
      connections: [
        { from: "lumind-hero", to: "lumind-modules", label: "Seamless State Transitions", protocol: "Client State" },
        { from: "lumind-modules", to: "lumind-edge", label: "Static & Edge Delivery", protocol: "HTTPS" },
      ],
    },
    engineeringExecution: {
      headline: "Award-Winning UI Polish & Intentional Motion Choreography",
      decisions: [
        {
          title: "Calming Visual & Typographic Hierarchy",
          description:
            "Combined warm editorial pairings with generous whitespace and subtle elevation tokens, earning top scores from national competition judges for originality and visual craft.",
          techTags: ["UI/UX Design", "Typography", "Tailwind CSS"],
        },
        {
          title: "Interactive Mood & Breathing Micro-Interactions",
          description:
            "Built fluid, non-jarring state transitions for daily emotional check-ins and breathing timers that adapt cleanly across mobile and desktop viewports.",
          techTags: ["Frontend Engineering", "Interactive Motion", "Responsive Web"],
        },
      ],
    },
    impactAndOutcomes: {
      summary:
        "Won 1st Place Nationally (Juara 1) at Prisma Fest 2025 (UIN Sunan Ampel Surabaya), representing IPB University.",
      beforeAfterComparison: [
        {
          dimension: "User Onboarding Feel",
          before: "Cold clinical questionnaires with high drop-off",
          after: "Warm conversational greeting & instant 1-tap Mood Check-In",
        },
        {
          dimension: "National Competition Standing",
          before: "Competing against university web design teams nationwide",
          after: "Awarded 1st Winner (Juara 1) at Prisma Fest 2025 — UIN Sunan Ampel Surabaya",
        },
      ],
    },
  },
  workExperiences: [
    {
      kind: "work",
      id: "work-matra-hillindo",
      role: "Front-End Developer & IT Support Intern",
      organization: "Matra Hillindo",
      location: "Bogor, Indonesia",
      employmentType: "Internship",
      tenure: { start: "2023-06", end: "2023-12" },
      highlights: [
        "Developed 15+ responsive front-end website templates integrated with RESTful APIs, accelerating client onboarding speed by 25%.",
        "Engineered an automated invitation forwarding module leveraging the WhatsApp API to auto-fill dynamic guest names, significantly reducing manual messaging efforts and improving delivery speed.",
        "Assisted with backend configuration, functional QA testing, and internal/external network infrastructure setup.",
      ],
      skills: ["RESTful APIs", "WhatsApp API", "Responsive Front-End", "Backend Configuration", "System Testing", "Network Setup"],
    },
  ],
  organizationalExperiences: [
    {
      kind: "organization",
      id: "org-gdgoc-ipb",
      role: "Technical Core Team",
      organization: "Google Developer Groups on Campus (GDGoC) IPB",
      location: "Bogor, Indonesia",
      organizationType: "Student Developer Community",
      tenure: { start: "2026-10", end: null },
      highlights: [
        "Spearheaded the Software Development learning path, delivering hands-on Study Jam workshops covering Frontend, Backend, RESTful APIs, Git, and Cloud technologies.",
        "Mentored aspiring software engineers (Hacker Track) in the GDGoC Catalyst bootcamp via live coding, system design guidance, and detailed code reviews for capstone applications.",
        "Engineered technical assessment rubrics and code evaluation criteria for the Tech League national software competition.",
      ],
      skills: ["Technical Mentorship", "Curriculum Design", "Code Review", "Git & Cloud", "Assessment Rubrics"],
    },
    {
      kind: "organization",
      id: "org-itfest-ipb",
      role: "Vice Head of Competition",
      organization: "IT Festival 2025 Micro IT IPB",
      location: "Bogor, Indonesia",
      organizationType: "Campus Tech Festival",
      tenure: { start: "2025-02", end: "2025-09" },
      highlights: [
        "Authored the official competition guidebook and facilitated technical briefing sessions for 150+ participating teams, ensuring full alignment on rules, criteria, and competition workflows.",
        "Identified, contacted, and onboarded 10+ industry experts and academic professionals to serve as national competition mentors and judges.",
        "Designed and managed the end-to-end participant registration and verification workflow, and served as dedicated Liaison Officer for finalist teams during final evaluation.",
      ],
      skills: ["Competition Management", "Technical Briefing", "Stakeholder Relations", "Registration Workflow"],
    },
  ],
};

export function getAllCaseStudies(): readonly ProjectCaseStudy[] {
  return [...PORTFOLIO_DATA.projects, PORTFOLIO_DATA.featuredAchievement];
}

export function getCaseStudyBySlug(slug: string): ProjectCaseStudy | undefined {
  return getAllCaseStudies().find((item) => item.slug === slug);
}

export function getAdjacentCaseStudies(slug: ProjectSlug): {
  prev: ProjectCaseStudy;
  next: ProjectCaseStudy;
} {
  const all = getAllCaseStudies();
  const idx = all.findIndex((item) => item.slug === slug);
  const safeIdx = idx === -1 ? 0 : idx;
  const prev = all[(safeIdx - 1 + all.length) % all.length];
  const next = all[(safeIdx + 1) % all.length];
  return { prev, next };
}
