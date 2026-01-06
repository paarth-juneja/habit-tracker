
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, where } from 'firebase/firestore';

export interface Skill {
    id: string;
    name: string;
    createdAt: number;
}

export interface WeeklySkillPlan {
    id: string; // Format: "YYYY-Www" e.g., "2023-W01"
    weekNumber: number;
    year: number;
    skillId?: string; // ID of the skill assigned to this week
    skillName?: string; // Snapshot of the name for easier display
    target?: string;
    satisfaction?: number; // 1-10
    note?: string;
}

// Collection references
const getSkillsBacklogRef = (userId: string) => doc(db, `users/${userId}/skills_data/backlog`);
const getWeeklyPlansCollectionRef = (userId: string) => collection(db, `users/${userId}/skills_data/weekly_plans/plans`);
const getWeeklyPlanDocRef = (userId: string, weekId: string) => doc(db, `users/${userId}/skills_data/weekly_plans/plans/${weekId}`);

// Backlog Operations
export const getSkillsBacklog = async (userId: string): Promise<Skill[]> => {
    const docRef = getSkillsBacklogRef(userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return (docSnap.data().skills || []) as Skill[];
    }
    return [];
};

export const addSkillToBacklog = async (userId: string, skillName: string): Promise<Skill> => {
    const newSkill: Skill = {
        id: crypto.randomUUID(),
        name: skillName,
        createdAt: Date.now()
    };
    const docRef = getSkillsBacklogRef(userId);
    await setDoc(docRef, { skills: arrayUnion(newSkill) }, { merge: true });
    return newSkill;
};

export const removeSkillFromBacklog = async (userId: string, skill: Skill): Promise<void> => {
    const docRef = getSkillsBacklogRef(userId);
    await updateDoc(docRef, { skills: arrayRemove(skill) });
};

// Weekly Plan Operations
export const getWeeklySkillPlans = async (userId: string, year: number): Promise<WeeklySkillPlan[]> => {
    const colRef = getWeeklyPlansCollectionRef(userId);
    const q = query(colRef, where('year', '==', year));
    const snapshot = await getDocs(q);

    const plans: WeeklySkillPlan[] = [];
    snapshot.forEach(doc => {
        plans.push(doc.data() as WeeklySkillPlan);
    });
    return plans;
};

export const saveWeeklySkillPlan = async (userId: string, plan: WeeklySkillPlan): Promise<void> => {
    const docRef = getWeeklyPlanDocRef(userId, plan.id);
    // Remove undefined fields
    const dataToSave = JSON.parse(JSON.stringify(plan));
    await setDoc(docRef, dataToSave, { merge: true });
};

export const assignSkillToWeek = async (userId: string, weekId: string, skill: Skill, year: number, weekNumber: number) => {
    const plan: WeeklySkillPlan = {
        id: weekId,
        year,
        weekNumber,
        skillId: skill.id,
        skillName: skill.name
    };
    await saveWeeklySkillPlan(userId, plan);
};
