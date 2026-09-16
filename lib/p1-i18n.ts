// P1 redesign — chaînes i18n isolées (fr/ar/en) pour les 4 nouveaux écrans.
// Volontairement séparé du gros lib/types.ts pour garder la branche P1 propre
// et facilement cherry-pickable, sans risque de régression sur les traductions
// existantes. Les écrans P1 lisent `language` via useApp() puis `P1[language]`.

import type { Language } from "@/lib/types"

export interface P1Strings {
  // communs
  today: string
  days7: string
  days30: string
  year: string
  perMonth: string
  // Accueil repensé
  insightOfDay: string
  seeCorrelation: string
  nextAction: string
  addMeal: string
  remaining: string
  ofTarget: string
  inTarget: string
  toComplete: string
  kcalBurned: string
  mealsOfDay: string
  sameTimeYesterday: string
  noInsightYet: string
  // Tendances
  trends: string
  adherenceMonth: string
  daysInTargetLabel: string
  macrosPerDay: string
  last7days: string
  legendEmpty: string
  legendPartial: string
  legendInTarget: string
  legendExceeded: string
  aboveGoal: string
  weightTrend: string
  movingAvg7: string
  notEnoughData: string
  scoreBuilding: string
  scoreBuildingHint: string
  daysLoggedShort: string
  // Glycémie × Repas
  glucoseMeals: string
  tir: string
  postprandialPeak: string
  dayOf: string
  eventsOfDay: string
  patternDetected: string
  medicalDisclaimer: string
  peak: string
  noGlucoseForCorrelation: string
  // Score Santé
  healthScore: string
  weekLabel: string
  outOf: string
  vsLastWeek: string
  calorieAdherence: string
  productQuality: string
  micronutrients: string
  macroBalance: string
  toGainPoints: string
  scoreEvolution: string
  weeksShort: string
  scoreGood: string
  scoreMid: string
  scoreLow: string
  // sous-onglets Bilan
  subReport: string
  subTrends: string
  subScore: string
  subGroceries: string
  // sous-onglets Glycémie
  subCorrelation: string
  subTracking: string
}

const fr: P1Strings = {
  today: "Aujourd'hui",
  days7: "7 j",
  days30: "30 j",
  year: "Année",
  perMonth: "/ mois",
  insightOfDay: "Insight du jour",
  seeCorrelation: "Voir la corrélation",
  nextAction: "Prochaine action",
  addMeal: "ajouter",
  remaining: "restantes",
  ofTarget: "sur",
  inTarget: "dans la cible",
  toComplete: "à compléter",
  kcalBurned: "kcal brûlées",
  mealsOfDay: "Repas du jour",
  sameTimeYesterday: "Hier à la même heure",
  noInsightYet: "Continue à saisir tes repas et ta glycémie : ton premier insight arrive bientôt.",
  trends: "Tendances",
  adherenceMonth: "Adhérence du mois",
  daysInTargetLabel: "jours",
  macrosPerDay: "Macros par jour",
  last7days: "7 derniers jours",
  legendEmpty: "vide",
  legendPartial: "partiel",
  legendInTarget: "dans la cible",
  legendExceeded: "dépassé",
  aboveGoal: "au-delà de l'objectif",
  weightTrend: "Poids — tendance lissée",
  movingAvg7: "moyenne mobile 7 j",
  notEnoughData: "Données insuffisantes pour cette période.",
  scoreBuilding: "Votre bilan se construit",
  scoreBuildingHint: "Renseignez un repas : votre score apparaîtra ici. Aucun score n'est calculé tant qu'il n'y a pas de donnée.",
  daysLoggedShort: "jours renseignés",
  glucoseMeals: "Glycémie × Repas",
  tir: "TIR",
  postprandialPeak: "Pic post-prandial",
  dayOf: "Journée du",
  eventsOfDay: "Événements de la journée",
  patternDetected: "Pattern détecté",
  medicalDisclaimer: "Indicateur de tendance — ne remplace pas un avis médical.",
  peak: "pic",
  noGlucoseForCorrelation: "Ajoute des mesures de glycémie et des repas pour voir la corrélation.",
  healthScore: "Score Santé",
  weekLabel: "Semaine",
  outOf: "/ 100",
  vsLastWeek: "vs sem. préc.",
  calorieAdherence: "Adhérence calorique",
  productQuality: "Qualité produits",
  micronutrients: "Micronutriments (vs VNR)",
  macroBalance: "Équilibre macros",
  toGainPoints: "Pour gagner des points la semaine prochaine",
  scoreEvolution: "Évolution du score",
  weeksShort: "semaines",
  scoreGood: "Bonne semaine — continue comme ça 🎉",
  scoreMid: "Semaine correcte — quelques marges de progrès.",
  scoreLow: "Semaine difficile — un petit pas suffit pour repartir.",
  subReport: "Bilan",
  subTrends: "Tendances",
  subScore: "Score",
  subGroceries: "Courses",
  subCorrelation: "× Repas",
  subTracking: "Suivi",
}

