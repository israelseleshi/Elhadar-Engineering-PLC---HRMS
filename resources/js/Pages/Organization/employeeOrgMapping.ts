export interface OrgEmployee {
    id: number;
    name: string;
    position: string | null;
    department_id: number | null;
    department: string | null;
    workplace: string | null;
    status: string;
    photo_url: string | null;
}

export interface NodeLeader {
    name: string;
    position: string;
    photo_url: string | null;
    status: string;
    workplace: string | null;
}

export interface HierarchyMapping {
    wingLeaders: Record<string, NodeLeader>;
    dirLeaders: Record<string, NodeLeader>;
    divLeaders: Record<string, NodeLeader>;
    divisionEmployees: Record<string, OrgEmployee[]>;
    nodeStaffCounts: Record<string, number>;
}

/**
 * Extracts first and last name letters for the fallback circular avatar.
 * e.g., "Abay Sewmehon Demena" -> "AD", "Bethlehem Alemayehu" -> "BA"
 */
export function getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
}

const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #0066cc 0%, #3b82f6 100%)', // Action Blue
    'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', // Sky Blue
    'linear-gradient(135deg, #0d9488 0%, #10b981 100%)', // Teal Emerald
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo Purple
    'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', // Deep Blue
    'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', // Cyan
    'linear-gradient(135deg, #059669 0%, #14b8a6 100%)', // Emerald
    'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', // Violet
    'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', // Warm Amber
    'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)', // Crimson Rose
];

export function getAvatarGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[idx];
}

/**
 * Maps an employee to their corresponding wing, directorate, and division in the organogram.
 */
