import {
  LucideIcon,
} from "lucide-react";

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
      "Fingerprints form between weeks 5-21 of pregnancy—and never change.",
      "This tool uses dermatoglyphic science to translate patterns into accessible health insights.",
      "• Learn what your ridge patterns may suggest",
      "• Turn curiosity into preventive action",
    ],
    imagePath: "/landing-page/hero.png",
    bgGradient: "from-teal-50 to-cyan-50",
  },
  {
    id: "blood-group",
    title: "Know Your Blood Type. No Needles Required.",
    subtitle: "Non-invasive prediction tool based on dermatoglyphic science.",
    content: [
      "Research suggests correlations between fingerprint patterns and ABO blood types.",
      "This tool provides a fast, non-invasive prediction to support everyday decisions.",
      "• Improve emergency readiness",
      "• Check potential blood donation compatibility",
      "• Reduce uncertainty when it matters",
    ],
    imagePath: "/landing-page/blood-group.png",
    bgGradient: "from-red-50 to-rose-50",
  },
  {
    id: "diabetes",
    title: "Early Prediction Without the Prick.",
    subtitle: "Breaking the barrier of fear to fight the silent epidemic.",
    content: [
      "Many people avoid early screening because needles and clinics create friction.",
      "This tool offers a zero-needle, painless signal check based on ridge patterns.",
      "• Earlier awareness, less anxiety",
      "• A practical nudge toward prevention",
      "• Motivation to follow up with professionals",
    ],
    imagePath: "/landing-page/diab.png",
    bgGradient: "from-blue-50 to-indigo-50",
  },
  {
    id: "communities",
    title: "Health Screening Where You Are.",
    subtitle: "Built for communities, designed for mass accessibility.",
    content: [
      "We bring preventive screening out of the clinic and into everyday spaces.",
      "• Schools and universities",
      "• Community health centers",
      "• Malls and public facilities",
      "• Mobile outreach and donation drives",
    ],
    imagePath: "/landing-page/communities.png",
    bgGradient: "from-green-50 to-emerald-50",
  },
  {
    id: "technology",
    title: "Powered by Deep Learning. Secured by Design.",
    subtitle: "Advanced computer vision meets medical data ethics.",
    content: [
      "Built to be accurate, secure, and privacy-first from day one.",
      "• High-resolution capture for ridge clarity",
      "• Validated deep-learning models in the cloud",
      "• Encryption + anonymization by default",
      "• Ensemble predictions to reduce error",
    ],
    imagePath: "/landing-page/technology.png",
    bgGradient: "from-purple-50 to-violet-50",
  },
  {
    id: "ethics",
    title: "Empowering You, Not Diagnosing You.",
    subtitle: "A tool for awareness, education, and proactive living.",
    content: [
      "This tool is a predictive educational tool—not a medical diagnosis.",
      "It's designed to help you take the next right step.",
      "• Make lifestyle changes earlier",
      "• Seek professional consultation when needed",
      "• Donate blood safely and confidently",
    ],
    imagePath: "/landing-page/ethics.png",
    bgGradient: "from-yellow-50 to-amber-50",
  },
];