const ar: P1Strings = {
  today: "اليوم",
  days7: "٧ أيام",
  days30: "٣٠ يومًا",
  year: "السنة",
  perMonth: "/ شهر",
  insightOfDay: "نصيحة اليوم",
  seeCorrelation: "عرض الارتباط",
  nextAction: "الإجراء التالي",
  addMeal: "إضافة",
  remaining: "متبقية",
  ofTarget: "من",
  inTarget: "ضمن الهدف",
  toComplete: "بحاجة لإكمال",
  kcalBurned: "سعرات محروقة",
  mealsOfDay: "وجبات اليوم",
  sameTimeYesterday: "بالأمس في نفس الوقت",
  noInsightYet: "واصل تسجيل وجباتك وسكر الدم: ستصلك أول نصيحة قريبًا.",
  trends: "الاتجاهات",
  adherenceMonth: "التزام الشهر",
  daysInTargetLabel: "أيام",
  macrosPerDay: "المغذيات الكبرى يوميًا",
  last7days: "آخر ٧ أيام",
  legendEmpty: "فارغ",
  legendPartial: "جزئي",
  legendInTarget: "ضمن الهدف",
  legendExceeded: "تجاوز",
  aboveGoal: "فوق الهدف",
  weightTrend: "الوزن — اتجاه ممهّد",
  movingAvg7: "متوسط متحرك ٧ أيام",
  notEnoughData: "بيانات غير كافية لهذه الفترة.",
  scoreBuilding: "\u062a\u0642\u0631\u064a\u0631\u0643 \u0642\u064a\u062f \u0627\u0644\u0625\u0646\u0634\u0627\u0621",
  scoreBuildingHint: "\u0633\u062c\u0651\u0644 \u0648\u062c\u0628\u0629 \u0648\u0633\u064a\u0638\u0647\u0631 \u0645\u0624\u0634\u0631\u0643 \u0647\u0646\u0627. \u0644\u0627 \u064a\u064f\u062d\u062a\u0633\u0628 \u0623\u064a \u0645\u0624\u0634\u0631 \u062f\u0648\u0646 \u0628\u064a\u0627\u0646\u0627\u062a.",
  daysLoggedShort: "\u0623\u064a\u0627\u0645 \u0645\u0633\u062c\u0651\u0644\u0629",
  glucoseMeals: "سكر الدم × الوجبات",
  tir: "الوقت ضمن النطاق",
  postprandialPeak: "ذروة بعد الأكل",
  dayOf: "يوم",
  eventsOfDay: "أحداث اليوم",
  patternDetected: "نمط مكتشف",
  medicalDisclaimer: "مؤشر اتجاه — لا يغني عن استشارة طبية.",
  peak: "ذروة",
  noGlucoseForCorrelation: "أضف قياسات سكر الدم ووجبات لرؤية الارتباط.",
  healthScore: "مؤشر الصحة",
  weekLabel: "الأسبوع",
  outOf: "/ ١٠٠",
  vsLastWeek: "مقارنة بالأسبوع السابق",
  calorieAdherence: "الالتزام بالسعرات",
  productQuality: "جودة المنتجات",
  micronutrients: "المغذيات الدقيقة (مقابل المرجع)",
  macroBalance: "توازن المغذيات الكبرى",
  toGainPoints: "لكسب نقاط الأسبوع القادم",
  scoreEvolution: "تطور المؤشر",
  weeksShort: "أسابيع",
  scoreGood: "أسبوع جيد — تابع هكذا 🎉",
  scoreMid: "أسبوع مقبول — هناك مجال للتحسن.",
  scoreLow: "أسبوع صعب — خطوة صغيرة تكفي للعودة.",
  subReport: "الحصيلة",
  subTrends: "الاتجاهات",
  subScore: "المؤشر",
  subGroceries: "المشتريات",
  subCorrelation: "× الوجبات",
  subTracking: "المتابعة",
}

const en: P1Strings = {
  today: "Today",
  days7: "7 d",
  days30: "30 d",
  year: "Year",
  perMonth: "/ month",
  insightOfDay: "Insight of the day",
  seeCorrelation: "See correlation",
  nextAction: "Next action",
  addMeal: "add",
  remaining: "remaining",
  ofTarget: "of",
  inTarget: "in target",
  toComplete: "to complete",
  kcalBurned: "kcal burned",
  mealsOfDay: "Today's meals",
  sameTimeYesterday: "Yesterday at the same time",
  noInsightYet: "Keep logging meals and glucose: your first insight is coming soon.",
  trends: "Trends",
  adherenceMonth: "Month adherence",
  daysInTargetLabel: "days",
  macrosPerDay: "Macros per day",
  last7days: "Last 7 days",
  legendEmpty: "empty",
  legendPartial: "partial",
  legendInTarget: "in target",
  legendExceeded: "exceeded",
  aboveGoal: "above goal",
  weightTrend: "Weight — smoothed trend",
  movingAvg7: "7-day moving average",
  notEnoughData: "Not enough data for this period.",
  scoreBuilding: "Your report is building up",
  scoreBuildingHint: "Log a meal and your score will appear here. No score is computed while there is no data.",
  daysLoggedShort: "days logged",
  glucoseMeals: "Glucose × Meals",
  tir: "TIR",
  postprandialPeak: "Post-meal peak",
  dayOf: "Day of",
  eventsOfDay: "Events of the day",
  patternDetected: "Pattern detected",
  medicalDisclaimer: "Trend indicator — not a substitute for medical advice.",
  peak: "peak",
  noGlucoseForCorrelation: "Add glucose readings and meals to see the correlation.",
  healthScore: "Health Score",
  weekLabel: "Week",
  outOf: "/ 100",
  vsLastWeek: "vs last week",
  calorieAdherence: "Calorie adherence",
  productQuality: "Product quality",
  micronutrients: "Micronutrients (vs RNI)",
  macroBalance: "Macro balance",
  toGainPoints: "To gain points next week",
  scoreEvolution: "Score evolution",
  weeksShort: "weeks",
  scoreGood: "Good week — keep it up 🎉",
  scoreMid: "Decent week — some room to improve.",
  scoreLow: "Tough week — a small step is enough to bounce back.",
  subReport: "Report",
  subTrends: "Trends",
  subScore: "Score",
  subGroceries: "Groceries",
  subCorrelation: "× Meals",
  subTracking: "Tracking",
}

export const P1: Record<Language, P1Strings> = { fr, ar, en }
