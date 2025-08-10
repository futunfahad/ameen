// utils/arabicDateNormalizer.js
/**
 * Arabic Date and Time Normalizer
 *
 * This utility converts Arabic date and time expressions (both formal and slang)
 * into standardized formats: YYYY-MM-DD for dates and HH:MM (24h) for times.
 *
 * Features:
 * - Hijri calendar dates with flexible month name variants
 * - Gregorian calendar dates with Arabic month names
 * - Relative date expressions (tomorrow, next week, etc.)
 * - Gulf/Khaligi Arabic slang support
 * - Textual and numeric time expressions
 * - Weekday references
 * - Arabic numeral conversion
 * - Diacritics and formatting normalization
 */

import { toGregorian, toHijri } from "hijri-converter";
import { format, addDays } from "date-fns";

/* === Weekday Mapping === */
// Maps Arabic weekday names to JavaScript day indices (0=Sunday, 6=Saturday)
const WD = {
  السبت: 6,
  الأحد: 0,
  الاحد: 0,
  الاثنين: 1,
  الأثنين: 1,
  الثلاثاء: 2,
  الثلثاء: 2,
  الأربعاء: 3,
  الاربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
};

/* === Hijri Month Pattern === */
// Flexible regex pattern for Hijri months that accepts various spellings and formats
const HIJRI_MONTH_PATTERN = [
  "محرم",
  "صفر",
  "ربيع\\s*(?:الأول|الاول|١)",
  "ربيع\\s*(?:الآخر|الاخر|الثاني|٢)",
  "جمادى\\s*(?:الأولى|الاولى|١)",
  "جمادى\\s*(?:الآخرة|الاخرة|٢)",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذ[ويى]\\s*القعد(?:ة|ه|ى)", // flexible endings for ذو القعدة
  "ذ[ويى]\\s*الحج(?:ة|ه|ى)", // flexible endings for ذو الحجة
].join("|");

/* === Gregorian Month Mapping === */
// Maps Arabic month names to month numbers (1-12)
const GM = {
  يناير: 1,
  فبراير: 2,
  مارس: 3,
  ابريل: 4,
  إبريل: 4,
  مايو: 5,
  يونيو: 6,
  يوليو: 7,
  أغسطس: 8,
  اغسطس: 8,
  سبتمبر: 9,
  اكتوبر: 10,
  أكتوبر: 10,
  نوفمبر: 11,
  ديسمبر: 12,
};

/* === Arabic to ASCII Numeral Conversion === */
// Maps Arabic-Indic digits to ASCII digits
const AR_NUM = {
  "٠": 0,
  "١": 1,
  "٢": 2,
  "٣": 3,
  "٤": 4,
  "٥": 5,
  "٦": 6,
  "٧": 7,
  "٨": 8,
  "٩": 9,
};

/**
 * Converts Arabic-Indic digits to ASCII digits
 * @param {string} s - String containing Arabic digits
 * @returns {string} String with ASCII digits
 */
const arDigits = (s) => s.replace(/[٠-٩]/g, (d) => AR_NUM[d]);

/**
 * Removes Arabic diacritics, kashida, and normalizes whitespace
 * @param {string} s - String to normalize
 * @returns {string} Cleaned string
 */
const stripHarakat = (s) =>
  s
    .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u0653-\u065F]/g, "") // Remove harakat/diacritics
    .replace(/\u0640/g, "") // Remove tatweel (kashida)
    .replace(/\u00A0/g, " ") // Replace non-breaking spaces with regular spaces
    .replace(/\s+/g, " "); // Collapse multiple spaces

/* === Textual Hour Mapping === */
// Maps Arabic textual hours to numeric values (1-12)
const TEXT_HOURS = {
  الأولى: 1,
  الاولى: 1,
  الثانية: 2,
  الثالثة: 3,
  الرابعة: 4,
  الخامسة: 5,
  السادسة: 6,
  السابعة: 7,
  الثامنة: 8,
  التاسعة: 9,
  العاشرة: 10,
  "الحادية عشر": 11,
  "الحادية عشرة": 11,
  "الثانية عشر": 12,
  "الثانية عشرة": 12,
};

/**
 * Converts 12-hour time to 24-hour format with smart AM/PM detection
 * @param {number} h - Hour (1-12)
 * @param {number} m - Minute (0-59)
 * @param {string} hints - Context hints for AM/PM determination
 * @returns {string} Time in HH:MM 24-hour format
 */
