// Types for NutriVita app

export type Language = "fr" | "ar" | "en"

export interface User {
  id: string
  name: string
  age: number
  height: number // cm
  weight: number // kg
  sex: "male" | "female" | "other"
  goal: "lose" | "maintain" | "gain" | "diabetes"
  activityLevel: 1 | 2 | 3 | 4 | 5
  targetCalories: number
  macros: {
    carbs: number // percentage
    protein: number // percentage
    fat: number // percentage
  }
  units: {
    weight: "kg" | "lbs"
    height: "cm" | "ft"
    glucose: "mg/dL" | "mmol/L"
    energy: "kcal" | "kJ"
  }
  language: Language
  darkMode: boolean
  streak: number
}

export interface FoodItem {
  id: string
  name: string
  nameAr?: string
  nameEn?: string
  emoji: string
  cuisine: string
  calories: number // per 100g
  protein: number // g per 100g
  carbs: number // g per 100g
  fat: number // g per 100g
  fiber?: number
  sugar?: number
  sodium?: number
  source: "nutrivita" | "ciqual" | "estimated"
  isFavorite?: boolean
}

export interface MealEntry {
  id: string
  foodId: string
  food: FoodItem
  amount: number // grams
  mealType: "breakfast" | "lunch" | "snack" | "dinner"
  date: string // YYYY-MM-DD
  createdAt: string
}

