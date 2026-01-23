export interface PreventiveAdvice {
  advice: string;
  source: string;
  details?: string;
}

export const preventiveHealthAdvice: PreventiveAdvice[] = [
  {
    advice:
      "Eat a balanced diet including fruits, vegetables, whole grains, lean protein; limit saturated fats, sugars, and salt.",
    source: "World Health Organization",
    details:
      "WHO recommends at least 400 g of fruits and vegetables per day; fat <30% of total calories, sugar <10%, salt <5 g/day.",
  },
  {
    advice:
      "Get regular physical activity — at least 150 minutes of moderate-intensity exercise per week, plus strength activities twice weekly.",
    source: "CDC",
    details:
      "Regular activity lowers the risk of heart disease, diabetes, and some cancers.",
  },
  {
    advice: "Avoid smoking, limit alcohol consumption, and maintain preventive checkups.",
    source: "CDC",
    details:
      "Quitting smoking, moderating alcohol, and staying updated with screenings greatly reduces chronic disease risk.",
  },
  {
    advice: "Stay up to date on recommended vaccinations and cancer screening tests.",
    source: "CDC",
    details:
      "Includes vaccines across the lifespan and screenings like breast, cervical, and colorectal cancer.",
  },
  {
    advice:
      "Understand your family health history and share it with your healthcare provider.",
    source: "CDC",
    details: "Helps identify early risks and guides prevention strategies.",
  },
  {
    advice: "Ensure adequate sleep — aim for 7 or more hours per night for adults.",
    source: "CDC",
    details:
      "Poor sleep increases risk of diabetes, heart disease, obesity, and depression.",
  },
];