export function mapEmployeeToNode(emp: OrgEmployee): {
    wingId: string;
    dirId: string;
    divId: string;
    isWingLeader?: boolean;
    isDirLeader?: boolean;
    isDivLeader?: boolean;
} {
    const dept = emp.department || '';
    const pos = (emp.position || '').toLowerCase();
    const nameLower = emp.name.toLowerCase();

    // 1. Apex & CEO Office
    if (dept === 'CEO Office' || (pos.includes('ceo') && !pos.includes('dceo') && !pos.includes('chief'))) {
        if (pos.includes('ceo') || nameLower.includes('abel bizuayehu')) {
            return { wingId: 'ceo', dirId: 'ceo-office', divId: 'ceo-apex', isWingLeader: true };
        }
        return { wingId: 'ceo', dirId: 'ceo-office', divId: 'ceo-apex' };
    }

    // 2. Chief Strategy & Transformation Officer
    if (pos.includes('strategy') || pos.includes('transformation')) {
        return {
            wingId: 'strategy-transformation',
            dirId: 'strat-coe',
            divId: 'dto-erp',
            isWingLeader: pos.includes('chief') || nameLower.includes('tujuba'),
        };
    }

    // 3. Enterprise Risk Management Service (ERM)
    if (pos.includes('risk') || pos.includes('insurance')) {
        return {
            wingId: 'erm',
            dirId: 'erm-dir',
            divId: 'erm-1',
            isWingLeader: pos.includes('chief') || nameLower.includes('tesfalem'),
            isDirLeader: pos.includes('director') || pos.includes('chief'),
        };
    }

    // 4. HSE Department (SHED)
    if (dept === 'SHED' || pos.includes('nurse') || pos.includes('safety') || pos.includes('environment') || pos.includes('sanitary')) {
        const isHead = pos.includes('manager') || nameLower.includes('abebe milkessa');
        if (pos.includes('nurse')) {
            return { wingId: 'hse', dirId: 'hse-dir', divId: 'hse-1', isWingLeader: isHead, isDirLeader: isHead };
        } else if (pos.includes('environment') || pos.includes('sanitary')) {
            return { wingId: 'hse', dirId: 'hse-dir', divId: 'hse-3', isWingLeader: isHead, isDirLeader: isHead };
        } else {
            return { wingId: 'hse', dirId: 'hse-dir', divId: 'hse-2', isWingLeader: isHead, isDirLeader: isHead };
        }
    }

    // 5. Enterprise Project Management (PMO)
    if (dept === 'PMO Office' || pos.includes('pmo') || (pos.includes('audit') && !pos.includes('internal'))) {
        if (pos.includes('dceo') || nameLower.includes('seifu')) {
            return { wingId: 'dceo-pmo', dirId: 'pmo-divisions', divId: 'pmo-1', isWingLeader: true };
        } else if (pos.includes('technical audit') || nameLower.includes('biruk yemane')) {
            return { wingId: 'dceo-pmo', dirId: 'tech-audit-dir', divId: 'ta-1', isDirLeader: true };
        } else if (pos.includes('planning') || nameLower.includes('metasebia')) {
            return { wingId: 'dceo-pmo', dirId: 'planning-dir', divId: 'pm-2', isDirLeader: true };
        }
        return { wingId: 'dceo-pmo', dirId: 'pmo-divisions', divId: 'pmo-1' };
    }

    // 6. Chief Financial Officer (Finance Dept)
    if (dept === 'Finance Dept' || pos.includes('accountant') || pos.includes('casher') || pos.includes('finance') || pos.includes('budget')) {
        const isCFO = pos.includes('chief') || nameLower.includes('sahilu asrat');
        const isDeptMgr = (pos.includes('manager') && !pos.includes('project')) || nameLower.includes('tadele fekadu');

        if (isCFO) {
            return { wingId: 'cfo', dirId: 'finance-treasury', divId: 'fin-3', isWingLeader: true };
        }
        if (isDeptMgr) {
            return { wingId: 'cfo', dirId: 'finance-treasury', divId: 'fin-3', isDirLeader: true };
        }

        if (pos.includes('budget') || pos.includes('cost') || pos.includes('bujget')) {
            const isHead = pos.includes('head') || nameLower.includes('ayal teshome');
            return { wingId: 'cfo', dirId: 'finance-treasury', divId: 'fin-1', isDivLeader: isHead };
        } else if (pos.includes('casher') || pos.includes('treasury')) {
            return { wingId: 'cfo', dirId: 'finance-treasury', divId: 'fin-2' };
        } else {
            const isHead = pos.includes('head') || nameLower.includes('ruth assefa');
            return { wingId: 'cfo', dirId: 'finance-treasury', divId: 'fin-3', isDivLeader: isHead };
        }
    }

    // 7. Plant & Fleet Management (P&ED)
    if (
        dept === 'P&ED' ||
        pos.includes('dump truck') ||
        pos.includes('driver') ||
        pos.includes('operator') ||
        pos.includes('mechanic') ||
        pos.includes('batching') ||
        pos.includes('tire') ||
        pos.includes('electrician')
    ) {
        if (pos.includes('chief') || nameLower.includes('mesele hailu')) {
            return { wingId: 'chief-plant-equipment', dirId: 'eq-admin-dept', divId: 'eq-1', isWingLeader: true };
        }
        if (nameLower.includes('tenaw mekonnen')) {
            return { wingId: 'chief-plant-equipment', dirId: 'eq-admin-dept', divId: 'eq-1', isDirLeader: true };
        }
        if (nameLower.includes('tesera mamo')) {
            return { wingId: 'chief-plant-equipment', dirId: 'eq-maint-dept', divId: 'em-1', isDirLeader: true };
        }

        if (pos.includes('driver') || pos.includes('transport')) {
            return { wingId: 'chief-plant-equipment', dirId: 'eq-admin-dept', divId: 'eq-4' };
        } else if (pos.includes('operator') || pos.includes('batching')) {
            return { wingId: 'chief-plant-equipment', dirId: 'plant-admin-dept', divId: 'pa-1' };
        } else if (
            pos.includes('mechanic') ||
            pos.includes('electrician') ||
            pos.includes('tire') ||
            pos.includes('mantenance') ||
            pos.includes('maintenance')
        ) {
            const isHead = pos.includes('head') && !pos.includes('project');
            return { wingId: 'chief-plant-equipment', dirId: 'eq-maint-dept', divId: 'em-1', isDivLeader: isHead };
        } else {
            const isHead = pos.includes('head') && !pos.includes('project');
            return { wingId: 'chief-plant-equipment', dirId: 'eq-admin-dept', divId: 'eq-1', isDivLeader: isHead };
        }
    }

    // 8. Corporate Services: IT
    if (dept === 'IT' || pos.includes('it ') || pos.includes('software') || pos.includes('network') || pos.includes('cyber')) {
        const isHead = pos.includes('head') || nameLower.includes('natnael');
        return { wingId: 'dceo-corporate-services', dirId: 'ict-dir', divId: 'ict-4', isDivLeader: isHead };
    }

    // 9. Corporate Services: Procurement & Supply Chain (PSCD)
    if (dept === 'PSCD' || pos.includes('procure') || pos.includes('purchas')) {
        const isDeptMgr = pos.includes('manager') || nameLower.includes('huria abadir');
        if (isDeptMgr) {
            return { wingId: 'dceo-corporate-services', dirId: 'sc-dir', divId: 'sc-3', isDirLeader: true };
        }
        if (pos.includes('analyst') || nameLower.includes('daniel admas')) {
            return { wingId: 'dceo-corporate-services', dirId: 'sc-dir', divId: 'sc-1', isDivLeader: true };
        } else if (pos.includes('foreign')) {
            return { wingId: 'dceo-corporate-services', dirId: 'sc-dir', divId: 'sc-4' };
        } else if (pos.includes('logistic')) {
            return { wingId: 'dceo-corporate-services', dirId: 'sc-dir', divId: 'sc-6' };
        } else {
            const isHead = (pos.includes('head') && !pos.includes('project')) || nameLower.includes('amelework');
            return { wingId: 'dceo-corporate-services', dirId: 'sc-dir', divId: 'sc-3', isDivLeader: isHead };
        }
    }

    // 10. Corporate Services: Property Administration (PAD)
    if (dept === 'PAD' || pos.includes('store') || pos.includes('property') || pos.includes('fuel')) {
        const isDeptMgr = pos.includes('manager') || nameLower.includes('getachew abebe');
        if (isDeptMgr) {
            return { wingId: 'dceo-corporate-services', dirId: 'prop-admin-dept', divId: 'prop-1', isDirLeader: true };
        }
        if (pos.includes('warehouse') || pos.includes('store') || pos.includes('fuel')) {
            return { wingId: 'dceo-corporate-services', dirId: 'prop-admin-dept', divId: 'prop-2' };
        } else {
            const isHead = (pos.includes('head') && !pos.includes('project')) || nameLower.includes('dawit gidey');
            return { wingId: 'dceo-corporate-services', dirId: 'prop-admin-dept', divId: 'prop-1', isDivLeader: isHead };
        }
    }

    // 11. Corporate Services: Facility & Fixed Assets (FFAM)
    if (
        dept === 'FFAM' ||
        pos.includes('facility') ||
        pos.includes('fixed asset') ||
        pos.includes('janitor') ||
        pos.includes('attendant') ||
        pos.includes('archive') ||
        pos.includes('cook') ||
        pos.includes('guard')
    ) {
        const isDeptMgr = pos.includes('manager') || nameLower.includes('sisay lakew');
        if (isDeptMgr) {
            return { wingId: 'dceo-corporate-services', dirId: 'ffam-dept', divId: 'ffam-2', isDirLeader: true };
        }
        if (nameLower.includes('biruk worku')) {
            return { wingId: 'dceo-corporate-services', dirId: 'sc-dir', divId: 'sc-6', isDivLeader: true };
        }
        if (pos.includes('archive')) {
            return { wingId: 'dceo-corporate-services', dirId: 'ffam-dept', divId: 'ffam-3' };
        } else if (pos.includes('fixed asset')) {
            return { wingId: 'dceo-corporate-services', dirId: 'ffam-dept', divId: 'ffam-1' };
        } else {
            return { wingId: 'dceo-corporate-services', dirId: 'ffam-dept', divId: 'ffam-2' };
        }
    }

    // 12. Corporate Services: Human Capital (HC Directorate)
    if (dept === 'HC Directorate' || pos.includes('human') || pos.includes('hr') || pos.includes('time keeper') || pos.includes('reception')) {
        const isDirector = pos.includes('director') || nameLower.includes('theodros');
        if (isDirector) {
            return { wingId: 'dceo-corporate-services', dirId: 'hc-dir', divId: 'hc-3', isDirLeader: true };
        }
        const isDeptMgr = pos.includes('manager') || nameLower.includes('ayenew tariku');
        if (isDeptMgr) {
            return { wingId: 'dceo-corporate-services', dirId: 'hc-dir', divId: 'hc-1', isDivLeader: true };
        }
        if (pos.includes('learning') || pos.includes('development')) {
            return { wingId: 'dceo-corporate-services', dirId: 'hc-dir', divId: 'hc-1' };
        } else if (pos.includes('talent') || pos.includes('partner') || pos.includes('recruit')) {
            return { wingId: 'dceo-corporate-services', dirId: 'hc-dir', divId: 'hc-2' };
        } else {
            return { wingId: 'dceo-corporate-services', dirId: 'hc-dir', divId: 'hc-3' };
        }
    }

    // 13. Construction & Engineering
    if (
        dept === 'Construction & Engineering' ||
        pos.includes('engineer') ||
        pos.includes('architect') ||
        pos.includes('surveyor') ||
        pos.includes('forman') ||
        pos.includes('metal') ||
        pos.includes('aluminum') ||
        pos.includes('construction')
    ) {
        if (pos.includes('dceo') || nameLower.includes('bethlehem')) {
            return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-1', isWingLeader: true };
        }
        if (pos.includes('director') || nameLower.includes('tamrat tilahum')) {
            return { wingId: 'dceo-construction', dirId: 'eng-tech-dir', divId: 'et-1', isDirLeader: true };
        }
        if (nameLower.includes('melat ayele')) {
            return { wingId: 'dceo-construction', dirId: 'eng-tech-dir', divId: 'et-1', isDivLeader: true };
        }
        if (nameLower.includes('asteway bizuneh')) {
            return { wingId: 'dceo-construction', dirId: 'eng-tech-dir', divId: 'et-3', isDivLeader: true };
        }
        if (nameLower.includes('yodit ashenafi')) {
            return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-1', isDirLeader: true };
        }
        if (nameLower.includes('shegaw diress')) {
            return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-2', isDivLeader: true };
        }
        if (nameLower.includes('asnake t/tishon')) {
            return { wingId: 'dceo-construction', dirId: 'comm-contracts-dir', divId: 'cc-5', isDivLeader: true };
        }
        if (nameLower.includes('abdissa bekele')) {
            return { wingId: 'dceo-construction', dirId: 'precast-dir', divId: 'pc-2', isDivLeader: true };
        }

        if (pos.includes('design') || pos.includes('architect')) {
            return { wingId: 'dceo-construction', dirId: 'eng-tech-dir', divId: 'et-1' };
        } else if (pos.includes('contract')) {
            return { wingId: 'dceo-construction', dirId: 'eng-tech-dir', divId: 'et-3' };
        } else if (pos.includes('road')) {
            return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-2' };
        } else if (pos.includes('aluminum') || pos.includes('metal')) {
            return { wingId: 'dceo-construction', dirId: 'precast-dir', divId: 'pc-2' };
        } else if (pos.includes('payment') || pos.includes('value') || pos.includes('billing')) {
            return { wingId: 'dceo-construction', dirId: 'comm-contracts-dir', divId: 'cc-5' };
        } else if (pos.includes('closing')) {
            return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-7' };
        } else if (pos.includes('mep') || pos.includes('electro')) {
            return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-6' };
        } else {
            return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-1' };
        }
    }

    return { wingId: 'dceo-construction', dirId: 'const-ops', divId: 'ce-1' };
}