function smartTime(h, m, hints) {
  const txt = hints || "";
  // Explicit PM indicators
  if (/(مساء|عصر|بعد الظهر|ليل)/i.test(txt) && h < 12) h += 12;
  // Default PM window for hours 1-5 without explicit AM indicators
  else if (!/(صباح|ص|AM)/i.test(txt) && h >= 1 && h <= 5) h += 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Calculates the next occurrence of a specific weekday
 * @param {string} name - Arabic weekday name
 * @param {Date} base - Base date for calculation
 * @returns {string|null} Next weekday in YYYY-MM-DD format or null if invalid
 */
function nextWeekday(name, base) {
  const idx = WD[name.trim().replace(/^يوم\s*/, "")];
  if (idx == null) return null;
  const diff = (idx - base.getDay() + 7) % 7 || 7;
  return format(addDays(base, diff), "yyyy-MM-dd");
}

/**
 * Converts Hijri date to Gregorian date
 * @param {number} day - Hijri day
 * @param {string} monthName - Hijri month name in Arabic
 * @param {number|null} year - Hijri year (optional, uses current if null)
 * @param {Date} base - Base date for current year calculation
 * @returns {string|null} Gregorian date in YYYY-MM-DD format or null if invalid
 */
function hijriToGreg(day, monthName, year, base) {
  const nowH = toHijri(
    base.getFullYear(),
    base.getMonth() + 1,
    base.getDate()
  ).hy;
  const hy = year != null ? year : nowH;

  /**
   * Maps tolerant Hijri month names to numeric month (1-12)
   * @param {string} name - Month name to match
   * @returns {number|null} Month number or null if not found
   */
  const hm = (name) => {
    name = name.toLowerCase().replace(/\s+/g, " ");
    if (/محرم|١/.test(name)) return 1;
    if (/صفر|٢/.test(name)) return 2;
    if (/ربيع الأول|ربيع الاول|ربيع ١|٣/.test(name)) return 3;
    if (/ربيع الآخر|ربيع الاخر|ربيع الثاني|ربيع ٢|٤/.test(name)) return 4;
    if (/جمادى الأولى|جمادى الاولى|جمادى ١|٥/.test(name)) return 5;
    if (/جمادى الآخرة|جمادى الاخرة|جمادى ٢|٦/.test(name)) return 6;
    if (/رجب|٧/.test(name)) return 7;
    if (/شعبان|٨/.test(name)) return 8;
    if (/رمضان|٩/.test(name)) return 9;
    if (/شوال|١٠/.test(name)) return 10;
    if (/ذو القعدة|ذو القعده|ذي القعدة|ذى القعدة|١١/.test(name)) return 11;
    if (/ذو الحجة|ذو الحجه|ذي الحجة|ذى الحجة|١٢/.test(name)) return 12;
    return null;
  };

  const mNo = hm(monthName);
  if (!mNo) return null;

  try {
    const g = toGregorian(hy, mNo, day);
    let d = new Date(g.gy, g.gm - 1, g.gd);

    // If year omitted and result is in the past, roll to next hijri year
    if (year == null && d < base) {
      const g2 = toGregorian(hy + 1, mNo, day);
      d = new Date(g2.gy, g2.gm - 1, g2.gd);
    }
    return format(d, "yyyy-MM-dd");
  } catch (e) {
    console.warn(`Failed to convert Hijri date: ${day} ${monthName} ${hy}`);
    return null;
  }
}

/**
 * Main function: normalizes Arabic text containing date/time expressions
 *
 * Process:
 * 1. Sanitizes text (converts digits, removes diacritics)
 * 2. Converts Hijri dates to Gregorian format
 * 3. Converts Gregorian dates with Arabic months
 * 4. Handles relative date expressions (including Gulf slang)
 * 5. Converts textual time expressions
 * 6. Converts numeric time expressions
 * 7. Handles standalone weekday references
 * 8. Cleans up spacing
 *
 * @param {string} raw - Raw Arabic text with date/time expressions
 * @param {Date} base - Base date for relative calculations (defaults to now)
 * @returns {string} Normalized text with standardized dates and times
 */
export function normalizeArabicText(raw, base = new Date()) {
  return raw
    .split(/\n+/)
    .map((line) => {
      // Step 0: Sanitize line (convert Arabic digits and remove diacritics)
      let t = stripHarakat(arDigits(line));

      // Step 1: Convert Hijri dates with tolerant month matching
      // Matches: "15 رمضان 1445" or "يوم 3 شعبان" etc.
      const hijriRe = new RegExp(
        String.raw`(?:يوم\s*)?(\d{1,2})\s+(${HIJRI_MONTH_PATTERN})(?:\s*(?:هـ|ه)?\s*(\d{4})?)?`,
        "gi"
      );
      t = t.replace(
        hijriRe,
        (_, d, mon, y) => ` ${hijriToGreg(+d, mon, y ? +y : null, base)} `
      );

      // Step 2: Convert Gregorian dates with Arabic month names
      // Matches: "25 ديسمبر 2024" or "5 يناير" etc.
      t = t.replace(
        /(\d{1,2})\s+(يناير|فبراير|مارس|ابريل|إبريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر)(?:\s+(\d{4}))?/gi,
        (_, d, mon, y) => {
          const yr = y ? +y : base.getFullYear();
          const gm = GM[mon];
          return ` ${format(new Date(yr, gm - 1, +d), "yyyy-MM-dd")} `;
        }
      );

      // Step 3: Handle relative date expressions (formal Arabic + Gulf slang)
      t = t
        // Day after tomorrow (formal)
        .replace(/بعد غد/gi, ` ${format(addDays(base, 2), "yyyy-MM-dd")} `)

        // Tomorrow variations (formal and Gulf slang)
        .replace(
          /غدًا|غدا|بكره|بكرا|بكرة|وبكره|وبكرة/gi,
          ` ${format(addDays(base, 1), "yyyy-MM-dd")} `
        )

        // Next week variations (formal and Gulf slang)
        .replace(
          /(?:الأسبوع|الاسبوع|والأسبوع|والاسبوع|واسبوع)\s*(?:المقبل|القادم|الجاي)/gi,
          ` ${format(addDays(base, 7), "yyyy-MM-dd")} `
        )

        // Standalone "week" (implies next week in context)
        .replace(/\bاسبوع\b/gi, ` ${format(addDays(base, 7), "yyyy-MM-dd")} `);

      // Step 4: Convert textual time expressions
      // Matches: "الساعة الثالثة مساءً" or "الساعة الحادية عشر صباحاً"
      t = t.replace(
        /(الساعة)\s*(الأولى|الاولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة|الحادية\s+عشر(?:ة)?|الحادية\s+عشرة|الثانية\s+عشر(?:ة)?|الثانية\s+عشرة)\s*(صباح|ص|مساء|بعد الظهر|عصر|ليل)?/gi,
        (_, __, word, period) => {
          const key = word.replace(/\s+/g, " ");
          const h = TEXT_HOURS[key];
          if (!h) return _;
          return ` ${smartTime(h, 0, period || "")} `;
        }
      );

      // Step 5: Convert numeric time expressions
      // First pattern: "الساعة 3:30 مساءً"
      t = t.replace(
        /الساعة\s*(\d{1,2})[:٫:](\d{2})\s*(صباح|ص|مساء|بعد الظهر|عصر|ليل)?/gi,
        (_, h, m, p) => ` ${smartTime(+h, +m, p || t)} `
      );
      // Second pattern: standalone "3:30 مساءً"
      t = t.replace(
        /(\d{1,2})[:٫:](\d{2})\s*(صباح|ص|مساء|بعد الظهر|عصر|ليل)?/gi,
        (_, h, m, p) => ` ${smartTime(+h, +m, p || t)} `
      );

      // Step 6: Handle standalone weekday references
      // Only process if no explicit date already exists in the line
      if (!/\d{4}-\d{2}-\d{2}/.test(t)) {
        const m = t.match(
          /(?:^|\s)يوم\s+(السبت|الأحد|الاحد|الاثنين|الأثنين|الثلاثاء|الثلثاء|الأربعاء|الاربعاء|الخميس|الجمعة)/i
        );
        if (m) t = t.replace(m[0], ` ${nextWeekday(m[1], base)} `);
      }

      // Step 7: Final cleanup - normalize spacing
      return t.replace(/\s+/g, " ").trim();
    })
    .join("\n");
}
