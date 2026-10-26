# Juji (maskot: Juji kirpi) — Kurmancî (native)

Expo SDK 58 · React Native 0.88 · Expo Router · expo-audio · Reanimated · react-native-svg

## Yapı
- `src/app/` — ekranlar (Expo Router): onboarding, (tabs)/öğren·pratik·kelimeler·profil, lesson, story, settings
- `src/lib/` — içerik türetme (course), durum + AsyncStorage (store), ders üretimi (exercises), ses (audio), i18n
- `src/ui/` — tema, ikonlar, maskot/SVG çizimler, ortak bileşenler (Btn, Sheet, Toast, Konfeti)
- `src/content/` — HTML prototipten taşınan veri: course.json (67 ünite, 891 kelime), strings.json (TR/EN/DE), audioMap.ts
- `assets/audio/` — 1412 Kurmancî kayıt (kurmanji_233), `assets/sfx/` — efekt sesleri

## Çalıştırma
npm install
npx expo start            # geliştirme (dev build önerilir)
npx tsc --noEmit && npx expo lint

## Build
npx eas-cli@latest init   # EAS proje kimliğini app.json'a yazar
npx eas-cli@latest build -p android --profile preview      # APK
npx eas-cli@latest build -p android --profile production   # Play Store (AAB)
