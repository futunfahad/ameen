# Ameen Al-Majlis | أمين المجلس

> **An offline, privacy-focused Arabic meeting assistant that records audio, transcribes it locally with Whisper.rn, summarises the discussion, and extracts key dates & decisions — all on-device.**  
> **تطبيق ذكي لإدارة الاجتماعات يعمل دون اتصال بالإنترنت، يُسجِّل الصوت ويحوِّله إلى نص، ثم يُلخِّص المحتوى ويستخرج التواريخ والقرارات المهمة محليًا.**

---

## Contents | المحتويات
1. [Project Overview](#project-overview--نظرة-عامة)  
2. [Features](#features--المميزات)  
3. [Architecture](#architecture--الهيكلة)  
4. [Tech Stack](#tech-stack--التقنيات)  
5. [Installation & Run](#installation--run--التثبيت-والتشغيل)  
6. [Releases / APK](#releases--apk--الإصدارات--apk)  
7. [License](#license--الترخيص)  

---

## Project Overview | نظرة عامة

**English**  
Ameen Al-Majlis tackles the pain of manual minute-taking in Arabic meetings. Built with React Native + Expo, it operates 100% offline to respect organisational confidentiality. Audio is converted to text on-device via `Whisper.rn`; the text is then passed to `llama.rn` running **Qwen-2.5 3B-Instruct** for summarisation, decision extraction, and Hijri/Gregorian date normalisation. All data stays in a local SQLite database.

**العربية**  
يهدف **أمين المجلس** إلى حل مشكلة تدوين محاضر الاجتماعات يدويًا باللغة العربية. بُني باستخدام Expo وReact Native، ويعمل دون اتصال بالإنترنت حفاظًا على سرية بيانات المؤسسات. يُحوِّل الصوت إلى نص عبر `Whisper.rn`، ثم يمرر النص إلى `llama.rn` لتشغيل نموذج **Qwen-2.5 3B-Instruct** من أجل التلخيص واستخراج القرارات والتواريخ الهجرية والميلادية. تُخزَّن جميع البيانات محليًا في قاعدة SQLite.

---

## Features | المميزات

| ✅ | English                               | العربية                              |
|----|---------------------------------------|---------------------------------------|
| 🎙️ | On-device audio recording & playback | تسجيل الصوت وتشغيله محليًا           |
| 📝 | Offline Arabic ASR (Whisper Turbo)   | تحويل الكلام إلى نص عربي بلا إنترنت |
| 📰 | Instant summary & action items       | توليد ملخص فوري وبنود عمل            |
| 📅 | Hijri and Gregorian date extraction  | استخراج التواريخ الهجرية والميلادية |
| 🔒 | 100% local storage (SQLite)          | تخزين محلي كامل                      |
| 📤 | Export/share meeting content         | تصدير أو مشاركة النصوص والملخصات    |
| 🕹️ | React Native RTL UI                  | واجهة تدعم النصوص العربية            |

---

## Architecture | الهيكلة

```
📱 React Native (Expo)
├── 🎙️ Audio Capture
├── 🤖 Whisper.rn → Arabic transcript
├── 🦙 llama.rn + Qwen2.5-3B →
│   • Summarisation
│   • Decision & date extraction
├── 🗄️ SQLite local DB
└── 🖼️ UI: Home • Transcript • Summary • Calendar • History
```

---

## Tech Stack | التقنيات

| Layer            | Library / Model                          |
|------------------|-------------------------------------------|
| Mobile Framework | **Expo** SDK > 49, React Native 0.73     |
| ASR              | **Whisper Large-v3-Turbo** via `whisper.rn` |
| NLP              | **Qwen-2.5-3B-Instruct (GGUF q4_k_m)** via `llama.rn` |
| DB               | SQLite (`expo-sqlite`)                   |
| Date Handling    | `hijri-converter`, custom normaliser     |
| UI               | React Navigation, react-native-calendars |

---

## Installation & Run | التثبيت والتشغيل

```bash
# 1. Clone repository
git clone https://github.com/your-username/ameen-al-majlis.git
cd ameen-al-majlis

# 2. Install JavaScript dependencies
npm install      # or yarn

# 3. Download Whisper & Qwen models (see docs/models.md)

# 4. Run on a physical Android device
npx expo start --dev-client
```

> 💡 **Note:** First launch will copy model files (~1.6 GB) into the app sandbox.

---
## Releases / APK | الإصدارات / ملفات APK

Compiled signed APKs (≤250 MB) are published under the **GitHub Releases** tab.

يتم نشر ملفات الAPK الموقعة (≤250 ميغابايت) في قسم **Releases** .

### 📥 How to Install | كيفية التثبيت

1. Go to the **Releases** tab on your GitHub repository  
   اذهب إلى قسم **Releases**   

2. Download the file named `app-release.apk`  
   قم بتنزيل الملف باسم `app-release.apk`

3. Transfer it to your Android phone and install manually  
   انقله إلى هاتفك وقم بتثبيته يدويًا 

---

## License | الترخيص

This project is released under the **MIT License**.  
**هذا المشروع مرخَّص برخصة MIT مفتوحة المصدر.**

---

Made with ❤️ for Arabic-speaking teams.  
**صُنع بحب لخدمة الناطقين بالعربية.**


