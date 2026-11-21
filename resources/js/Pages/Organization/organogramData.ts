export interface OrgDivision {
    id: string;
    name: string;
    badge?: string;
}

export interface OrgDirectorate {
    id: string;
    name: string;
    badge?: string;
    divisions: OrgDivision[];
}

export interface OrgWingNode {
    id: string;
    title: string;
    subtitle: string;
    category: 'strategic' | 'operating';
    accentColor: string; // hex or tailwind
    lightBg: string;
    darkBg: string;
    borderColor: string;
    badgeColor: string;
    iconName: string;
    tag?: string;
    summary: string;
    directorates: OrgDirectorate[];
}

export interface OrgApexNode {
    id: string;
    title: string;
    subtitle: string;
    organization: string;
    office: {
        title: string;
        description: string;
    };
    motto: string;
}

export const ORGANOGRAM_APEX: OrgApexNode = {
    id: 'ceo',
    title: 'CHIEF EXECUTIVE OFFICER (CEO)',
    subtitle: 'Office of the CEO',
    organization: 'EL-HADAR Engineering PLC',
    office: {
        title: 'Office of the CEO',
        description: 'Executive Governance, Enterprise Strategy & Stakeholder Relations',
    },
    motto: 'Leadership, Precision Engineering & Sustainable Growth',
};

export const STRATEGIC_SUPPORT_WINGS: OrgWingNode[] = [
    {
        id: 'strategy-transformation',
        title: 'Chief Strategy & Transformation Officer',
        subtitle: 'Strategic & Transformation Functions',
        category: 'strategic',
        accentColor: '#0066cc',
        lightBg: 'bg-blue-50/60 dark:bg-blue-950/20',
        darkBg: 'dark:border-blue-500/30',
        borderColor: 'border-blue-200 dark:border-blue-800/40',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        iconName: 'Compass',
        summary: 'Enterprise Strategy, Digital Transformation & Innovation Center',
        directorates: [
            {
                id: 'strat-coe',
                name: 'Strategy & Transformation Center of Excellence',
                divisions: [],
            },
            {
                id: 'dto',
                name: 'Digital Transformation Office',
                divisions: [
                    { id: 'dto-erp', name: 'ERP Governance' },
                    { id: 'dto-ai', name: 'AI & Data Analytics' },
                    { id: 'dto-pmis', name: 'Digital PMIS' },
                ],
            },
            {
                id: 'inno',
                name: 'Innovation Office',
                divisions: [],
            },
        ],
    },
    {
        id: 'internal-audit',
        title: 'Internal Audit & Compliance Service',
        subtitle: 'Governance & Forensic Oversight',
        category: 'strategic',
        accentColor: '#059669',
        lightBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
        darkBg: 'dark:border-emerald-500/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800/40',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        iconName: 'ShieldCheck',
        summary: 'Forensic Audit, Internal Controls & Quality Assurance',
        directorates: [
            {
                id: 'audit-dir',
                name: 'Audit & Compliance Operations',
                divisions: [
                    { id: 'ia-1', name: 'Internal Audit' },
                    { id: 'ia-2', name: 'Compliance Management' },
                    { id: 'ia-3', name: 'Quality Assurance' },
                ],
            },
        ],
    },
    {
        id: 'enterprise-risk',
        title: 'Enterprise Risk Management Service',
        subtitle: 'Enterprise Resilience & Assurance',
        category: 'strategic',
        accentColor: '#d97706',
        lightBg: 'bg-amber-50/60 dark:bg-amber-950/20',
        darkBg: 'dark:border-amber-500/30',
        borderColor: 'border-amber-200 dark:border-amber-800/40',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        iconName: 'AlertTriangle',
        summary: 'Institutional Risk Mitigation, Insurance & Continuity',
        directorates: [
            {
                id: 'erm-dir',
                name: 'Risk & Insurance Directorate',
                divisions: [
                    { id: 'erm-1', name: 'Risk Management' },
                    { id: 'erm-2', name: 'Insurance Management' },
                    { id: 'erm-3', name: 'Claims Risk Management' },
                    { id: 'erm-4', name: 'Business Continuity' },
                ],
            },
        ],
    },
    {
        id: 'legal-affairs',
        title: 'Corporate Legal Affairs Service',
        subtitle: 'Legal Counsel & Regulatory Defense',
        category: 'strategic',
        accentColor: '#6366f1',
        lightBg: 'bg-indigo-50/60 dark:bg-indigo-950/20',
        darkBg: 'dark:border-indigo-500/30',
        borderColor: 'border-indigo-200 dark:border-indigo-800/40',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        iconName: 'Scale',
        summary: 'Contractual Integrity, Litigation & Statutory Defense',
        directorates: [
            {
                id: 'legal-dir',
                name: 'Legal Services Directorate',
                divisions: [
                    { id: 'leg-1', name: 'Legal Advisory' },
                    { id: 'leg-2', name: 'Contracts & Agreements' },
                    { id: 'leg-3', name: 'Litigation Management' },
                    { id: 'leg-4', name: 'Regulatory Affairs' },
                ],
            },
        ],
    },
    {
        id: 'marketing-bizdev',
        title: 'Marketing & Business Development Service',
        subtitle: 'Market Growth & Corporate Branding',
        category: 'strategic',
        accentColor: '#0284c7',
        lightBg: 'bg-sky-50/60 dark:bg-sky-950/20',
        darkBg: 'dark:border-sky-500/30',
        borderColor: 'border-sky-200 dark:border-sky-800/40',
        badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
        iconName: 'Megaphone',
        summary: 'Market Intelligence, Tendering & Brand Positioning',
        directorates: [
            {
                id: 'bizdev-dir',
                name: 'Business Development Directorate',
                divisions: [
                    { id: 'mbd-1', name: 'Market Intelligence' },
                    { id: 'mbd-2', name: 'Business Development' },
                    { id: 'mbd-3', name: 'Bid Management' },
                    { id: 'mbd-4', name: 'Corporate Branding' },
                ],
            },
        ],
    },
    {
        id: 'hse-dept',
        title: 'HSE Department',
        subtitle: 'Health, Safety & Environment',
        category: 'strategic',
        accentColor: '#10b981',
        lightBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
        darkBg: 'dark:border-emerald-500/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800/40',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        iconName: 'ShieldAlert',
        summary: 'Site Occupational Safety, Environmental Stewardship & ESG',
        directorates: [
            {
                id: 'hse-dir',
                name: 'HSE Directorate',
                divisions: [
                    { id: 'hse-1', name: 'Health Management' },
                    { id: 'hse-2', name: 'Safety Management' },
                    { id: 'hse-3', name: 'Environment Management' },
                    { id: 'hse-4', name: 'Sustainability & Compliance' },
                ],
            },
        ],
    },
];