/**
 * Aggregates all employees into the organogram hierarchy structure.
 */
export function buildHierarchyMapping(employees: OrgEmployee[]): HierarchyMapping {
    const wingLeaders: Record<string, NodeLeader> = {};
    const dirLeaders: Record<string, NodeLeader> = {};
    const divLeaders: Record<string, NodeLeader> = {};
    const divisionEmployees: Record<string, OrgEmployee[]> = {};
    const nodeStaffCounts: Record<string, number> = {};

    employees.forEach((emp) => {
        const { wingId, dirId, divId, isWingLeader, isDirLeader, isDivLeader } = mapEmployeeToNode(emp);

        // Track counts
        nodeStaffCounts[wingId] = (nodeStaffCounts[wingId] || 0) + 1;
        nodeStaffCounts[dirId] = (nodeStaffCounts[dirId] || 0) + 1;
        nodeStaffCounts[divId] = (nodeStaffCounts[divId] || 0) + 1;

        // Group into division employee list
        if (!divisionEmployees[divId]) {
            divisionEmployees[divId] = [];
        }
        divisionEmployees[divId].push(emp);

        // Designate leaders
        const leaderData: NodeLeader = {
            name: emp.name,
            position: emp.position || '',
            photo_url: emp.photo_url,
            status: emp.status,
            workplace: emp.workplace,
        };

        if (isWingLeader && !wingLeaders[wingId]) {
            wingLeaders[wingId] = leaderData;
        }
        if (isDirLeader && !dirLeaders[dirId]) {
            dirLeaders[dirId] = leaderData;
        }
        if (isDivLeader && !divLeaders[divId]) {
            divLeaders[divId] = leaderData;
        }
    });

    return {
        wingLeaders,
        dirLeaders,
        divLeaders,
        divisionEmployees,
        nodeStaffCounts,
    };
}
