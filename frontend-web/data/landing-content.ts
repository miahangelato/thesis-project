import { LucideIcon, Fingerprint, Droplet, Heart, Building2, Settings, ShieldCheck } from "lucide-react";

export interface CarouselSlide {
    id: string;
    title: string;
    subtitle?: string;
    content: string[];
    icon?: LucideIcon;
    imagePath?: string;
    singleImageLayout?: boolean;
    bgGradient: string;
}

export const landingCarouselSlides: CarouselSlide[] = [
    {
        id: "hero",
        title: "Your Fingerprints Are More Than Just Identity. They Are Data.",
        subtitle: "Unlocking the health secrets hidden in your unique biometric code.",
        content: [
            "Formed between weeks 5–21 of pregnancy, your fingerprints never change.",
            "But did you know they hold clues to your genetics and health risks?",
            "Printalyzer bridges the gap between complex dermatology and AI,",
            "turning your unique patterns into actionable health insights via an accessible, smart kiosk."
        ],
        icon: Fingerprint,
        imagePath: "/SLIDE1 IMAGE.jpg",
        bgGradient: "from-teal-50 to-cyan-50"
    },
    {
        id: "blood-group",
        title: "Know Your Blood Type. No Needles Required.",
        subtitle: "Non-invasive prediction tool based on dermatoglyphic science.",
        content: [
            "Research shows distinct correlations between fingerprint patterns—specifically loops and whorls—and ABO blood types.",
            "We use this data to provide an instant, pain-free prediction to help you:",
            "• 🏥 Be Prepared: Improve your personal medical readiness.",
            "• 🩸 Verify Eligibility: Check your potential status for blood donation.",
            "• 🚑 Act Fast: Increase awareness for emergency situations."
        ],
        icon: Droplet,
        imagePath: "/SLIDE 2 IMAGE.png",
        singleImageLayout: true,
        bgGradient: "from-red-50 to-rose-50"
    },
    {
        id: "diabetes",
        title: "Early Prediction Without the Prick.",
        subtitle: "Breaking the barrier of fear to fight the silent epidemic.",
        content: [
            "Millions remain undiagnosed with diabetes simply because they fear the needle, the cost, or the hassle.",
            "Printalyzer changes the narrative by analyzing ridge counts and pattern density.",
            "Our system offers a zero-needle, painless assessment of potential risk.",
            "Knowledge → Action → Prevention. Don't wait for symptoms. See the signs early."
        ],
        icon: Heart,
        bgGradient: "from-blue-50 to-indigo-50"
    },
    {
        id: "communities",
        title: "Health Screening Where You Are.",
        subtitle: "Built for communities, designed for mass accessibility.",
        content: [
            "We are bringing preventative health out of the clinic and into your daily life.",
            "Look for Printalyzer kiosks in:",
            "• 🏫 Schools & Universities",
            "• 🏘️ Barangay Health Centers",
            "• 🛍️ Malls & Public Facilities",
            "• 🚑 Mobile Donation Drives"
        ],
        icon: Building2,
        bgGradient: "from-green-50 to-emerald-50"
    },
    {
        id: "technology",
        title: "Powered by Deep Learning. Secured by Design.",
        subtitle: "Advanced computer vision meets medical data ethics.",
        content: [
            "Under the Hood:",
            "• 👁️ High-Res Imaging: Captures microscopic ridge details.",
            "• 🧠 Cloud-Based CNN: Convolutional Neural Networks trained on validated samples.",
            "• 🔒 Military-Grade Privacy: Data is encrypted, anonymized, and never sold.",
            "• 📉 Layered Prediction: Multiple AI models vote to ensure the highest accuracy."
        ],
        icon: Settings,
        bgGradient: "from-purple-50 to-violet-50"
    },
    {
        id: "ethics",
        title: "Empowering You, Not Diagnosing You.",
        subtitle: "A tool for awareness, education, and proactive living.",
        content: [
            "Printalyzer is a predictive educational tool, not a replacement for a doctor.",
            "We provide the spark for you to take control.",
            "• ✅ Spark Lifestyle Changes",
            "• ✅ Seek Professional Consultation",
            "• ✅ Participate in Safe Blood Donation"
        ],
        icon: ShieldCheck,
        bgGradient: "from-yellow-50 to-amber-50"
    }
];
