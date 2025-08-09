// utils/arabicDateNormalizer.js
import { toGregorian, toHijri } from "hijri-converter";
import { format, addDays } from "date-fns";

/* === Maps === */
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

// Allow variants via a tolerant Hijri month regex (no need to pre-normalize months)
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
  "ذ[ويى]\\s*القعد(?:ة|ه|ى)", // more flexible endings
  "ذ[ويى]\\s*الحج(?:ة|ه|ى)", // more flexible endings
].join("|");

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

/* Arabic digits → ASCII */
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
const arDigits = (s) => s.replace(/[٠-٩]/g, (d) => AR_NUM[d]);

/* Remove harakat/diacritics + kashida + non-breaking spaces */
const stripHarakat = (s) =>
  s
    .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u0653-\u065F]/g, "") // harakat
    .replace(/\u0640/g, "") // tatweel
    .replace(/\u00A0/g, " ") // NBSP
    .replace(/\s+/g, " "); // collapse

/* textual hours -> number */
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

function smartTime(h, m, hints) {
  const txt = hints || "";
  if (/(مساء|عصر|بعد الظهر|ليل)/i.test(txt) && h < 12) h += 12;
  else if (!/(صباح|ص|AM)/i.test(txt) && h >= 1 && h <= 5) h += 12; // default PM window
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function nextWeekday(name, base) {
  const idx = WD[name.trim().replace(/^يوم\s*/, "")];
  if (idx == null) return null;
  const diff = (idx - base.getDay() + 7) % 7 || 7;
  return format(addDays(base, diff), "yyyy-MM-dd");
}

function hijriToGreg(day, monthName, year, base) {
  const nowH = toHijri(
    base.getFullYear(),
    base.getMonth() + 1,
    base.getDate()
  ).hy;
  const hy = year != null ? year : nowH;

  // map tolerant names to numeric month:
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
 * normalizeArabicText:
 *  - turns every Arabic date/time pattern in each line into:
 *      YYYY-MM-DD and HH:MM (24h)
 *  - keeps the rest of the line (title)
 */
export function normalizeArabicText(raw, base = new Date()) {
  return raw
    .split(/\n+/)
    .map((line) => {
      // 0) sanitize line (digits + harakat)
      let t = stripHarakat(arDigits(line));

      // 1) Hijri dates (tolerant)
      const hijriRe = new RegExp(
        String.raw`(?:يوم\s*)?(\d{1,2})\s+(${HIJRI_MONTH_PATTERN})(?:\s*(?:هـ|ه)?\s*(\d{4})?)?`,
        "gi"
      );
      t = t.replace(
        hijriRe,
        (_, d, mon, y) => ` ${hijriToGreg(+d, mon, y ? +y : null, base)} `
      );

      // 2) Gregorian Arabic month
      t = t.replace(
        /(\d{1,2})\s+(يناير|فبراير|مارس|ابريل|إبريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر)(?:\s+(\d{4}))?/gi,
        (_, d, mon, y) => {
          const yr = y ? +y : base.getFullYear();
          const gm = GM[mon];
          return ` ${format(new Date(yr, gm - 1, +d), "yyyy-MM-dd")} `;
        }
      );

      // 3) Relative words
      t = t
        .replace(/بعد غد/gi, ` ${format(addDays(base, 2), "yyyy-MM-dd")} `)
        .replace(/غدًا|غدا/gi, ` ${format(addDays(base, 1), "yyyy-MM-dd")} `)
        .replace(
          /الأسبوع\s+(?:المقبل|القادم)/gi,
          ` ${format(addDays(base, 7), "yyyy-MM-dd")} `
        );

      // 4) textual time: "الساعة الثالثة (صباحًا|مساءً|عصرًا)?"
      t = t.replace(
        /(الساعة)\s*(الأولى|الاولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة|الحادية\s+عشر(?:ة)?|الحادية\s+عشرة|الثانية\s+عشر(?:ة)?|الثانية\s+عشرة)\s*(صباح|ص|مساء|بعد الظهر|عصر|ليل)?/gi,
        (_, __, word, period) => {
          const key = word.replace(/\s+/g, " ");
          const h = TEXT_HOURS[key];
          if (!h) return _;
          return ` ${smartTime(h, 0, period || "")} `;
        }
      );

      // 5) numeric time hh:mm (with weird spacing/diacritics already stripped)
      t = t.replace(
        /الساعة\s*(\d{1,2})[:٫:](\d{2})\s*(صباح|ص|مساء|بعد الظهر|عصر|ليل)?/gi,
        (_, h, m, p) => ` ${smartTime(+h, +m, p || t)} `
      );
      t = t.replace(
        /(\d{1,2})[:٫:](\d{2})\s*(صباح|ص|مساء|بعد الظهر|عصر|ليل)?/gi,
        (_, h, m, p) => ` ${smartTime(+h, +m, p || t)} `
      );

      // 6) lone weekday (only if no explicit date exists)
      if (!/\d{4}-\d{2}-\d{2}/.test(t)) {
        const m = t.match(
          /(?:^|\s)يوم\s+(السبت|الأحد|الاحد|الاثنين|الأثنين|الثلاثاء|الثلثاء|الأربعاء|الاربعاء|الخميس|الجمعة)/i
        );
        if (m) t = t.replace(m[0], ` ${nextWeekday(m[1], base)} `);
      }

      // 7) cleanup spacing
      return t.replace(/\s+/g, " ").trim();
    })
    .join("\n");
}
