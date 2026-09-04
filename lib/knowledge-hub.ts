export interface LearningStep { title: string; description: string; href: string }
export interface LearningPath { eyebrow: string; title: string; description: string; steps: LearningStep[] }
export interface MediaEntry {
  id: string;
  title: string;
  series: "Karkariya 101" | "Practice" | "Ask Karkariya" | "Teachings" | "Testimonies";
  topics: string[];
  transcriptStatus: "Awaiting review" | "Reviewed";
}

export const learningPaths: LearningPath[] = [
  {
    eyebrow: "For the newcomer",
    title: "Understand the path",
    description: "Begin with the meaning, lineage, and living method of the Tariqa.",
    steps: [
      { title: "What is the Tariqa?", description: "The path as a school of the heart.", href: "/articles/what-is-the-tariqa" },
      { title: "Origins and lineage", description: "Where the Karkariya path sits in the Shadhili chain.", href: "/history/tariqa-origins" },
      { title: "Meet the Shaykh", description: "The life and teaching of Shaykh Mohamed Faouzi al-Karkari.", href: "/history/shaykh-faouzi-al-karkari" },
    ],
  },
  {
    eyebrow: "The seven foundations",
    title: "Learn the method",
    description: "A guided circuit through the practices and symbols of the order.",
    steps: [
      { title: "The Wird", description: "The daily litany and its place in companionship.", href: "/foundations/wird" },
      { title: "The Muraqqaʿa", description: "The patched cloak and the colors of the Divine Names.", href: "/foundations/muraqqa" },
      { title: "The Singular Name", description: "Dhikr through the Name Allāh.", href: "/foundations/ism-al-mufrad" },
      { title: "Khalwa and Sirr", description: "Retreat, inwardness, and the innermost secret.", href: "/foundations/khalwa" },
    ],
  },
  {
    eyebrow: "Witness and study",
    title: "Go deeper",
    description: "Move from orientation into teachings, testimony, and sustained reading.",
    steps: [
      { title: "The Divine Light", description: "Scriptural evidence and the central teaching of Light.", href: "/books/guided-by-the-divine-light" },
      { title: "Read testimonies", description: "First-person accounts across languages and countries.", href: "/testimonies" },
      { title: "Explore the graph", description: "Follow connections between people, practices, and concepts.", href: "/graph" },
    ],
  },
];

/** Verified official English-channel seeds; transcripts remain unpublished until reviewed. */
export const officialMedia: MediaEntry[] = [
  { id: "j3-fuMPKnzw", title: "Introduction to the Karkariya Sufi Order — Karkariya 101", series: "Karkariya 101", topics: ["introduction", "tariqa"], transcriptStatus: "Awaiting review" },
  { id: "3ejLO_cqvSY", title: "How to join, what is the wird, and why the colorful cloak?", series: "Ask Karkariya", topics: ["baya", "wird", "muraqqa"], transcriptStatus: "Awaiting review" },
  { id: "RuNd9mUbo9o", title: "The wird of the Tariqa Karkariya step by step", series: "Practice", topics: ["wird", "practice"], transcriptStatus: "Awaiting review" },
  { id: "aK3qSjA-jZg", title: "The wird of the Tariqa Karkariya with Sidi Shaykh", series: "Practice", topics: ["wird", "shaykh"], transcriptStatus: "Awaiting review" },
  { id: "Mv9DRq_P98A", title: "Evidence of Divine Light in Islamic texts", series: "Teachings", topics: ["light", "quran", "hadith"], transcriptStatus: "Awaiting review" },
  { id: "-YE6z7yJKqA", title: "Biography of the Shaykh, distance bayʿa, and the muraqqaʿa", series: "Ask Karkariya", topics: ["shaykh", "baya", "muraqqa"], transcriptStatus: "Awaiting review" },
  { id: "oU2NlsW8_L8", title: "Accompanying a Sufi Master in the 21st century", series: "Karkariya 101", topics: ["companionship", "shaykh"], transcriptStatus: "Awaiting review" },
  { id: "6m_PFSz69D8", title: "A spiritual experience in the Karkariya — testimony of Rim", series: "Testimonies", topics: ["testimony", "light"], transcriptStatus: "Awaiting review" },
];
