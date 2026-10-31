import { describe, it, expect } from 'vitest';
import en from '../../locales/en.json';
import ta from '../../locales/ta.json';
import hi from '../../locales/hi.json';
import {
  getLanguageCode,
  localizeGrade,
  localizeTopicName,
  localizeSessionTitle
} from '../../shared/contentLocalization';

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe('Phase 2: Multilingual Completeness & Parity Tests', () => {
  const enKeys = getAllKeys(en);
  const taKeys = getAllKeys(ta);
  const hiKeys = getAllKeys(hi);

  it('maintains 100% key parity across English, Tamil, and Hindi locales', () => {
    expect(enKeys.length).toBeGreaterThan(150);
    expect(taKeys.length).toBe(enKeys.length);
    expect(hiKeys.length).toBe(enKeys.length);

    const missingInTa = enKeys.filter(k => !taKeys.includes(k));
    const missingInHi = enKeys.filter(k => !hiKeys.includes(k));

    expect(missingInTa).toEqual([]);
    expect(missingInHi).toEqual([]);
  });

  it('correctly maps language codes and dialect identifiers', () => {
    expect(getLanguageCode('en')).toBe('en');
    expect(getLanguageCode('en-US')).toBe('en');
    expect(getLanguageCode('ta')).toBe('ta');
    expect(getLanguageCode('ta-IN')).toBe('ta');
    expect(getLanguageCode('Tamil')).toBe('ta');
    expect(getLanguageCode('hi')).toBe('hi');
    expect(getLanguageCode('hi-IN')).toBe('hi');
    expect(getLanguageCode('Hindi')).toBe('hi');
    expect(getLanguageCode(undefined)).toBe('en');
  });

  it('localizes class and grade names accurately across languages', () => {
    expect(localizeGrade('Class 3', 'en')).toBe('Class 3');
    expect(localizeGrade('Class 3', 'ta')).toBe('வகுப்பு 3');
    expect(localizeGrade('Class 3', 'hi')).toBe('कक्षा 3');

    expect(localizeGrade('Class 4', 'ta')).toBe('வகுப்பு 4');
    expect(localizeGrade('Class 4', 'hi')).toBe('कक्षा 4');

    expect(localizeGrade('Class 5', 'ta')).toBe('வகுப்பு 5');
    expect(localizeGrade('Class 5', 'hi')).toBe('कक्षा 5');
  });

  it('localizes foundational curriculum topic names for Tamil and Hindi', () => {
    const topic = 'Understanding Fractions';
    expect(localizeTopicName(topic, 'en')).toBe(topic);
    expect(localizeTopicName(topic, 'ta')).toContain('பின்ன');
    expect(localizeTopicName(topic, 'hi')).toContain('भिन्न');

    const wordProb = 'Word Problems (1-Step)';
    expect(localizeTopicName(wordProb, 'ta')).toContain('சொல் கணக்குகள்');
    expect(localizeTopicName(wordProb, 'hi')).toContain('इबारती सवाल');
  });

  it('localizes multi-grade session titles into natural vernacular phrasing', () => {
    const anchorTitle = 'Shared Anchor: The Geometry of Equal Shares & Wholes';
    expect(localizeSessionTitle(anchorTitle, 'en')).toBe(anchorTitle);
    expect(localizeSessionTitle(anchorTitle, 'ta')).toContain('கூட்டுப் பாடம்');
    expect(localizeSessionTitle(anchorTitle, 'hi')).toContain('साझा पाठ');

    const peerTitle = 'Cross-Grade Fraction Fold Verification Pairs';
    expect(localizeSessionTitle(peerTitle, 'ta')).toContain('தோழர் வழிகாட்டல்');
    expect(localizeSessionTitle(peerTitle, 'hi')).toContain('सहपाठी शिक्षण');
  });

  it('contains valid non-empty translation strings for critical UI paths in all 3 languages', () => {
    expect(en.dashboard.title).toBeTruthy();
    expect(ta.dashboard.title).toBeTruthy();
    expect(hi.dashboard.title).toBeTruthy();

    expect(en.students.title).toBeTruthy();
    expect(ta.students.title).toBeTruthy();
    expect(hi.students.title).toBeTruthy();

    expect(en.planner.title).toBeTruthy();
    expect(ta.planner.title).toBeTruthy();
    expect(hi.planner.title).toBeTruthy();

    expect(en.bridge.title).toBeTruthy();
    expect(ta.bridge.title).toBeTruthy();
    expect(hi.bridge.title).toBeTruthy();
  });
});
