import { Topic, ConceptNode, Activity, LessonSession, GradeTask } from '../types';

export function getLanguageCode(langOrI18nLng?: string): 'en' | 'ta' | 'hi' {
  if (!langOrI18nLng) return 'en';
  const l = langOrI18nLng.toLowerCase();
  if (l.startsWith('ta') || l === 'tamil') return 'ta';
  if (l.startsWith('hi') || l === 'hindi') return 'hi';
  return 'en';
}

/**
 * Localizes class names like "Class 3" to "வகுப்பு 3" (ta) or "कक्षा 3" (hi)
 * while data keys remain in English internally.
 */
export function localizeGrade(grade: string, lang?: string): string {
  const code = getLanguageCode(lang);
  const match = grade.match(/\d+/);
  const num = match ? match[0] : '';

  if (code === 'ta') {
    return num ? `வகுப்பு ${num}` : grade;
  }
  if (code === 'hi') {
    return num ? `कक्षा ${num}` : grade;
  }
  return grade;
}

const TOPIC_TRANSLATIONS: Record<string, { ta: string; hi: string }> = {
  'Understanding Fractions': {
    ta: 'பின்னங்களைப் புரிந்துகொள்ளுதல் (அரை & கால்)',
    hi: 'भिन्न की समझ (आधा और चौथाई)'
  },
  'Multi-digit Addition': {
    ta: 'பல இலக்கக் கூட்டல் (இனமாற்றத்துடன்)',
    hi: 'बहु-अंकीय जोड़ (हासिल सहित)'
  },
  'Place Value (Tens & Hundreds)': {
    ta: 'இடமதிப்பு (பத்துகள் & நூறுகள்)',
    hi: 'स्थानीय मान (दहाई और सैकड़ा)'
  },
  'Fractions of a Group': {
    ta: 'ஒரு தொகுப்பின் பின்னங்கள் (பொருட்களின் பகிர்வு)',
    hi: 'समूह का भिन्न (वस्तुओं का बंटवारा)'
  },
  'Word Problems (1-Step)': {
    ta: 'சொல் கணக்குகள் (1-படி சந்தைக் கணக்குகள்)',
    hi: 'इबारती सवाल (1-चरणीय बाज़ार के सवाल)'
  },
  'Multiplication Basics (Arrays & Tables)': {
    ta: 'பெருக்கல் அடிப்படைகள் (அணிகள் & வாய்பாடுகள்)',
    hi: 'गुणा की मूल बातें (सरणी व पहाड़े)'
  },
  'Decimals & Fraction Conversion': {
    ta: 'தசமங்களும் பின்னம் மாற்றமும்',
    hi: 'दशमलव और भिन्न रूपांतरण'
  },
  'Multi-digit Multiplication': {
    ta: 'பல இலக்கப் பெருக்கல்',
    hi: 'बहु-अंकीय गुणा'
  },
  'Multi-step Word Problems': {
    ta: 'பல படி சொல் கணக்குகள்',
    hi: 'बहु-चरणीय इबारती सवाल'
  }
};

export function localizeTopicName(name: string, lang?: string): string {
  const code = getLanguageCode(lang);
  if (code === 'en') return name;

  const found = TOPIC_TRANSLATIONS[name];
  if (found) {
    return found[code];
  }
  return name;
}

const SESSION_TITLE_TRANSLATIONS: Record<string, { ta: string; hi: string }> = {
  'Shared Anchor: The Geometry of Equal Shares & Wholes': {
    ta: 'கூட்டுப் பாடம்: சம பங்கீடும் முழு உருவமும் (தாள் மடிப்பு)',
    hi: 'साझा पाठ: समान बंटवारे की ज्यामिति (कागज़ मोड़ना)'
  },
  'Differentiated Foundation Stations: Concrete Partitions': {
    ta: 'வகுப்பு நிலைக் கற்றல் மையங்கள்: கான்கிரீட் பகிர்வுப் பயிற்சி',
    hi: 'कक्षा-वार कार्य केंद्र: व्यावहारिक विभाजन अभ्यास'
  },
  'Cross-Grade Fraction Fold Verification Pairs': {
    ta: 'தோழர் வழிகாட்டல்: தாள் மடிப்பு சரிபார்ப்பு ஜோடிகள்',
    hi: 'सहपाठी शिक्षण: कागज़ मोड़ सत्यापन जोड़ियां'
  },
  'Shared Lesson: Decoding Marketplace Problem Scenarios': {
    ta: 'கூட்டுப் பாடம்: கிராமச் சந்தைக் கணக்குகளைப் புரிந்துகொள்ளுதல்',
    hi: 'साझा पाठ: ग्रामीण बाज़ार के सवालों को समझना'
  },
  'Village Market Simulation Stations': {
    ta: 'கற்றல் மையங்கள்: கிராமப்புறச் சந்தை மாதிரி நாடகம்',
    hi: 'कार्य केंद्र: ग्रामीण बाज़ार सिमुलेशन'
  },
  'Math Storytelling & Calculation Pairs': {
    ta: 'தோழர் வழிகாட்டல்: கணக்குக் கதை சொல்லும் ஜோடிகள்',
    hi: 'सहपाठी शिक्षण: गणितीय कहानी व गणना जोड़ियां'
  },
  'Shared Workshop: Groups, Arrays & Mathematical Relations': {
    ta: 'கூட்டுப் பட்டறை: தொகுதிகள், அணிகள் மற்றும் பெருக்கல் உறவுகள்',
    hi: 'साझा कार्यशाला: समूह, सारणियां और गुणा संबंध'
  },
  'Focused Remediation Stations: Array Modeling': {
    ta: 'கற்றல் மையங்கள்: மூடி மற்றும் கல் வரிசை மாதிரி பயிற்சி',
    hi: 'कार्य केंद्र: कंकड़ व ढक्कन सरणी मॉडलिंग'
  },
  'Courtyard Number Jump & Table Relay': {
    ta: 'தோழர் வழிகாட்டல்: முற்றம் எண் தாண்டுதல் விளையாட்டு',
    hi: 'सहपाठी शिक्षण: आंगन संख्या कूद व पहाड़ा रिले'
  },
  'Shared Anchor: Number Patterns & Place Value Systems': {
    ta: 'கூட்டுப் பாடம்: எண் அமைப்புகள் மற்றும் இடமதிப்புக் கட்டுதல்',
    hi: 'साझा पाठ: संख्या पैटर्न और स्थानीय मान बंडलिंग'
  },
  'Station Practice: Place Value Bundling & Carrying': {
    ta: 'கற்றல் மையங்கள்: குச்சிக் கட்டுகளும் இடமதிப்புப் பயிற்சியும்',
    hi: 'कार्य केंद्र: तीली बंडलिंग और हासिल अभ्यास'
  },
  'Peer Counting & Carry Challenge': {
    ta: 'தோழர் வழிகாட்டல்: சக மாணவர் கூட்டல் சவால்',
    hi: 'सहपाठी शिक्षण: सहपाठी गिनती व हासिल चुनौती'
  }
};

export function localizeSessionTitle(title: string, lang?: string): string {
  const code = getLanguageCode(lang);
  if (code === 'en') return title;

  const found = SESSION_TITLE_TRANSLATIONS[title];
  if (found) {
    return found[code];
  }
  return title;
}

export function localizeGradeTask(task: GradeTask, lang?: string): GradeTask {
  const code = getLanguageCode(lang);
  return {
    grade: localizeGrade(task.grade, lang),
    task: task.task // Content instructions remain readable or can be translated
  };
}