export const OPERATING_OFFICERS_WINGS: OrgWingNode[] = [
    {
        id: 'dceo-construction',
        title: 'DCEO – Construction & Engineering',
        subtitle: 'Core Infrastructure Execution',
        category: 'operating',
        accentColor: '#0066cc',
        lightBg: 'bg-blue-50/60 dark:bg-blue-950/20',
        darkBg: 'dark:border-blue-500/30',
        borderColor: 'border-blue-200 dark:border-blue-800/40',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        iconName: 'HardHat',
        summary: 'Civil Works, Road, Airport, Railway & Engineering Services',
        directorates: [
            {
                id: 'const-ops',
                name: 'Construction Operation Directorate',
                divisions: [
                    { id: 'ce-1', name: 'Building Construction Department' },
                    { id: 'ce-2', name: 'Road Construction Division' },
                    { id: 'ce-3', name: 'Airport Construction Division' },
                    { id: 'ce-4', name: 'Railway Construction Division' },
                    { id: 'ce-5', name: 'Smart City Projects Division' },
                    { id: 'ce-6', name: 'MEP Coordination Division' },
                    { id: 'ce-7', name: 'Project Closing Division' },
                ],
            },
            {
                id: 'precast-dir',
                name: 'Precast Production Directorate',
                divisions: [
                    { id: 'pc-1', name: 'Production Planning' },
                    { id: 'pc-2', name: 'Precast Manufacturing' },
                    { id: 'pc-3', name: 'Quality Control' },
                ],
            },
            {
                id: 'eng-tech-dir',
                name: 'Engineering Technical Services Directorate',
                divisions: [
                    { id: 'et-1', name: 'Design Department' },
                    { id: 'et-2', name: 'BIM Division' },
                    { id: 'et-3', name: 'Contract Administration Department' },
                ],
            },
            {
                id: 'comm-contracts-dir',
                name: 'Commercial & Contracts Directorate',
                badge: 'NEW',
                divisions: [
                    { id: 'cc-1', name: 'Commercial Management' },
                    { id: 'cc-2', name: 'Contract Management' },
                    { id: 'cc-3', name: 'Claims Management' },
                    { id: 'cc-4', name: 'Subcontract Administration' },
                    { id: 'cc-5', name: 'Cost & Value Engineering' },
                ],
            },
        ],
    },
    {
        id: 'dceo-pmo',
        title: 'DCEO – Enterprise Project Management (PMO)',
        subtitle: 'Portfolio Controls & Technical Audits',
        category: 'operating',
        accentColor: '#7c3aed',
        lightBg: 'bg-violet-50/60 dark:bg-violet-950/20',
        darkBg: 'dark:border-violet-500/30',
        borderColor: 'border-violet-200 dark:border-violet-800/40',
        badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
        iconName: 'Briefcase',
        summary: 'Portfolio Oversight, Cost Engineering & Technical Governance',
        directorates: [
            {
                id: 'pmo-divisions',
                name: 'Executive PMO Divisions',
                divisions: [
                    { id: 'pmo-1', name: 'Portfolio Management Division' },
                    { id: 'pmo-2', name: 'PMO Executive Dashboard Division' },
                ],
            },
            {
                id: 'planning-dir',
                name: 'Enterprise Planning & Monitoring Department',
                divisions: [
                    { id: 'pm-1', name: 'Project Cost Control Division' },
                    { id: 'pm-2', name: 'Planning Division' },
                    { id: 'pm-3', name: 'Project Monitoring & Reporting Division' },
                ],
            },
            {
                id: 'tech-audit-dir',
                name: 'Technical Audit Department',
                divisions: [
                    { id: 'ta-1', name: 'Technical Engineering Audit Division' },
                    { id: 'ta-2', name: 'Project Performance Audit Division' },
                    { id: 'ta-3', name: 'Project Closeout Evaluation & Lessons Learned Division' },
                ],
            },
        ],
    },
    {
        id: 'cfo',
        title: 'Chief Finance Officer (CFO)',
        subtitle: 'Financial Strategy & Treasury',
        category: 'operating',
        accentColor: '#059669',
        lightBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
        darkBg: 'dark:border-emerald-500/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800/40',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        iconName: 'Banknote',
        summary: 'Corporate Accounting, Budget Control, Treasury & Tax',
        directorates: [
            {
                id: 'finance-treasury',
                name: 'Finance & Treasury Department',
                divisions: [
                    { id: 'fin-1', name: 'Budget & Cost Control Division' },
                    { id: 'fin-2', name: 'Treasury Division' },
                    { id: 'fin-3', name: 'General Accounts Division' },
                    { id: 'fin-4', name: 'Tax Division' },
                    { id: 'fin-5', name: 'Financial Planning & Analysis Unit' },
                    { id: 'fin-6', name: 'Investor Relations Unit' },
                ],
            },
        ],
    },
    {
        id: 'chief-plant-equipment',
        title: 'Chief Plant & Equipment Officer',
        subtitle: 'Fleet Operations & Heavy Machinery',
        category: 'operating',
        accentColor: '#ea580c',
        lightBg: 'bg-orange-50/60 dark:bg-orange-950/20',
        darkBg: 'dark:border-orange-500/30',
        borderColor: 'border-orange-200 dark:border-orange-800/40',
        badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        iconName: 'Wrench',
        summary: 'Machinery Fleet Administration, Maintenance Workshops & Asphalt/Crusher Plants',
        directorates: [
            {
                id: 'eq-admin-dept',
                name: 'Equipment Administration Department',
                divisions: [
                    { id: 'eq-1', name: 'Equipment Administration Division' },
                    { id: 'eq-2', name: 'Rental Division' },
                    { id: 'eq-3', name: 'Insurance Unit' },
                    { id: 'eq-4', name: 'Fleet Planning & Utilization Unit' },
                ],
            },
            {
                id: 'eq-maint-dept',
                name: 'Equipment Maintenance Department',
                divisions: [
                    { id: 'em-1', name: 'Maintenance Division' },
                    { id: 'em-2', name: 'Central Workshop Division' },
                ],
            },
            {
                id: 'plant-admin-dept',
                name: 'Production & Plant Administration Department',
                divisions: [
                    { id: 'pa-1', name: 'Production Division' },
                    { id: 'pa-2', name: 'Plant Division' },
                ],
            },
        ],
    },
    {
        id: 'dceo-corporate-services',
        title: 'DCEO – Corporate Services',
        subtitle: 'Human Capital, ICT & Supply Chain',
        category: 'operating',
        accentColor: '#0284c7',
        lightBg: 'bg-sky-50/60 dark:bg-sky-950/20',
        darkBg: 'dark:border-sky-500/30',
        borderColor: 'border-sky-200 dark:border-sky-800/40',
        badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
        iconName: 'Users',
        summary: 'Talent Management, Enterprise IT, Procurement & Fixed Assets (FFAM)',
        directorates: [
            {
                id: 'hc-dir',
                name: 'Human Capital Directorate',
                divisions: [
                    { id: 'hc-1', name: 'Learning & Organizational Development Department' },
                    { id: 'hc-2', name: 'HR Administration Department' },
                    { id: 'hc-3', name: 'Talent Acquisition & Workforce Planning' },
                ],
            },
            {
                id: 'ict-dir',
                name: 'ICT Directorate',
                divisions: [
                    { id: 'ict-1', name: 'System Development Division' },
                    { id: 'ict-2', name: 'Cybersecurity Division' },
                    { id: 'ict-3', name: 'Infrastructure Division' },
                    { id: 'ict-4', name: 'IT Support & Operations Division' },
                ],
            },
            {
                id: 'sc-dir',
                name: 'Strategic Procurement & Supply Chain Directorate',
                divisions: [
                    { id: 'sc-1', name: 'Procurement Analytics' },
                    { id: 'sc-2', name: 'Procurement & Supply Chain Department' },
                    { id: 'sc-3', name: 'Procurement Division' },
                    { id: 'sc-4', name: 'Foreign Procurement Division' },
                    { id: 'sc-5', name: 'Contract Procurement' },
                    { id: 'sc-6', name: 'Supply Chain & Logistics Division' },
                    { id: 'sc-7', name: 'Procurement Information Unit' },
                    { id: 'sc-8', name: 'Strategic Sourcing & Vendor Management' },
                ],
            },
            {
                id: 'prop-admin-dept',
                name: 'Property Administration Department',
                divisions: [
                    { id: 'prop-1', name: 'Property Administration Division' },
                    { id: 'prop-2', name: 'Central Warehouse' },
                ],
            },
            {
                id: 'ffam-dept',
                name: 'Facility & Fixed Asset Administration Department',
                divisions: [
                    { id: 'ffam-1', name: 'Fixed Asset Administration' },
                    { id: 'ffam-2', name: 'Facility Division' },
                    { id: 'ffam-3', name: 'Central Archive & Documentation' },
                ],
            },
        ],
    },
    {
        id: 'future-growth-bu',
        title: 'Future Growth BU',
        subtitle: 'New Business & Strategic Ventures',
        tag: 'Optional',
        category: 'operating',
        accentColor: '#8b5cf6',
        lightBg: 'bg-purple-50/60 dark:bg-purple-950/20',
        darkBg: 'dark:border-purple-500/30',
        borderColor: 'border-purple-200 dark:border-purple-800/40',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        iconName: 'Rocket',
        summary: 'Commercial Expansion, Real Estate, Energy & Global Partnerships',
        directorates: [
            {
                id: 'ventures-dir',
                name: 'Emerging Business Divisions',
                divisions: [
                    { id: 'fg-1', name: 'Manufacturing Division' },
                    { id: 'fg-2', name: 'Energy & Infrastructure Division' },
                    { id: 'fg-3', name: 'Real Estate Division' },
                    { id: 'fg-4', name: 'International Business Division' },
                    { id: 'fg-5', name: 'Investment & Partnerships' },
                    { id: 'fg-6', name: 'Innovation & Technology Ventures' },
                ],
            },
        ],
    },
];
