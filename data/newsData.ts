import { Article, FactCheckItem, MarketItem, OpinionPiece, PollQuestion } from '@/types/news';

export const BREAKING_NEWS_ALERTS = [
  "BREAKING: Senate passes bipartisan infrastructure modernization package in 68-32 vote.",
  "DEVELOPING: Federal Reserve holds benchmark interest rate steady; signals potential cut next quarter.",
  "UPDATE: Tech consortium unveils new safety benchmarks for enterprise AI models in Washington summit.",
  "JUST IN: US aerospace team confirms successful lunar orbit insertion for Artemis mission."
];

export const MARKET_DATA: MarketItem[] = [
  { symbol: "DJIA", name: "Dow Jones", value: "43,842.10", change: "+168.45 (+0.39%)", isPositive: true },
  { symbol: "SPX", name: "S&P 500", value: "5,864.67", change: "+24.80 (+0.42%)", isPositive: true },
  { symbol: "COMP", name: "Nasdaq", value: "18,518.61", change: "+102.32 (+0.56%)", isPositive: true },
  { symbol: "TNX", name: "10-Yr Treasury", value: "4.18%", change: "-0.04 (-0.95%)", isPositive: false },
  { symbol: "CL", name: "Crude Oil", value: "$71.25", change: "-0.82 (-1.14%)", isPositive: false },
  { symbol: "GC", name: "Gold", value: "$2,674.30", change: "+14.60 (+0.55%)", isPositive: true }
];

