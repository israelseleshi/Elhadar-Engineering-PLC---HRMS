export type OrgChartNode = {
    id: string;
    name: string;
    title: string;
    initials?: string;
    badge?: string;
    category?: 'ceo' | 'track' | 'wing' | 'directorate' | 'division';
    accentColor?: string;
    bgAccent?: string;
    textAccent?: string;
    description?: string;
    reports?: OrgChartNode[];
};

// -------------------------------------------------------------
// COMPLETE ENTERPRISE TREE (Tessera UI Format)
// -------------------------------------------------------------
export const COMPLETE_ENTERPRISE_TREE: OrgChartNode = {
    id: 'ceo-root',
    name: 'CHIEF EXECUTIVE OFFICER (CEO)',
    title: 'Office of the CEO • Executive Committee Chair',
    initials: 'CEO',
    category: 'ceo',
    accentColor: '#c9a227',
    bgAccent: 'bg-amber-100 dark:bg-amber-950/60',
    textAccent: 'text-amber-800 dark:text-amber-300',
    description: 'Executive Governance, Enterprise Strategy, Board Relations & Corporate Leadership',
    reports: [
        // ---------------------------------------------------------
        // TRACK 1: STRATEGIC & CORPORATE SUPPORT FUNCTIONS
        // ---------------------------------------------------------
        {
            id: 'track-strategic',
            name: 'Strategic & Corporate Support Functions',
            title: 'Governance, Advisory & Oversight Service Wings (6 Wings)',
            initials: 'SF',
            category: 'track',
            accentColor: '#0066cc',
            bgAccent: 'bg-blue-100 dark:bg-blue-950/60',
            textAccent: 'text-blue-800 dark:text-blue-300',
            description: 'Enterprise Strategy, Risk Governance, Legal Counsel, Audit, HSE & Market Development',
            reports: [
                {
                    id: 'wing-strategy',
                    name: 'Chief Strategy & Transformation Officer',
                    title: 'Strategy & Transformation Center',
                    initials: 'ST',
                    category: 'wing',
                    accentColor: '#0066cc',
                    bgAccent: 'bg-blue-100 dark:bg-blue-950/60',
                    textAccent: 'text-blue-700 dark:text-blue-300',
                    reports: [
                        {
                            id: 'st-coe',
                            name: 'Strategy & Transformation Center of Excellence',
                            title: 'Strategic Architecture & Execution',
                            initials: 'COE',
                            category: 'directorate',
                        },
                        {
                            id: 'st-dto',
                            name: 'Digital Transformation Office',
                            title: 'Enterprise Digital Systems',
                            initials: 'DTO',
                            category: 'directorate',
                            reports: [
                                { id: 'dto-erp', name: 'ERP Governance', title: 'Division', initials: 'ERP', category: 'division' },
                                { id: 'dto-ai', name: 'AI & Data Analytics', title: 'Division', initials: 'AI', category: 'division' },
                                { id: 'dto-pmis', name: 'Digital PMIS', title: 'Division', initials: 'PMIS', category: 'division' },
                            ],
                        },
                        {
                            id: 'st-inno',
                            name: 'Innovation Office',
                            title: 'Emerging Tech & R&D',
                            initials: 'INO',
                            category: 'directorate',
                        },
                    ],
                },
                {
                    id: 'wing-audit',
                    name: 'Internal Audit & Compliance Service',
                    title: 'Oversight & Quality Assurance',
                    initials: 'IA',
                    category: 'wing',
                    accentColor: '#059669',
                    bgAccent: 'bg-emerald-100 dark:bg-emerald-950/60',
                    textAccent: 'text-emerald-700 dark:text-emerald-300',
                    reports: [
                        { id: 'ia-audit', name: 'Internal Audit', title: 'Division', initials: 'IA', category: 'division' },
                        { id: 'ia-comp', name: 'Compliance Management', title: 'Division', initials: 'CM', category: 'division' },
                        { id: 'ia-qa', name: 'Quality Assurance', title: 'Division', initials: 'QA', category: 'division' },
                    ],
                },
                {
                    id: 'wing-risk',
                    name: 'Enterprise Risk Management Service',
                    title: 'Risk Governance & Continuity',
                    initials: 'RM',
                    category: 'wing',
                    accentColor: '#d97706',
                    bgAccent: 'bg-amber-100 dark:bg-amber-950/60',
                    textAccent: 'text-amber-700 dark:text-amber-300',
                    reports: [
                        { id: 'erm-risk', name: 'Risk Management', title: 'Division', initials: 'RM', category: 'division' },
                        { id: 'erm-ins', name: 'Insurance Management', title: 'Division', initials: 'IM', category: 'division' },
                        { id: 'erm-claims', name: 'Claims Risk Management', title: 'Division', initials: 'CR', category: 'division' },
                        { id: 'erm-bcm', name: 'Business Continuity', title: 'Division', initials: 'BC', category: 'division' },
                    ],
                },
                {
                    id: 'wing-legal',
                    name: 'Corporate Legal Affairs Service',
                    title: 'Legal Counsel & Contracts',
                    initials: 'LA',
                    category: 'wing',
                    accentColor: '#6366f1',
                    bgAccent: 'bg-indigo-100 dark:bg-indigo-950/60',
                    textAccent: 'text-indigo-700 dark:text-indigo-300',
                    reports: [
                        { id: 'leg-adv', name: 'Legal Advisory', title: 'Division', initials: 'LA', category: 'division' },
                        { id: 'leg-cntr', name: 'Contracts & Agreements', title: 'Division', initials: 'CA', category: 'division' },
                        { id: 'leg-lit', name: 'Litigation Management', title: 'Division', initials: 'LM', category: 'division' },
                        { id: 'leg-reg', name: 'Regulatory Affairs', title: 'Division', initials: 'RA', category: 'division' },
                    ],
                },
                {
                    id: 'wing-mkt',
                    name: 'Marketing & Business Development Service',
                    title: 'Market Growth & Tendering',
                    initials: 'BD',
                    category: 'wing',
                    accentColor: '#0284c7',
                    bgAccent: 'bg-sky-100 dark:bg-sky-950/60',
                    textAccent: 'text-sky-700 dark:text-sky-300',
                    reports: [
                        { id: 'mbd-intel', name: 'Market Intelligence', title: 'Division', initials: 'MI', category: 'division' },
                        { id: 'mbd-bd', name: 'Business Development', title: 'Division', initials: 'BD', category: 'division' },
                        { id: 'mbd-bid', name: 'Bid Management', title: 'Division', initials: 'BM', category: 'division' },
                        { id: 'mbd-brand', name: 'Corporate Branding', title: 'Division', initials: 'CB', category: 'division' },
                    ],
                },
                {
                    id: 'wing-hse',
                    name: 'HSE Department',
                    title: 'Health, Safety & Environment',
                    initials: 'HSE',
                    category: 'wing',
                    accentColor: '#10b981',
                    bgAccent: 'bg-teal-100 dark:bg-teal-950/60',
                    textAccent: 'text-teal-700 dark:text-teal-300',
                    reports: [
                        { id: 'hse-health', name: 'Health Management', title: 'Division', initials: 'HM', category: 'division' },
                        { id: 'hse-safety', name: 'Safety Management', title: 'Division', initials: 'SM', category: 'division' },
                        { id: 'hse-env', name: 'Environment Management', title: 'Division', initials: 'EM', category: 'division' },
                        { id: 'hse-sust', name: 'Sustainability & Compliance', title: 'Division', initials: 'SC', category: 'division' },
                    ],
                },
            ],
        },

        // ---------------------------------------------------------
        // TRACK 2: OPERATING OFFICERS & BUSINESS UNITS
        // ---------------------------------------------------------
        {
            id: 'track-operating',
            name: 'Operating Officers & Business Units',
            title: 'Core Delivery & Execution Wings (6 Wings)',
            initials: 'OP',
            category: 'track',
            accentColor: '#059669',
            bgAccent: 'bg-emerald-100 dark:bg-emerald-950/60',
            textAccent: 'text-emerald-800 dark:text-emerald-300',
            description: 'Engineering, Construction Operations, Project PMO, Plant & Fleet, Corporate Services & Ventures',
            reports: [
                {
                    id: 'wing-const',
                    name: 'DCEO – Construction & Engineering',
                    title: 'Core Infrastructure Execution',
                    initials: 'CE',
                    category: 'wing',
                    accentColor: '#0066cc',
                    bgAccent: 'bg-blue-100 dark:bg-blue-950/60',
                    textAccent: 'text-blue-700 dark:text-blue-300',
                    reports: [
                        {
                            id: 'ce-cod',
                            name: 'Construction Operation Directorate',
                            title: 'Civil Operations',
                            initials: 'COD',
                            category: 'directorate',
                            reports: [
                                { id: 'cod-1', name: 'Building Construction Department', title: 'Department', initials: 'BCD', category: 'division' },
                                { id: 'cod-2', name: 'Road Construction Division', title: 'Division', initials: 'RCD', category: 'division' },
                                { id: 'cod-3', name: 'Airport Construction Division', title: 'Division', initials: 'ACD', category: 'division' },
                                { id: 'cod-4', name: 'Railway Construction Division', title: 'Division', initials: 'RW', category: 'division' },
                                { id: 'cod-5', name: 'Smart City Projects Division', title: 'Division', initials: 'SCP', category: 'division' },
                                { id: 'cod-6', name: 'MEP Coordination Division', title: 'Division', initials: 'MEP', category: 'division' },
                                { id: 'cod-7', name: 'Project Closing Division', title: 'Division', initials: 'PCD', category: 'division' },
                            ],
                        },
                        {
                            id: 'ce-precast',
                            name: 'Precast Production Directorate',
                            title: 'Manufacturing & Plants',
                            initials: 'PPD',
                            category: 'directorate',
                            reports: [
                                { id: 'ppd-1', name: 'Production Planning', title: 'Division', initials: 'PP', category: 'division' },
                                { id: 'ppd-2', name: 'Precast Manufacturing', title: 'Division', initials: 'PM', category: 'division' },
                                { id: 'ppd-3', name: 'Quality Control', title: 'Division', initials: 'QC', category: 'division' },
                            ],
                        },
                        {
                            id: 'ce-tech',
                            name: 'Engineering Technical Services Directorate',
                            title: 'Technical Design & BIM',
                            initials: 'ETSD',
                            category: 'directorate',
                            reports: [
                                { id: 'ets-1', name: 'Design Department', title: 'Department', initials: 'DD', category: 'division' },
                                { id: 'ets-2', name: 'BIM Division', title: 'Division', initials: 'BIM', category: 'division' },
                                { id: 'ets-3', name: 'Contract Administration Department', title: 'Department', initials: 'CAD', category: 'division' },
                            ],
                        },
                        {
                            id: 'ce-comm',
                            name: 'Commercial & Contracts Directorate',
                            title: 'Commercial Governance',
                            badge: 'NEW',
                            initials: 'CCD',
                            category: 'directorate',
                            reports: [
                                { id: 'ccd-1', name: 'Commercial Management', title: 'Division', initials: 'CM', category: 'division' },
                                { id: 'ccd-2', name: 'Contract Management', title: 'Division', initials: 'KM', category: 'division' },
                                { id: 'ccd-3', name: 'Claims Management', title: 'Division', initials: 'CLM', category: 'division' },
                                { id: 'ccd-4', name: 'Subcontract Administration', title: 'Division', initials: 'SA', category: 'division' },
                                { id: 'ccd-5', name: 'Cost & Value Engineering', title: 'Division', initials: 'CVE', category: 'division' },
                            ],
                        },
                    ],
                },
                {
                    id: 'wing-pmo',
                    name: 'DCEO – Enterprise Project Management (PMO)',
                    title: 'Portfolio & Technical Audits',
                    initials: 'PMO',
                    category: 'wing',
                    accentColor: '#7c3aed',
                    bgAccent: 'bg-violet-100 dark:bg-violet-950/60',
                    textAccent: 'text-violet-700 dark:text-violet-300',
                    reports: [
                        {
                            id: 'pmo-exec',
                            name: 'PMO Executive Governance',
                            title: 'Executive Divisions',
                            initials: 'PMO',
                            category: 'directorate',
                            reports: [
                                { id: 'pmo-port', name: 'Portfolio Management Division', title: 'Division', initials: 'PMD', category: 'division' },
                                { id: 'pmo-dash', name: 'PMO Executive Dashboard Division', title: 'Division', initials: 'EDD', category: 'division' },
                            ],
                        },
                        {
                            id: 'pmo-plan',
                            name: 'Enterprise Planning & Monitoring Department',
                            title: 'Planning & Cost Control',
                            initials: 'EPM',
                            category: 'directorate',
                            reports: [
                                { id: 'epm-cost', name: 'Project Cost Control Division', title: 'Division', initials: 'PCC', category: 'division' },
                                { id: 'epm-plan', name: 'Planning Division', title: 'Division', initials: 'PLN', category: 'division' },
                                { id: 'epm-mon', name: 'Project Monitoring & Reporting Division', title: 'Division', initials: 'PMR', category: 'division' },
                            ],
                        },
                        {
                            id: 'pmo-audit',
                            name: 'Technical Audit Department',
                            title: 'Engineering & Performance Audits',
                            initials: 'TAD',
                            category: 'directorate',
                            reports: [
                                { id: 'tad-eng', name: 'Technical Engineering Audit Division', title: 'Division', initials: 'TEA', category: 'division' },
                                { id: 'tad-perf', name: 'Project Performance Audit Division', title: 'Division', initials: 'PPA', category: 'division' },
                                { id: 'tad-close', name: 'Project Closeout & Lessons Learned', title: 'Division', initials: 'PCL', category: 'division' },
                            ],
                        },
                    ],
                },
                {
                    id: 'wing-cfo',
                    name: 'Chief Finance Officer (CFO)',
                    title: 'Finance & Treasury Management',
                    initials: 'CFO',
                    category: 'wing',
                    accentColor: '#059669',
                    bgAccent: 'bg-emerald-100 dark:bg-emerald-950/60',
                    textAccent: 'text-emerald-700 dark:text-emerald-300',
                    reports: [
                        {
                            id: 'cfo-ftd',
                            name: 'Finance & Treasury Department',
                            title: 'Accounting & Treasury',
                            initials: 'FTD',
                            category: 'directorate',
                            reports: [
                                { id: 'fin-budget', name: 'Budget & Cost Control Division', title: 'Division', initials: 'BCC', category: 'division' },
                                { id: 'fin-treas', name: 'Treasury Division', title: 'Division', initials: 'TR', category: 'division' },
                                { id: 'fin-gen', name: 'General Accounts Division', title: 'Division', initials: 'GA', category: 'division' },
                                { id: 'fin-tax', name: 'Tax Division', title: 'Division', initials: 'TX', category: 'division' },
                                { id: 'fin-fpa', name: 'Financial Planning & Analysis Unit', title: 'Unit', initials: 'FPA', category: 'division' },
                                { id: 'fin-inv', name: 'Investor Relations Unit', title: 'Unit', initials: 'IR', category: 'division' },
                            ],
                        },
                    ],
                },
                {
                    id: 'wing-plant',
                    name: 'Chief Plant & Equipment Officer',
                    title: 'Heavy Fleet & Workshops',
                    initials: 'CPE',
                    category: 'wing',
                    accentColor: '#ea580c',
                    bgAccent: 'bg-orange-100 dark:bg-orange-950/60',
                    textAccent: 'text-orange-700 dark:text-orange-300',
                    reports: [
                        {
                            id: 'cpe-admin',
                            name: 'Equipment Administration Department',
                            title: 'Fleet & Rental Administration',
                            initials: 'EAD',
                            category: 'directorate',
                            reports: [
                                { id: 'eq-div', name: 'Equipment Administration Division', title: 'Division', initials: 'EAD', category: 'division' },
                                { id: 'eq-rent', name: 'Rental Division', title: 'Division', initials: 'RD', category: 'division' },
                                { id: 'eq-ins', name: 'Insurance Unit', title: 'Unit', initials: 'IU', category: 'division' },
                                { id: 'eq-fleet', name: 'Fleet Planning & Utilization Unit', title: 'Unit', initials: 'FP', category: 'division' },
                            ],
                        },
                        {
                            id: 'cpe-maint',
                            name: 'Equipment Maintenance Department',
                            title: 'Workshops & Repairs',
                            initials: 'EMD',
                            category: 'directorate',
                            reports: [
                                { id: 'em-div', name: 'Maintenance Division', title: 'Division', initials: 'MD', category: 'division' },
                                { id: 'em-work', name: 'Central Workshop Division', title: 'Division', initials: 'CW', category: 'division' },
                            ],
                        },
                        {
                            id: 'cpe-prod',
                            name: 'Production & Plant Administration Department',
                            title: 'Asphalt & Crusher Plants',
                            initials: 'PPD',
                            category: 'directorate',
                            reports: [
                                { id: 'ppa-prod', name: 'Production Division', title: 'Division', initials: 'PD', category: 'division' },
                                { id: 'ppa-plant', name: 'Plant Division', title: 'Division', initials: 'PLD', category: 'division' },
                            ],
                        },
                    ],
                },
                {
                    id: 'wing-corp',
                    name: 'DCEO – Corporate Services',
                    title: 'Talent, IT & Procurement',
                    initials: 'CS',
                    category: 'wing',
                    accentColor: '#0284c7',
                    bgAccent: 'bg-sky-100 dark:bg-sky-950/60',
                    textAccent: 'text-sky-700 dark:text-sky-300',
                    reports: [
                        {
                            id: 'cs-hc',
                            name: 'Human Capital Directorate',
                            title: 'HR & Talent Management',
                            initials: 'HCD',
                            category: 'directorate',
                            reports: [
                                { id: 'hc-lod', name: 'Learning & Org Development Dept', title: 'Department', initials: 'LOD', category: 'division' },
                                { id: 'hc-admin', name: 'HR Administration Department', title: 'Department', initials: 'HRA', category: 'division' },
                                { id: 'hc-ta', name: 'Talent Acquisition & Workforce Planning', title: 'Division', initials: 'TA', category: 'division' },
                            ],
                        },
                        {
                            id: 'cs-ict',
                            name: 'ICT Directorate',
                            title: 'Information & Digital Systems',
                            initials: 'ICT',
                            category: 'directorate',
                            reports: [
                                { id: 'ict-sys', name: 'System Development Division', title: 'Division', initials: 'SDD', category: 'division' },
                                { id: 'ict-sec', name: 'Cybersecurity Division', title: 'Division', initials: 'CSD', category: 'division' },
                                { id: 'ict-inf', name: 'Infrastructure Division', title: 'Division', initials: 'IND', category: 'division' },
                                { id: 'ict-sup', name: 'IT Support & Operations Division', title: 'Division', initials: 'ITD', category: 'division' },
                            ],
                        },
                        {
                            id: 'cs-proc',
                            name: 'Strategic Procurement & Supply Chain Directorate',
                            title: 'Global Supply & Logistics',
                            initials: 'SCD',
                            category: 'directorate',
                            reports: [
                                { id: 'sc-ana', name: 'Procurement Analytics', title: 'Unit', initials: 'PA', category: 'division' },
                                { id: 'sc-psc', name: 'Procurement & Supply Chain Dept', title: 'Department', initials: 'PSC', category: 'division' },
                                { id: 'sc-div', name: 'Procurement Division', title: 'Division', initials: 'PD', category: 'division' },
                                { id: 'sc-for', name: 'Foreign Procurement Division', title: 'Division', initials: 'FPD', category: 'division' },
                                { id: 'sc-cntr', name: 'Contract Procurement', title: 'Division', initials: 'CP', category: 'division' },
                                { id: 'sc-log', name: 'Supply Chain & Logistics Division', title: 'Division', initials: 'SCL', category: 'division' },
                                { id: 'sc-info', name: 'Procurement Information Unit', title: 'Unit', initials: 'PIU', category: 'division' },
                                { id: 'sc-vend', name: 'Strategic Sourcing & Vendor Management', title: 'Unit', initials: 'SSV', category: 'division' },
                            ],
                        },
                        {
                            id: 'cs-prop',
                            name: 'Property Administration Department',
                            title: 'Property & Logistics',
                            initials: 'PAD',
                            category: 'directorate',
                            reports: [
                                { id: 'pad-div', name: 'Property Administration Division', title: 'Division', initials: 'PAD', category: 'division' },
                                { id: 'pad-wh', name: 'Central Warehouse', title: 'Facility', initials: 'CW', category: 'division' },
                            ],
                        },
                        {
                            id: 'cs-ffam',
                            name: 'Facility & Fixed Asset Administration Department',
                            title: 'FFAM Department',
                            initials: 'FFAM',
                            category: 'directorate',
                            reports: [
                                { id: 'ffam-fix', name: 'Fixed Asset Administration', title: 'Division', initials: 'FAA', category: 'division' },
                                { id: 'ffam-fac', name: 'Facility Division', title: 'Division', initials: 'FD', category: 'division' },
                                { id: 'ffam-arch', name: 'Central Archive & Documentation', title: 'Division', initials: 'CAD', category: 'division' },
                            ],
                        },
                    ],
                },
                {
                    id: 'wing-future',
                    name: 'Future Growth BU',
                    title: 'New Ventures & Expansion',
                    badge: 'Optional',
                    initials: 'FG',
                    category: 'wing',
                    accentColor: '#8b5cf6',
                    bgAccent: 'bg-purple-100 dark:bg-purple-950/60',
                    textAccent: 'text-purple-700 dark:text-purple-300',
                    reports: [
                        { id: 'fg-mfg', name: 'Manufacturing Division', title: 'Division', initials: 'MFG', category: 'division' },
                        { id: 'fg-en', name: 'Energy & Infrastructure Division', title: 'Division', initials: 'EID', category: 'division' },
                        { id: 'fg-re', name: 'Real Estate Division', title: 'Division', initials: 'RED', category: 'division' },
                        { id: 'fg-ib', name: 'International Business Division', title: 'Division', initials: 'IBD', category: 'division' },
                        { id: 'fg-inv', name: 'Investment & Partnerships', title: 'Division', initials: 'IP', category: 'division' },
                        { id: 'fg-tech', name: 'Innovation & Technology Ventures', title: 'Division', initials: 'ITV', category: 'division' },
                    ],
                },
            ],
        },
    ],
};

// -------------------------------------------------------------
// EXECUTIVE DIRECT VIEW (CEO directly connected to 12 Wings)
// -------------------------------------------------------------
export const EXECUTIVE_DIRECT_TREE: OrgChartNode = {
    ...COMPLETE_ENTERPRISE_TREE,
    reports: [
        ...(COMPLETE_ENTERPRISE_TREE.reports?.[0]?.reports ?? []), // 6 Strategic
        ...(COMPLETE_ENTERPRISE_TREE.reports?.[1]?.reports ?? []), // 6 Operating
    ],
};
