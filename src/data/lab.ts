export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  tags: string[];
  url: string;
  source: string;
  status: "published" | "draft";
}

export const projects: Project[] = [
  {
    id: "study-notes-circadian-rhythms-melatonin-and-sleep-regulation",
    slug: "study-notes-circadian-rhythms-melatonin-and-sleep-regulation",
    title: "Study Notes: Circadian Rhythms, Melatonin, and Sleep Regulation",
    description: "This study guide integrates findings from multiple pivotal papers to analyze the mechanisms of circadian phototransduction, wavelength-dependent physiological effects, the impact of ocular aging, clinical applications of light therapy, and downstream molecular pathways governing cognitive function and glymphatic clearance.\n\nPart 1: Core Scientific Arguments\n\nArgument 1: The Paradigm Shift in Photoreception — Melanopsin and Intrinsically Photosensitive Retinal Ganglion Cells (ipRGCs)\nCore Thesis: Mammalian circadian photoentrainment and other non-image-forming (NIF) visual functions (e.g., the pupillary light reflex) do not rely exclusively on classical rods and cones [370, 429]. Instead, they are primarily driven by a specialized, sparse population (~1–2.5%) of intrinsically photosensitive retinal ganglion cells (ipRGCs) expressing the photopigment melanopsin (encoded by the Opn4 gene) [369, 372, 428].\nScientific Evidence & Key References:\nAutonomous Phototransduction: Berson et al. (2002) and Hattar et al. (2002) demonstrated via patch-clamp recordings that isolated SCN-projecting ganglion cells directly depolarize and generate action potentials in response to light, even when all synaptic inputs from rods and cones are pharmacologically blocked [369, 498].\nNeural Circuitry: These ipRGCs form a dense dendritic network in the retina [372] and project their axons directly to the master circadian pacemaker—the suprachiasmatic nucleus (SCN) of the hypothalamus—via a dedicated monosynaptic pathway called the retinohypothalamic tract (RHT) [369, 427, 429].\nThe Essential Conduit: Hattar et al. (2003) and Guler et al. (2008) utilized triple-knockout mice (lacking functional rods, cones, and melanopsin) to show that both circadian photoentrainment and pupillary light reflexes (PLR) are completely abolished [438, 787]. This establishes that ipRGCs act as the final common pathway through which classical rod/cone signals must pass to regulate NIF functions [438, 787].\nBistable Properties: Unlike classical vertebrate photopigments that bleach upon light exposure, melanopsin behaves similarly to invertebrate opsins [436]. It displays bistability (double-state stability), retaining its retinaldehyde chromophore after photoisomerization [431, 436]. This enables it to resist bleaching and generate sustained, non-adapting, and extremely long-lasting depolarizing responses to light [431, 502].\nArgument 2: The Critical Role of Short-Wavelength Blue Light — Acute Melatonin Suppression and Alertness\nCore Thesis: Non-image-forming visual responses—such as acute melatonin suppression, thermoregulation, heart rate modulation, and alertness—are highly wavelength-dependent and physiologically blue-shifted toward the short-wavelength spectrum (~460–480 nm), matching the peak sensitivity of melanopsin [185, 324, 325].\nScientific Evidence & Key References:\nAction Spectrum: Brainard et al. (2001) established the first action spectrum for human melatonin suppression, identifying 446–477 nm as the most potent wavelength region providing circadian input to regulate pineal melatonin secretion [2, 8]. This spectrum is distinct from the classical three-cone visual photopic system which peaks at 555 nm [2, 325].\nAcute Physiological Activation: Cajochen et al. (2005) demonstrated in a strictly controlled constant posture (CP) protocol that a 2-hour exposure to 460 nm monochromatic blue light in the late evening induced significantly greater melatonin suppression, reduced subjective sleepiness (measured via the Karolinska Sleepiness Scale, KSS), elevated core body temperature (CBT), and increased heart rate compared to 550 nm green light [324, 334, 339, 340]. This suggests blue light directly modulates sympathetic autonomic tone [343].\nSlew-Rate Limitation: Figueiro et al. (2006) demonstrated that nocturnal melatonin suppression follows a rate-limited response (a \"slew rate\" ceiling of approximately 1.5% suppression per minute of light exposure), meaning that the rate of blood melatonin reduction cannot be accelerated indefinitely, regardless of the light intensity [183, 203, 205].\nPolychromatic Synergy: Revell et al. (2007) showed that when matched for total melanopsin-stimulating photons, polychromatic white light is more effective at suppressing melatonin than monochromatic blue light [367]. This implies a stimulatory contribution from classical cones or mechanisms promoting melanopsin regeneration [367].\nWorkplace Optimization: Sunde et al. (2020) compared ceiling-mounted blue-enriched white LED light (7000 K) and warm white light (2500 K) of equal photon density during simulated night shifts [67]. The 7000 K light significantly improved cognitive performance, resulting in fewer lapses and false starts on the Psychomotor Vigilance Task (PVT) and more correct responses on the Digit Symbol Substitution Test (DSST) [67, 102, 106].\nArgument 3: Circadian Photoreception and Ocular Aging — Loss of Blue Light Transmission\nCore Thesis: Natural biological aging reduces the amount of short-wavelength blue light reaching the retina due to progressive lens yellowing (which filters blue light) and senile miosis (pupil constriction) [13, 566, 567]. This physiological decline in circadian light transmission is a key driver of sleep fragmentation, cognitive decline, and mood disorders in the elderly [567, 574, 578].\nScientific Evidence & Key References:\nExponential Reduction: Dong et al. (2014) summarized that relative to a 10-year-old child's crystalline lens, a 45-year-old adult receives only about 50% of the effective circadian blue light, while a 95-year-old senior receives only 10% [567]. Consequently, older adults require up to 10 times higher ambient illuminance to achieve equivalent circadian synchronization [567].\nCataract Surgery Interventions: Cataract progression severely compounds this deficit [568]. Clinical studies by Asplund and Lindblad established that cataract extraction followed by the implantation of non-blue-blocking (standard UV-filtering) intraocular lenses (IOLs)—which maximize the transmission of circadian blue light—significantly improves nocturnal sleep quality and decreases daytime sleepiness [569].\nArgument 4: Clinical Applications of Light Therapy — Modulating Phase Shift and Neurodegenerative Diseases\nCore Thesis: Light exposure acts as the primary entraining cue (zeitgeber) for SCN molecular clocks [70, 602]. Administering bright light at specific times relative to the phase response curve (PRC) can shift circadian phases and clinically treat sleep, psychiatric, and neurodegenerative disorders [3, 531, 595].\nScientific Evidence & Key References:\nPhase Response Curve (PRC) Dynamics: Light exposure administered before the core body temperature minimum (CBTmin, typically between 2:00 and 4:00 AM) induces a phase delay (shifting sleep later), whereas light exposure after the CBTmin induces a phase advance (shifting sleep earlier) [536, 604].\nTreating Sleep-Wake Disorders (CRSWDs): For patients with Delayed Sleep-Wake Phase Disorder (DSWPD), morning light therapy advances the Dim Light Melatonin Onset (DLMO) [605]. Conversely, evening light therapy delays sleep phase and increases sleep efficiency in Advanced Sleep-Wake Phase Disorder (ASWPD) [533, 605, 606].\nAlzheimer's Disease (AD) Interventions: AD patients suffer from severe circadian disruption, loss of SCN melatonin receptors, and reduced nocturnal melatonin [534]. Standardized bright light therapy (e.g., 3000 lux for 2 hours in the morning) stabilizes their rest-activity cycles, increases nocturnal sleep duration, and reduces behavioral disturbances like sundowning, wandering, and agitation [534, 535, 610].\nParkinson's Disease (PD) Interventions: PD patients suffer from retinal dopamine depletion and sleep fragmentation [535]. Delivering bright light therapy (1000–10000 lux) in the morning and evening over several weeks dramatically improves both motor symptoms and nocturnal sleep continuity [536].\nArgument 5: The Molecular Cascade in Cognitive Function — Melatonin, Clock Genes, and the Glymphatic System\nCore Thesis: Melatonin is far more than a sleep aid; it functions as a critical neuroprotective hormone [720, 722]. It coordinates SCN core clock gene feedback loops, maintains Glymphatic System (GS) clearance of neurotoxic metabolic waste, acts as an anti-inflammatory agent, and preserves hippocampal synaptic plasticity [720].\nScientific Evidence & Key References:\nSCN Core Clock Feedback Loop: The molecular SCN clock consists of positive transcriptional activators (BMAL1/CLOCK) and negative feedback inhibitors (PER/CRY) [724, 725]. Melatonin acts through MT1/MT2 receptors to upregulate BMAL1 expression, directly protecting learning and memory functions from sleep-deprivation-induced damage [726, 727].\nGlymphatic Clearance & AQP4 Polarization: During sleep, CSF flows through the brain parenchyma to wash away toxic wastes, including Amyloid-$\\beta$ (Aβ) plaques associated with AD [729]. This glymphatic clearance relies on the polarized distribution of Aquaporin-4 (AQP4) channels at astrocytic endfeet [729].\nThe PER2-Dtna-AQP4 Pathway: Weng and Wang (2025) summarized how melatonin regulates the circadian expression of PER2, which directly interacts with the $\\alpha$-dystrobrevin (Dtna) subunit in astrocytes to direct the polarization of AQP4 channels [730]. If AQP4 polarization is blocked (using the inhibitor TGN020), the therapeutic effects of melatonin on glymphatic flow and cognitive deficits are significantly compromised [730].\nAntioxidant & Anti-inflammatory Mechanisms: Melatonin is a potent free radical scavenger [668, 731]. It binds to the ROR$\\alpha$ nuclear receptor to suppress NF-$\\kappa$B pathways and upregulates SIRT1, thereby decreasing the expression of neuroinflammatory cytokines (TNF-$\\alpha$, IL-6) and protecting hippocampal Long-Term Potentiation (LTP) and synaptic plasticity [731, 732, 733].\nArgument 6: Seasons, Depression, and Retinal Light Sensitivity\nCore Thesis: Human retinal sensitivity to light is highly dependent on seasonal photoperiods [259, 269]. In clinically depressed patients, this light-sensitivity pathway is physiologically compromised, resulting in a state of \"perpetual winter\" characterized by circadian misalignment year-round [263, 291].\nScientific Evidence & Key References:\nSeasonal Modulation of the PIPR: Wescott et al. (2024) utilized the post-illumination pupil response (PIPR)—a specific biomarker of melanopsin-driven ipRGC activity [261, 266]—to show that higher retinal light sensitivity is significantly associated with later circadian phase (DLMO) only during the summer [263, 285]. In winter, due to short natural photoperiods and high evening artificial screen use, this physiological association is disrupted [298].\nThe \"Perpetual Winter\" of Depression: While individuals with minimal depressive symptoms maintain a strong correlation between light sensitivity and circadian alignment (the DLMO-midsleep phase angle), this correlation completely breaks down in patients with moderate-to-severe depression [263, 292]. Depressed patients exhibit blunted PIPR (light hyposensitivity) [311] and restricted environmental light exposure regardless of the season, locking them into a state of chronic circadian desynchronization [291].",
    image: "/media/b478a9be-430c-4cd1-8ac9-44dd8c086c58.png",
    date: "2027-07-25",
    tags: ["Melatonin", "Circadian Rhythms", "Sleep Regulation", "Wavelength Blue Light"],
    url: "",
    source: "",
    status: "published",
  },
  {
    id: "daily-photo-api",
    slug: "daily-photo-api",
    title: "每日一图 API",
    description: "从 Unsplash 精选图片中每日推送一张高质量摄影作品，支持 RSS 和邮件订阅。",
    image: "https://picsum.photos/seed/lab-daily/800/600",
    date: "July 2026",
    tags: ["Node.js", "API", "Unsplash"],
    url: "https://example.com",
    source: "https://github.com",
    status: "published",
  },
  {
    id: "memory-map",
    slug: "memory-map",
    title: "记忆地图",
    description: "将旅行照片按地理位置聚合，在地图上重走每一条路径，用视觉叙事重构旅途记忆。",
    image: "https://picsum.photos/seed/lab-map/800/600",
    date: "July 2026",
    tags: ["Mapbox", "Photography", "Storytelling"],
    url: "https://example.com",
    source: "",
    status: "published",
  },
  {
    id: "paper-plane",
    slug: "paper-plane",
    title: "纸飞机",
    description: "极简的 Markdown 笔记工具，支持本地存储和导出。设计理念是「打开即写，写完即走」。",
    image: "https://picsum.photos/seed/lab-paper/800/600",
    date: "July 2026",
    tags: ["React", "TypeScript", "PWA"],
    url: "",
    source: "https://github.com",
    status: "published",
  },
  {
    id: "silent-clock",
    slug: "silent-clock",
    title: "静默时钟",
    description: "一个没有指针的时钟——用渐变的色彩替代时间流逝，适合放在第二屏幕上作为专注背景。",
    image: "https://picsum.photos/seed/lab-clock/800/600",
    date: "July 2026",
    tags: ["Canvas", "Generative", "Ambient"],
    url: "https://example.com",
    source: "https://github.com",
    status: "published",
  },
  {
    id: "sound-of-silence",
    slug: "sound-of-silence",
    title: "寂静之声",
    description: "一个专注于环境音采集与空间音频的实验项目，收录城市角落中被人遗忘的声音景观。",
    image: "https://picsum.photos/seed/lab-sound/800/600",
    date: "July 2026",
    tags: ["Audio", "Web Audio API", "Field Recording"],
    url: "https://example.com",
    source: "https://github.com",
    status: "published",
  },
  {
    id: "type-lab",
    slug: "type-lab",
    title: "字形实验室",
    description: "在线字体对比工具，支持数百款开源中英文字体的实时预览、配对测试和 CSS 导出。",
    image: "https://picsum.photos/seed/lab-type/800/600",
    date: "July 2026",
    tags: ["Typography", "CSS", "Design Tools"],
    url: "",
    source: "https://github.com",
    status: "published",
  }
];

export const publishedProjects: Project[] = projects.filter(p => p.status !== "draft");
