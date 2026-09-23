// Shared types and sample quiz data for Emby (BMS Edition)
// NOTE: Most mock data (courses, community, leaderboard, flashcards, etc.)
// has been removed. The app now fetches real data from backend APIs.
// Only types and the legacy quiz data (used by /quiz/[id]) remain here.

export type ReaderBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "figure"; src: string; caption: string }
  | { type: "list"; items: string[] }
  | {
      type: "callout";
      variant: "clinical" | "highyield" | "mnemonic";
      title: string;
      body: string;
    }
  | { type: "slide"; src: string; pageNumber: number };

// ---------------- Quizzes ----------------

export type MCQ = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
};

export const quizzes: Record<
  string,
  {
    id: string;
    title: string;
    topic: string;
    durationSec: number;
    questions: MCQ[];
  }
> = {
  "axilla-mcq": {
    id: "axilla-mcq",
    title: "Axilla & Brachial Plexus",
    topic: "Upper Limb Anatomy",
    durationSec: 300,
    questions: [
      {
        id: "q1",
        question:
          "A 52-year-old woman develops winging of the scapula after a radical mastectomy. Which nerve is most likely injured?",
        options: [
          "Long thoracic nerve",
          "Thoracodorsal nerve",
          "Axillary nerve",
          "Median nerve",
        ],
        correct: 0,
        explanation:
          "The long thoracic nerve (C5–C7) innervates serratus anterior. Injury causes winging of the scapula, classically seen after axillary surgery.",
        topic: "Brachial plexus",
      },
      {
        id: "q2",
        question: "Which structure forms the lateral wall of the axilla?",
        options: [
          "Pectoralis major",
          "Serratus anterior",
          "Intertubercular groove of humerus",
          "Latissimus dorsi",
        ],
        correct: 2,
        explanation:
          "The lateral wall of the axilla is the intertubercular (bicipital) groove of the humerus. The medial wall is formed by serratus anterior.",
        topic: "Axilla boundaries",
      },
      {
        id: "q3",
        question:
          "The cords of the brachial plexus are named based on their relationship to which structure?",
        options: [
          "The clavicle",
          "The axillary artery",
          "The first rib",
          "The pectoralis minor",
        ],
        correct: 1,
        explanation:
          "The lateral, medial, and posterior cords are named by their relationship to the axillary artery.",
        topic: "Brachial plexus",
      },
      {
        id: "q4",
        question:
          "A patient cannot abduct the arm beyond 15 degrees and has loss of sensation over the regimental badge area. Which nerve is affected?",
        options: ["Radial", "Axillary", "Musculocutaneous", "Suprascapular"],
        correct: 1,
        explanation:
          "Axillary nerve injury impairs deltoid (abduction 15–90°) and teres minor, with sensory loss over the lateral shoulder (regimental badge area).",
        topic: "Brachial plexus",
      },
      {
        id: "q5",
        question:
          "The apex of the axilla is bounded anteriorly by which structure?",
        options: [
          "The first rib",
          "The clavicle",
          "The superior border of the scapula",
          "The coracoid process",
        ],
        correct: 1,
        explanation:
          "The cervico-axillary canal (apex) is bounded by the clavicle anteriorly, first rib medially, and superior border of scapula posteriorly.",
        topic: "Axilla boundaries",
      },
    ],
  },
  "glycolysis-mcq": {
    id: "glycolysis-mcq",
    title: "Glycolysis: Enzymes & Regulation",
    topic: "Carbohydrate Metabolism",
    durationSec: 240,
    questions: [
      {
        id: "q1",
        question:
          "Which enzyme catalyses the rate-limiting step of glycolysis?",
        options: [
          "Hexokinase",
          "Phosphofructokinase-1",
          "Pyruvate kinase",
          "Aldolase",
        ],
        correct: 1,
        explanation:
          "PFK-1 is the rate-limiting enzyme. It is allosterically activated by AMP and F2,6-BP, and inhibited by ATP and citrate.",
        topic: "Glycolysis regulation",
      },
      {
        id: "q2",
        question: "The net ATP yield of glycolysis per glucose molecule is:",
        options: ["1", "2", "4", "6"],
        correct: 1,
        explanation:
          "Glycolysis generates 4 ATP but consumes 2, for a net of 2 ATP per glucose. It also yields 2 NADH.",
        topic: "Glycolysis energetics",
      },
      {
        id: "q3",
        question: "Red blood cells rely on glycolysis because they lack:",
        options: ["Ribosomes", "Mitochondria", "A plasma membrane", "Nuclei"],
        correct: 1,
        explanation:
          "RBCs lack mitochondria and rely entirely on anaerobic glycolysis for ATP; pyruvate is converted to lactate to regenerate NAD+.",
        topic: "Clinical correlations",
      },
    ],
  },
  "cardiac-mcq": {
    id: "cardiac-mcq",
    title: "Cardiac Cycle Essentials",
    topic: "Cardiovascular Physiology",
    durationSec: 240,
    questions: [
      {
        id: "q1",
        question: "The first heart sound (S1) is produced by closure of:",
        options: [
          "Aortic and pulmonary valves",
          "Mitral and tricuspid valves",
          "Mitral and aortic valves",
          "Tricuspid and pulmonary valves",
        ],
        correct: 1,
        explanation:
          "S1 is produced by closure of the AV valves (mitral and tricuspid) at the start of ventricular systole.",
        topic: "Heart sounds",
      },
      {
        id: "q2",
        question:
          "During isovolumetric contraction, which of the following is TRUE?",
        options: [
          "All four valves are open",
          "Ventricular volume changes",
          "All four valves are closed",
          "Aortic valve is open",
        ],
        correct: 2,
        explanation:
          "During isovolumetric contraction, all valves are closed. The ventricles contract without volume change until pressure exceeds aortic and pulmonary pressure.",
        topic: "Cardiac cycle phases",
      },
    ],
  },
};