export const ARTICLES_DATA: Article[] = [
  {
    id: "lead-01",
    slug: "capitol-hill-ai-regulatory-framework",
    kicker: "CAPITOL HILL EXCLUSIVE",
    title: "Senate Unveils Landmark Bipartisan Framework to Regulate Autonomous AI Systems",
    summary: "Lawmakers in Washington have reached a milestone agreement to establish federal safety oversight and risk audits for frontier artificial intelligence developers, balancing innovation with national security.",
    content: [
      "WASHINGTON — In what congressional leaders are calling the most ambitious bipartisan technology initiative in a decade, a bicameral committee presented a comprehensive legislative framework on Thursday aimed at regulating high-tier artificial intelligence platforms.",
      "The 240-page blueprint introduces mandatory algorithmic auditing for frontier neural networks, standardized red-teaming evaluations before commercial rollout, and federal oversight under a newly chartered Bureau of Emerging Systems.",
      "‘We are not seeking to stifle American engineering or surrender our competitive edge,’ said Senate Commerce Committee leadership during a morning press briefing. ‘Rather, this legislation establishes the guardrails essential for consumer trust, data privacy, and national resilience.’",
      "Industry response has been cautiously optimistic. Major Silicon Valley leaders who testified during closed-door hearings expressed support for unified federal standards over a patchwork of state-level statutes.",
      "The bill is slated for committee markups early next week, with floor votes expected before the upcoming recess."
    ],
    category: "Politics",
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    imageCaption: "The Capitol Building in Washington, D.C., where senators unveiled the bipartisan AI framework.",
    author: {
      name: "Marcus Vance",
      role: "Senior Congressional Correspondent",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "24 mins ago",
    readTimeMinutes: 5,
    isBreaking: true,
    isLeadStory: true,
    isHot: true,
    viewCount: 14230,
    reactions: { likes: 624, insightful: 312, shocked: 45 },
    tags: ["Senate", "AI Policy", "Bipartisan", "Tech Regulation"]
  },
  {
    id: "pol-02",
    slug: "supreme-court-clean-energy-ruling",
    kicker: "SUPREME COURT",
    title: "Justices Hear Oral Arguments in High-Stakes Clean Grid Infrastructure Dispute",
    summary: "The nation's highest court examined whether federal interstate compacts can expedite high-voltage renewable transmission corridors through disputed state boundaries.",
    content: [
      "WASHINGTON — The Supreme Court heard intense oral arguments Wednesday in a case that could dictate the pace of America's multi-trillion-dollar transition to modern electrical grids.",
      "At issue is whether federal energy regulators hold constitutional authority to approve interstate high-voltage lines over municipal and state objections when grid reliability is threatened.",
      "Several justices questioned both the historical limits of interstate commerce and the pressing urgency of severe weather threats to regional energy reserves.",
      "A ruling is anticipated in late June."
    ],
    category: "Politics",
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    imageCaption: "Supreme Court courtroom columns and seal in Washington D.C.",
    author: {
      name: "Elena Rostova",
      role: "Supreme Court Analyst",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "1 hour ago",
    readTimeMinutes: 4,
    isHot: true,
    viewCount: 9840,
    reactions: { likes: 341, insightful: 189, shocked: 22 },
    tags: ["Supreme Court", "Energy", "Infrastructure", "Law"]
  },
  {
    id: "econ-03",
    slug: "fed-rate-decision-inflation-job-report",
    kicker: "WALL STREET & FED",
    title: "Treasury Yields Cool as Labor Data Points to Durable ‘Soft Landing’ for US Economy",
    summary: "Consumer resilience and moderating wage inflation have bolstered Wall Street confidence that the Federal Reserve can sustain employment without stoking consumer price pressures.",
    content: [
      "NEW YORK — Financial markets rallied across all major indices after the Labor Department’s latest payroll figures came in precisely along consensus projections, accompanied by a steady 3.9% unemployment reading.",
      "The data reinforces expectations that the Federal Open Market Committee is navigating the elusive economic soft landing after nearly two years of disciplined monetary tightening.",
      "‘We are seeing the balance re-equilibrate smoothly,’ noted the chief US economist at a leading Manhattan investment firm. ‘Wage gains are outpacing inflation, while company margins remain remarkably resilient.’",
      "Treasury yields pulled back slightly, providing tailwinds for residential housing applications and small-cap equities."
    ],
    category: "Economy",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    imageCaption: "Trading desk monitors tracking domestic equities and bond yield movements.",
    author: {
      name: "Julian Sterling",
      role: "Chief Financial Editor",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "2 hours ago",
    readTimeMinutes: 6,
    isHot: true,
    viewCount: 11200,
    reactions: { likes: 512, insightful: 405, shocked: 18 },
    tags: ["Federal Reserve", "Wall Street", "Labor Market", "Inflation"]
  },
  {
    id: "tech-04",
    slug: "next-gen-quantum-computing-breakthrough",
    kicker: "SILICON VALLEY",
    title: "US Research Consortium Achieves 99.9% Quantum Error Correction Milestone",
    summary: "Scientists at major national laboratories and private tech campuses announce a fault-tolerant logical qubit breakthrough that paves the way for commercial pharmaceutical and materials discovery.",
    content: [
      "BOULDER, Colo. — A joint initiative between national scientific labs and leading domestic tech firms has demonstrated real-time error suppression across 48 physical qubits, maintaining quantum coherence tenfold longer than previous benchmarks.",
      "The breakthrough removes one of the most stubborn physical roadblocks hindering practical quantum computation.",
      "‘This shifts quantum computing from an experimental curiosity to an engineering discipline with immediate industrial applications,’ said the principal investigator during the announcement.",
      "Commercial prototypes tailored for molecular simulation are projected to enter pilot testing by early next year."
    ],
    category: "Technology",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    imageCaption: "Quantum dilution refrigerator apparatus undergoing ultra-low temperature calibration.",
    author: {
      name: "Dr. Aris Thorne",
      role: "Emerging Tech Reporter",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "3 hours ago",
    readTimeMinutes: 4,
    isHot: true,
    viewCount: 8750,
    reactions: { likes: 820, insightful: 610, shocked: 94 },
    tags: ["Quantum", "Silicon Valley", "Deep Tech", "Innovation"]
  },
  {
    id: "world-05",
    slug: "indo-pacific-naval-trade-pact",
    kicker: "GLOBAL ALLIANCES",
    title: "US and Allied Navies Launch Coordinated Sea-Lane Security Patrols Across Western Pacific",
    summary: "Defense officials from Washington, Tokyo, and Canberra inaugurate joint maritime awareness drills to safeguard critical microchip shipping corridors and undersea communication cables.",
    content: [
      "HONOLULU — Admiral commanders from the US Indo-Pacific Command, along with regional security counterparts, commenced comprehensive naval exercises on Friday designed to protect freedom of navigation.",
      "The joint mission encompasses surface patrols, anti-submarine tracking, and real-time cyber defense integration guarding key undersea telecommunication trunks.",
      "Officials underscored that uninterrupted commerce through these waterways is vital to the global economy and democratic stability."
    ],
    category: "World",
    imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    imageCaption: "Naval escort vessels conducting joint fleet operations in international waters.",
    author: {
      name: "Chloe Chen",
      role: "National Security Correspondent",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "4 hours ago",
    readTimeMinutes: 5,
    viewCount: 6300,
    reactions: { likes: 210, insightful: 175, shocked: 33 },
    tags: ["Defense", "Indo-Pacific", "Navy", "Foreign Policy"]
  },
  {
    id: "sci-06",
    slug: "artemis-deep-space-communications",
    kicker: "AEROSPACE & SCIENCE",
    title: "NASA Deploys High-Bandwidth Deep Space Optical Laser Link for Lunar Outpost",
    summary: "Broadband laser transceivers tested between the Moon and Earth transmit 4K telemetry and scientific payloads at 1.2 gigabits per second, heralding a new communication era.",
    content: [
      "HOUSTON — Flight controllers at Johnson Space Center confirmed the successful lock-on of an infrared laser downlink between the Lunar Gateway testbed and ground stations in California.",
      "The breakthrough allows astronauts and robotic explorers to beam scientific video, multispectral geological surveys, and live HD data streams back to Earth instantaneously.",
      "This system will serve as the primary communication backbone for upcoming crewed Artemis landings on the lunar south pole."
    ],
    category: "Science",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    imageCaption: "Earth viewed from deep orbital observation trajectory.",
    author: {
      name: "Liam O'Connor",
      role: "Space & Physics Editor",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "5 hours ago",
    readTimeMinutes: 3,
    viewCount: 7120,
    reactions: { likes: 940, insightful: 450, shocked: 50 },
    tags: ["NASA", "Artemis", "Space Exploration", "Technology"]
  },
  {
    id: "cult-07",
    slug: "broadway-revival-box-office-records",
    kicker: "ARTS & CULTURE",
    title: "Broadway Enjoys Historic Attendance Surge Driven by Original American Musicals",
    summary: "Theater receipts in New York City topped post-pandemic records this quarter as new biographical dramas and bold musical revivals draw record domestic and overseas audiences.",
    content: [
      "NEW YORK — The Broadway League reported unprecedented ticket sales this week, recording over $39 million across 34 active theatrical productions.",
      "Producers attribute the resurgence to daring new original scripts, competitive dynamic student ticketing initiatives, and high-profile ensemble performances.",
      "‘Live theatrical performance in America is undergoing an invigorating renaissance,’ noted a veteran Broadway producer."
    ],
    category: "Culture",
    imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
    imageCaption: "Bright marquee lighting in Manhattan's Theater District.",
    author: {
      name: "Hannah Goldstein",
      role: "Culture & Entertainment Critic",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "6 hours ago",
    readTimeMinutes: 4,
    viewCount: 5400,
    reactions: { likes: 380, insightful: 110, shocked: 8 },
    tags: ["Broadway", "Culture", "New York", "Arts"]
  },
  {
    id: "sports-08",
    slug: "major-league-expansion-cities-shortlist",
    kicker: "SPORTS BUSINESS",
    title: "Major League Baseball Finalizes Four-City Shortlist for 2028 Franchise Expansion",
    summary: "Franchise owners and league executives have narrowed prospective expansion candidates down to Salt Lake City, Nashville, Portland, and Charlotte for two new 32-team slots.",
    content: [
      "NEW YORK — MLB Commissioner Manfred announced the formal selection of four finalist metropolitan regions vying to host two upcoming expansion franchises slated to begin play by 2028.",
      "Each candidate group has submitted shovel-ready stadium blueprints, municipal bonding agreements, and comprehensive media market projections.",
      "Final franchise awards are scheduled to be decided during the December winter owners meetings."
    ],
    category: "Sports",
    imageUrl: "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=800&q=80",
    imageCaption: "A classic baseball stadium diamond under late afternoon sunlight.",
    author: {
      name: "Derrick Cole",
      role: "Sports Desk Editor",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80"
    },
    publishedAt: "7 hours ago",
    readTimeMinutes: 3,
    viewCount: 6890,
    reactions: { likes: 410, insightful: 98, shocked: 14 },
    tags: ["MLB", "Baseball", "Sports Business", "Expansion"]
  }
];

export const FACT_CHECK_DATA: FactCheckItem[] = [
  {
    id: "fc-1",
    claim: "‘US manufacturing employment has fallen to historic 50-year lows.’",
    claimant: "Viral Social Media Campaign",
    verdict: "False",
    explanation: "Federal Bureau of Labor Statistics data demonstrates US manufacturing payrolls stand near 12.98 million, up substantially from 2020 levels and far above the historic 2010 lows.",
    source: "Bureau of Labor Statistics Employment Data (Q4 2025)",
    date: "Sep 4, 2026"
  },
  {
    id: "fc-2",
    claim: "‘The federal deficit contracted by 40% due solely to clean energy tax provisions.’",
    claimant: "Congressional Floor Debate Speech",
    verdict: "Misleading",
    explanation: "While green energy provisions spurred private sector capital investment, deficit reductions were primarily driven by increased corporate receipts and expiration of pandemic-era allocations.",
    source: "Congressional Budget Office Baseline Review",
    date: "Sep 3, 2026"
  },
  {
    id: "fc-3",
    claim: "‘Domestic renewable energy generation exceeded coal electricity output for the second straight quarter.’",
    claimant: "Department of Energy Press Release",
    verdict: "True",
    explanation: "EIA monthly electric reports verify that combined solar, wind, and hydroelectric generation reached 25.4% of US grid capacity, exceeding coal’s 15.1% share.",
    source: "Energy Information Administration (EIA) Monthly Grid Audit",
    date: "Sep 1, 2026"
  }
];

export const OPINION_DATA: OpinionPiece[] = [
  {
    id: "op-1",
    title: "Why America’s Next Century Belongs to Regional Manufacturing Innovation Hubs",
    author: {
      name: "Dr. Robert K. Sterling",
      title: "Senior Fellow at Brookings Institution",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
    },
    pullQuote: "The revitalized Rust Belt is proving that physical engineering and software ingenuity are no longer mutually exclusive.",
    category: "Economic Policy",
    readTime: "4 min read"
  },
  {
    id: "op-2",
    title: "The Ethics of Sovereign AI: Why the Capitol Hill Compromise Matters",
    author: {
      name: "Amara Washington",
      title: "Former FTC Policy Counsel & Tech Columnist",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80"
    },
    pullQuote: "Without clear safety guardrails, public trust will erode just as AI technologies begin addressing our toughest diagnostic challenges.",
    category: "Tech & Society",
    readTime: "5 min read"
  },
  {
    id: "op-3",
    title: "Rebuilding Civic Trust: What Modern Public Schools Teach Us About Discourse",
    author: {
      name: "Jonathan Bradley",
      title: "Author & Public Education Advocate",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80"
    },
    pullQuote: "Civic resilience is not born in Washington committee rooms; it is nurtured in everyday community halls and local school boards.",
    category: "American Society",
    readTime: "3 min read"
  }
];

export const INITIAL_POLL: PollQuestion = {
  id: "daily-poll-sept",
  question: "How do you evaluate the current trajectory of the US economy over the next 12 months?",
  description: "Cast your vote in today's US Hot News National Sentiment Pulse.",
  totalVotes: 12480,
  options: [
    { id: "opt-1", text: "Very Optimistic — Growth will accelerate and inflation will moderate", votes: 4618 },
    { id: "opt-2", text: "Cautiously Balanced — Modest growth with stable employment", votes: 5241 },
    { id: "opt-3", text: "Pessimistic — Expecting slowdown or market volatility", votes: 2135 },
    { id: "opt-4", text: "Undecided / Need more data", votes: 486 }
  ]
};