export interface DailyLog {
  date: string // YYYY-MM-DD
  meals: MealEntry[]
  weight?: number
  waterIntake: number // glasses
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export interface WeightEntry {
  date: string
  weight: number
  bodyFat?: number
  muscleMass?: number
}

export interface GlucoseReading {
  id: string
  value: number
  timestamp: string
  type: "fasting" | "pre-meal" | "post-meal" | "random" | "cgm"
  source: "manual" | "libreview"
}

export interface ActivityEntry {
  id: string
  type: string
  duration: number // minutes
  caloriesBurned: number
  date: string
  source: "manual" | "strava" | "voice"
  createdAt: string
}

export interface GlucoseStats {
  gmi: number // Glucose Management Indicator
  tir: number // Time in Range percentage
  cv: number // Coefficient of Variation
  average: number
  min: number
  max: number
  distribution: {
    veryLow: number // <54 mg/dL
    low: number // 54-70
    inRange: number // 70-180
    high: number // 180-250
    veryHigh: number // >250
  }
}

export interface Meal {
  type: "breakfast" | "lunch" | "snack" | "dinner"
  icon: string
  name: string
  nameFr: string
  nameAr: string
  nameEn: string
}

export const MEALS: Meal[] = [
  {
    type: "breakfast",
    icon: "🌅",
    name: "breakfast",
    nameFr: "Petit-déjeuner",
    nameAr: "الفطور",
    nameEn: "Breakfast",
  },
  {
    type: "lunch",
    icon: "☀️",
    name: "lunch",
    nameFr: "Déjeuner",
    nameAr: "الغداء",
    nameEn: "Lunch",
  },
  {
    type: "snack",
    icon: "🍎",
    name: "snack",
    nameFr: "Collation",
    nameAr: "وجبة خفيفة",
    nameEn: "Snack",
  },
  {
    type: "dinner",
    icon: "🌙",
    name: "dinner",
    nameFr: "Dîner",
    nameAr: "العشاء",
    nameEn: "Dinner",
  },
]

// Sample food database
export const SAMPLE_FOODS: FoodItem[] = [
  {
    id: "1",
    name: "Laban",
    nameAr: "لبن",
    nameEn: "Laban",
    emoji: "🥛",
    cuisine: "Maghreb",
    calories: 63,
    protein: 3.5,
    carbs: 4.8,
    fat: 3.2,
    source: "nutrivita",
  },
  {
    id: "2",
    name: "Pain complet",
    nameAr: "خبز كامل",
    nameEn: "Whole wheat bread",
    emoji: "🍞",
    cuisine: "Française",
    calories: 262,
    protein: 9,
    carbs: 49,
    fat: 3.4,
    source: "ciqual",
  },
  {
    id: "3",
    name: "Couscous royal",
    nameAr: "كسكس ملكي",
    nameEn: "Royal couscous",
    emoji: "🥘",
    cuisine: "Maghreb",
    calories: 178,
    protein: 12,
    carbs: 22,
    fat: 5,
    source: "nutrivita",
  },
  {
    id: "4",
    name: "Salade niçoise",
    nameAr: "سلطة نيسواز",
    nameEn: "Niçoise salad",
    emoji: "🥗",
    cuisine: "Française",
    calories: 285,
    protein: 18,
    carbs: 12,
    fat: 22,
    source: "ciqual",
  },
  {
    id: "5",
    name: "Tajine poulet",
    nameAr: "طاجين دجاج",
    nameEn: "Chicken tagine",
    emoji: "🍲",
    cuisine: "Maghreb",
    calories: 195,
    protein: 22,
    carbs: 8,
    fat: 9,
    source: "nutrivita",
  },
  {
    id: "6",
    name: "Croissant",
    nameAr: "كرواسون",
    nameEn: "Croissant",
    emoji: "🥐",
    cuisine: "Française",
    calories: 406,
    protein: 8,
    carbs: 45,
    fat: 21,
    source: "ciqual",
  },
  {
    id: "7",
    name: "Riz blanc",
    nameAr: "أرز أبيض",
    nameEn: "White rice",
    emoji: "🍚",
    cuisine: "International",
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    source: "ciqual",
  },
  {
    id: "8",
    name: "Huile d'olive",
    nameAr: "زيت الزيتون",
    nameEn: "Olive oil",
    emoji: "🫒",
    cuisine: "Méditerranée",
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    source: "ciqual",
  },
  {
    id: "9",
    name: "Poulet grillé",
    nameAr: "دجاج مشوي",
    nameEn: "Grilled chicken",
    emoji: "🍗",
    cuisine: "International",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    source: "ciqual",
  },
  {
    id: "10",
    name: "Omelette",
    nameAr: "أومليت",
    nameEn: "Omelette",
    emoji: "🍳",
    cuisine: "Française",
    calories: 154,
    protein: 11,
    carbs: 1,
    fat: 12,
    source: "ciqual",
  },
]

// Translations
export const translations = {
  fr: {
    // Navigation
    journal: "Journal",
    meals: "Repas",
    stats: "Bilan",
    glucose: "Glycémie",
    settings: "Réglages",

    // Journal
    greeting: "Bonjour",
    streak: "jours de suite",
    remaining: "restantes",
    over: "au-dessus",
    carbs: "Glucides",
    protein: "Protéines",
    fat: "Lipides",
    weight: "Poids",
    vsYesterday: "vs hier",

    // Quick actions
    voice: "Vocal",
    photo: "Photo",
    scanner: "Scanner",
    favorites: "Favoris",
    copyYesterday: "Copier hier",

    // Meals
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    snack: "Collation",
    dinner: "Dîner",
    addFood: "Ajouter",

    // Food search
    searchFood: "Rechercher un aliment...",
    search: "Recherche",
    recentlyAdded: "Récemment ajoutés",
    yourFavorites: "Vos favoris",
    addToMeal: "Ajouter au",
    portion: "Portion",
    customize: "Personnaliser",

    // Stats
    today: "Aujourd'hui",
    days7: "7 jours",
    days30: "30 jours",
    evolution: "Évolution",
    weekSummary: "Bilan semaine",
    average: "Moyenne",
    bestDay: "Meilleur jour",
    hardestDay: "Jour difficile",
    weightLost: "Poids perdu",
    muscleGained: "Muscle gagné",
    fatLost: "Graisse",
    bodyFat: "Body fat %",
    forbesEstimate: "Estimation Forbes",
    export: "Exporter",

    // Glucose
    glucoseTracking: "Suivi Glycémique",
    last14Days: "14 derniers jours",
    gmi: "GMI",
    estimatedHba1c: "HbA1c estimé",
    tir: "TIR",
    targetRange: "70-180 mg/dL",
    cv: "CV",
    stability: "Stabilité",
    stable: "Stable",
    mean: "Moyenne",
    veryLow: "Très basse",
    low: "Basse",
    target: "Cible",
    high: "Haute",
    veryHigh: "Très haute",
    addReading: "Ajouter",
    importCsv: "Importer LibreView",
    measurements: "mesures",

    // Settings
    profile: "Profil",
    edit: "Modifier",
    objective: "Objectif",
    recommended: "recommandés",
    units: "Unités de mesure",
    macroGoals: "Objectifs macros",
    appearance: "Apparence",
    darkMode: "Mode sombre",
    language: "Langue",
    data: "Données",
    databaseSize: "Taille base de données",
    lastSync: "Dernière sync Strava",
    clearJournal: "Effacer le journal",
    clearWeight: "Effacer les données poids",
    clearGlucose: "Effacer les données glycémie",
    exportData: "Exporter mes données (RGPD)",
    deleteAccount: "Supprimer mon compte",
    integrations: "Intégrations",
    connected: "Connecté",
    notConnected: "Non connecté",
    disconnect: "Déco.",
    notAvailable: "Non disponible",
    about: "À propos",
    privacyPolicy: "Politique de confidentialité",
    legalNotice: "Mentions légales",
    rateApp: "Évaluer l'app",

    // Goals
    loseWeight: "Perdre du poids",
    maintainWeight: "Maintenir mon poids",
    gainMuscle: "Prendre du muscle",
    manageDiabetes: "Gérer mon diabète",

    // Voice
    speakNow: "Parlez maintenant...",
    analyzing: "Analyse en cours...",
    detectedFoods: "Aliments détectés",
    cancel: "Annuler",
    add: "Ajouter",
    total: "Total",

    // Activity
    activity: "Activité",
    addActivity: "Ajouter une activité",
    duration: "Durée",
    caloriesBurned: "kcal brûlées",
    activityType: "Type d'activité",
    todayActivity: "Activité du jour",
    voiceActivity: "Activité vocale",
    speakActivity: "Dites par ex. : \"30 minutes de course\"",
    noActivity: "Aucune activité ajoutée",

    // Onboarding
    welcome: "Bienvenue sur NutriVita",
    tagline: "Votre compagnon nutrition intelligent",
    getStarted: "Commencer",
    tellUs: "Parlez-nous de vous",
    firstName: "Prénom",
    age: "Âge",
    years: "ans",
    sex: "Sexe",
    male: "Homme",
    female: "Femme",
    other: "Autre",
    height: "Taille",
    yourGoal: "Votre objectif",
    activityLevel: "Niveau d'activité",
    sedentary: "Sédentaire",
    lightlyActive: "Peu actif",
    moderatelyActive: "Modérément actif",
    veryActive: "Très actif",
    extraActive: "Extrêmement actif",
    ready: "C'est parti !",
    dailyGoal: "Objectif",
    perDay: "/jour",
    startJourney: "Commencer mon parcours",

    // Landing
    heroTitle: "Mangez mieux. Vivez mieux.",
    heroSubtitle: "L'app nutrition conçue pour la France et l'Algérie",
    startFree: "Commencer gratuitement",
    seeDemo: "Voir la démo",
    users: "utilisateurs",
    features: "Fonctionnalités",
    smartJournal: "Journal alimentaire intelligent",
    glucoseTracking2: "Suivi glycémique (diabète)",
    voiceInput: "Saisie vocale multilingue",
    bodyComposition: "Composition corporelle",
    multiLanguage: "FR / عربي / EN",
    privateRgpd: "100% privé, RGPD",
    readyToTransform: "Prêt à transformer votre alimentation ?",
    createFreeAccount: "Créer mon compte gratuit",
  },
  ar: {
    // Navigation
    journal: "اليومية",
    meals: "الوجبات",
    stats: "الإحصائيات",
    glucose: "السكر",
    settings: "الإعدادات",

    // Journal
    greeting: "مرحباً",
    streak: "أيام متتالية",
    remaining: "متبقية",
    over: "فوق الهدف",
    carbs: "كربوهيدرات",
    protein: "بروتين",
    fat: "دهون",
    weight: "الوزن",
    vsYesterday: "مقارنة بالأمس",

    // Quick actions
    voice: "صوتي",
    photo: "صورة",
    scanner: "ماسح",
    favorites: "المفضلة",
    copyYesterday: "نسخ الأمس",

    // Meals
    breakfast: "الفطور",
    lunch: "الغداء",
    snack: "وجبة خفيفة",
    dinner: "العشاء",
    addFood: "إضافة",

    // Food search
    searchFood: "ابحث عن طعام...",
    search: "بحث",
    recentlyAdded: "أضيف مؤخراً",
    yourFavorites: "مفضلاتك",
    addToMeal: "أضف إلى",
    portion: "الحصة",
    customize: "تخصيص",

    // Stats
    today: "اليوم",
    days7: "7 أيام",
    days30: "30 يوم",
    evolution: "التطور",
    weekSummary: "ملخص الأسبوع",
    average: "المتوسط",
    bestDay: "أفضل يوم",
    hardestDay: "أصعب يوم",
    weightLost: "الوزن المفقود",
    muscleGained: "العضلات المكتسبة",
    fatLost: "الدهون",
    bodyFat: "نسبة الدهون",
    forbesEstimate: "تقدير Forbes",
    export: "تصدير",

    // Glucose
    glucoseTracking: "تتبع السكر",
    last14Days: "آخر 14 يوم",
    gmi: "GMI",
    estimatedHba1c: "HbA1c المقدر",
    tir: "TIR",
    targetRange: "70-180 mg/dL",
    cv: "CV",
    stability: "الاستقرار",
    stable: "مستقر",
    mean: "المتوسط",
    veryLow: "منخفض جداً",
    low: "منخفض",
    target: "الهدف",
    high: "مرتفع",
    veryHigh: "مرتفع جداً",
    addReading: "إضافة",
    importCsv: "استيراد LibreView",
    measurements: "قياسات",

    // Settings
    profile: "الملف الشخصي",
    edit: "تعديل",
    objective: "الهدف",
    recommended: "موصى به",
    units: "وحدات القياس",
    macroGoals: "أهداف الماكرو",
    appearance: "المظهر",
    darkMode: "الوضع الداكن",
    language: "اللغة",
    data: "البيانات",
    databaseSize: "حجم قاعدة البيانات",
    lastSync: "آخر مزامنة Strava",
    clearJournal: "مسح اليومية",
    clearWeight: "مسح بيانات الوزن",
    clearGlucose: "مسح بيانات السكر",
    exportData: "تصدير بياناتي (RGPD)",
    deleteAccount: "حذف حسابي",
    integrations: "التكاملات",
    connected: "متصل",
    notConnected: "غير متصل",
    disconnect: "قطع",
    notAvailable: "غير متوفر",
    about: "حول",
    privacyPolicy: "سياسة الخصوصية",
    legalNotice: "إشعار قانوني",
    rateApp: "قيّم التطبيق",

    // Goals
    loseWeight: "إنقاص الوزن",
    maintainWeight: "الحفاظ على الوزن",
    gainMuscle: "بناء العضلات",
    manageDiabetes: "إدارة السكري",

    // Voice
    speakNow: "تحدث الآن...",
    analyzing: "جاري التحليل...",
    detectedFoods: "الأطعمة المكتشفة",
    cancel: "إلغاء",
    add: "إضافة",
    total: "المجموع",

    // Activity
    activity: "النشاط",
    addActivity: "إضافة نشاط",
    duration: "المدة",
    caloriesBurned: "سعرات محروقة",
    activityType: "نوع النشاط",
    todayActivity: "نشاط اليوم",
    voiceActivity: "نشاط صوتي",
    speakActivity: "قل مثلاً: \"30 دقيقة جري\"",
    noActivity: "لم يُضَف أي نشاط",

    // Onboarding
    welcome: "مرحباً بك في NutriVita",
    tagline: "رفيقك الذكي للتغذية",
    getStarted: "ابدأ",
    tellUs: "أخبرنا عن نفسك",
    firstName: "الاسم الأول",
    age: "العمر",
    years: "سنة",
    sex: "الجنس",
    male: "ذكر",
    female: "أنثى",
    other: "آخر",
    height: "الطول",
    yourGoal: "هدفك",
    activityLevel: "مستوى النشاط",
    sedentary: "خامل",
    lightlyActive: "نشاط خفيف",
    moderatelyActive: "نشاط معتدل",
    veryActive: "نشاط عالي",
    extraActive: "نشاط مكثف",
    ready: "هيا بنا!",
    dailyGoal: "الهدف",
    perDay: "/يوم",
    startJourney: "ابدأ رحلتي",

    // Landing
    heroTitle: "كُل أفضل. عِش أفضل.",
    heroSubtitle: "تطبيق التغذية المصمم لفرنسا والجزائر",
    startFree: "ابدأ مجاناً",
    seeDemo: "شاهد العرض",
    users: "مستخدم",
    features: "المميزات",
    smartJournal: "يومية غذائية ذكية",
    glucoseTracking2: "تتبع السكر (السكري)",
    voiceInput: "إدخال صوتي متعدد اللغات",
    bodyComposition: "تركيب الجسم",
    multiLanguage: "FR / عربي / EN",
    privateRgpd: "100% خاص، RGPD",
    readyToTransform: "مستعد لتحويل نظامك الغذائي؟",
    createFreeAccount: "أنشئ حسابك المجاني",
  },
  en: {
    // Navigation
    journal: "Journal",
    meals: "Meals",
    stats: "Stats",
    glucose: "Glucose",
    settings: "Settings",

    // Journal
    greeting: "Hello",
    streak: "day streak",
    remaining: "remaining",
    over: "over",
    carbs: "Carbs",
    protein: "Protein",
    fat: "Fat",
    weight: "Weight",
    vsYesterday: "vs yesterday",

    // Quick actions
    voice: "Voice",
    photo: "Photo",
    scanner: "Scanner",
    favorites: "Favorites",
    copyYesterday: "Copy yesterday",

    // Meals
    breakfast: "Breakfast",
    lunch: "Lunch",
    snack: "Snack",
    dinner: "Dinner",
    addFood: "Add",

    // Food search
    searchFood: "Search for food...",
    search: "Search",
    recentlyAdded: "Recently added",
    yourFavorites: "Your favorites",
    addToMeal: "Add to",
    portion: "Portion",
    customize: "Customize",

    // Stats
    today: "Today",
    days7: "7 days",
    days30: "30 days",
    evolution: "Evolution",
    weekSummary: "Week summary",
    average: "Average",
    bestDay: "Best day",
    hardestDay: "Hardest day",
    weightLost: "Weight lost",
    muscleGained: "Muscle gained",
    fatLost: "Fat",
    bodyFat: "Body fat %",
    forbesEstimate: "Forbes estimate",
    export: "Export",

    // Glucose
    glucoseTracking: "Glucose Tracking",
    last14Days: "Last 14 days",
    gmi: "GMI",
    estimatedHba1c: "Estimated HbA1c",
    tir: "TIR",
    targetRange: "70-180 mg/dL",
    cv: "CV",
    stability: "Stability",
    stable: "Stable",
    mean: "Mean",
    veryLow: "Very low",
    low: "Low",
    target: "Target",
    high: "High",
    veryHigh: "Very high",
    addReading: "Add",
    importCsv: "Import LibreView",
    measurements: "measurements",

    // Settings
    profile: "Profile",
    edit: "Edit",
    objective: "Objective",
    recommended: "recommended",
    units: "Units",
    macroGoals: "Macro goals",
    appearance: "Appearance",
    darkMode: "Dark mode",
    language: "Language",
    data: "Data",
    databaseSize: "Database size",
    lastSync: "Last Strava sync",
    clearJournal: "Clear journal",
    clearWeight: "Clear weight data",
    clearGlucose: "Clear glucose data",
    exportData: "Export my data (GDPR)",
    deleteAccount: "Delete my account",
    integrations: "Integrations",
    connected: "Connected",
    notConnected: "Not connected",
    disconnect: "Disconnect",
    notAvailable: "Not available",
    about: "About",
    privacyPolicy: "Privacy policy",
    legalNotice: "Legal notice",
    rateApp: "Rate app",

    // Goals
    loseWeight: "Lose weight",
    maintainWeight: "Maintain weight",
    gainMuscle: "Build muscle",
    manageDiabetes: "Manage diabetes",

    // Voice
    speakNow: "Speak now...",
    analyzing: "Analyzing...",
    detectedFoods: "Detected foods",
    cancel: "Cancel",
    add: "Add",
    total: "Total",

    // Activity
    activity: "Activity",
    addActivity: "Add activity",
    duration: "Duration",
    caloriesBurned: "kcal burned",
    activityType: "Activity type",
    todayActivity: "Today's activity",
    voiceActivity: "Voice activity",
    speakActivity: "Say e.g.: \"30 minutes running\"",
    noActivity: "No activity added",

    // Onboarding
    welcome: "Welcome to NutriVita",
    tagline: "Your smart nutrition companion",
    getStarted: "Get started",
    tellUs: "Tell us about yourself",
    firstName: "First name",
    age: "Age",
    years: "years",
    sex: "Sex",
    male: "Male",
    female: "Female",
    other: "Other",
    height: "Height",
    yourGoal: "Your goal",
    activityLevel: "Activity level",
    sedentary: "Sedentary",
    lightlyActive: "Lightly active",
    moderatelyActive: "Moderately active",
    veryActive: "Very active",
    extraActive: "Extra active",
    ready: "Let's go!",
    dailyGoal: "Goal",
    perDay: "/day",
    startJourney: "Start my journey",

    // Landing
    heroTitle: "Eat better. Live better.",
    heroSubtitle: "The nutrition app designed for France and Algeria",
    startFree: "Start for free",
    seeDemo: "See demo",
    users: "users",
    features: "Features",
    smartJournal: "Smart food journal",
    glucoseTracking2: "Glucose tracking (diabetes)",
    voiceInput: "Multilingual voice input",
    bodyComposition: "Body composition",
    multiLanguage: "FR / عربي / EN",
    privateRgpd: "100% private, GDPR",
    readyToTransform: "Ready to transform your diet?",
    createFreeAccount: "Create my free account",
  },
}

export type TranslationKey = keyof (typeof translations)["fr"]
