# Juji — proje el kitabı (Claude için)

Bu dosya, projeye başka bir Claude oturumundan / hesabından devam edebilmek için yazıldı.
Önce bunu, sonra `AGENTS.md` (Expo kuralları) dosyasını oku. Kullanıcıyla **Türkçe**, kısa ve net konuş.

> **API anahtarları bu depoda yok ve hiçbir dosyaya yazılmamalı.** Kullanıcı anahtarları sohbette verir;
> onları depo dışında (ör. `~/.k4`) sakla, commit etme, silme (kullanıcı yeniden sormak istemiyor).

---

## 1. Proje nedir

**Juji**, Duolingo tarzı bir Kürtçe öğrenme uygulaması (maskot: Juji, kirpi). Arayüz dili Türkçe / İngilizce / Almanca.

| | |
|---|---|
| Paket | `com.okuyanstudio.jujilang` |
| Depo / dal | `gaffarokuyan/kew`, çalışma dalı **`b1-kilim-tasarim`** (main'e push yok) |
| Web sürümü | https://gaffarokuyan.github.io/kew/ (`gh-pages` dalı) |
| Sürüm | `app.json` → `version` / `android.versionCode` (şu an 1.0.3 / 4) |
| Teknoloji | Expo SDK 58, React Native 0.88, Expo Router, expo-audio, Reanimated, react-native-svg, Hermes |

### Kurslar
| Kurs | Durum | Ses |
|---|---|---|
| **Kurmancî** (`kmr`) | A1–B1, 67 ünite | `assets/audio/` (ders kayıtları, Ülgen sesi — bkz. §5) |
| **Zazakî** (`zza`) | A1 beta, Vate yazımı | yok (TTS desteklemiyor) |
| **Soranî** (`ckb`) | A1–B2 beta, **iki alfabe** (Arap / Latin / ikisi) | ders sesi yok; podcast sesli |
| **English** (`eng`) | A1–B1 beta, 52 ünite, **yalnızca Türkçe arayüzle** (`base: ["tr"]`) | cihazın İngilizce sesi (expo-speech, en-US) |
| **Deutsch** (`deu`) | A1 beta, 17 ünite, yalnızca Türkçe arayüzle | cihazın Almanca sesi (de-DE) |

Yabancı dil kursları `course.ts` → `FOREIGN` (tts dili + örnek cümle) ve `isForeign()` ile tanımlanır; yeni dil = FOREIGN'a satır + `tools/<dil>/` içerik + `CourseBadge` kodu/rengi + i18n `to<Dil>` + lig sunucusundaki COURSES listesi.

---

## 2. Klasör yapısı

```
src/app/            Ekranlar (Expo Router). (tabs)/ = Öğren, Pratik, Kelimeler, Profil
  lesson.tsx        Ders motoru (alıştırma türleri: seç, eşleştir, dinle, yaz, konuş, ses farkı…)
  story.tsx read.tsx  Hikâye ve "Oku ve dinle"
  podcasts.tsx      Podcast listesi (üstte seviye seçici A1/A2, seçim store.podLvl'de)
  episode.tsx       Podcast oynatıcı (oynat/duraklat, ±10 sn, hız, satır takibi, sonda 3 soru)
  shop.tsx          Mağaza (yalnızca elmas, gerçek para yok): çift XP 15 dk, sınırsız can 60 dk, can doldur, seri dondurma, Juji atkıları (art.tsx SCARVES), promosyon kodları (PROMO)
  onboarding.tsx    Karşılama (Juji, köşede 🌐 arayüz dili, Öğrenmeye başla / Giriş yap = yedek koduyla geri yükleme) → kurs → (Soranî alfabe) → Neden öğreniyorsun (store.why) → seviye → günlük hedef (dk) → hatırlatma (yalnız mobil) → başlangıç yeri → ilk ders
  plus.tsx          Juji Plus ekranı (ücretsiz/Plus tablosu, aylık/yıllık, 7 gün deneme). Fiyatlar yer tutucu; satın alma henüz bağlı değil
  settings.tsx _layout.tsx (ErrorBoundary burada)
src/lib/
  course.ts         Kurs yükleme: loadCourse(id, script) tabloları yerinde değiştirir; Soranî Latin dönüşümü (LAT)
  store.ts          Durum + AsyncStorage (anahtar "kew:v3"); kurs değişince ilerleme saved[] içine saklanır
  exercises.ts      Ders üretimi, SRS tekrar aralıkları
  audio.ts          speak(text): metni audioMap'te arar ve çalar; sfx
  speech.ts         Konuşma alıştırması: kayıt → Supabase "juji-stt" → kurdishtts STT (XHR ile, expo/fetch FormData göndermiyor)
  plus.ts           Juji Plus anahtarı: PLUS_ENABLED=false iken hiçbir şey kilitli değil ve Plus'a giriş noktası görünmez. Açmadan önce: Play ödeme hesabı, juji_plus_monthly/yearly (7 gün deneme) abonelikleri, RevenueCat (dev/EAS build), sunucu doğrulaması. Kilitler: sınırsız can (lesson.tsx), podcast indirme (episode.tsx)
  podcast.ts        Podcast şeması + uzaktan manifest (gh-pages/podcasts.json, yüksek version kazanır)
  script.ts i18n.ts nodes.ts
src/ui/             Tema, ikonlar, maskot çizimleri, ortak bileşenler, TopBar (kurs seçici), ScriptPicker
  CourseBadge.tsx   Kurs rozeti (renkli kilim baklavası + KU/SO/KI/EN/DE) ve CourseRow; üst bar, ayarlar, profil
  Speaker.tsx       Ayakta duran konuşan karakterler (Person, CHARS renkleriyle) ve GlossText: kelimeye dokununca anlamı (WORD'den, en uzun 3 kelimelik ifade önce)
src/content/
  course.json course_zza.json course_ckb.json   Kurs içerikleri
  course_deu.json   ÜRETİLMİŞ: tools/deu/build.py (kaynak tools/deu/a1.txt; cevapta ä=ae, ö=oe, ü=ue, ß=ss kabul)
  course_eng.json   ÜRETİLMİŞ: tools/eng/build.py (kaynak: tools/eng/a1.txt a2.txt b1.txt, basit satır biçimi; anlamlar yalnızca Türkçe)
  strings.json      Arayüz metinleri "tr|en|de"
  audioMap.ts       ÜRETİLMİŞ: Kurmancî metin -> assets/audio/<hash>.mp3
  podcasts.json     ÜRETİLMİŞ: tools/podcast/build.py
supabase/functions/juji-stt/   STT köprüsü (deploy edilmiş; anahtar Supabase secret KURDISH_STT_KEY)
supabase/functions/juji-backup/ Bulut yedeği: 12 haneli yedek kodu (sunucuda yalnızca hash'i), save/load/delete; tablo juji_backup. İstemci: src/lib/backup.ts (otomatik: ilerleme değişince 2 dk sonra ve uygulamadan çıkarken), src/ui/BackupCard.tsx (Ayarlar + karşılamadaki Giriş yap)
supabase/functions/juji-league/ Haftalık lig + arkadaşlar (verify_jwt kapalı, başlık x-juji-app; tablolar juji_players/juji_week/juji_friends, yalnızca fonksiyon erişir)
tools/podcast/      İçerik ve ses üretim betikleri (bkz. §4–5)
arsiv/ses-eski/     Eski ses kayıtları (uygulamada kullanılmıyor; geri dönüş için README var)
```

İçerik metin alanları çoğunlukla `"Türkçe|English|Deutsch"` biçiminde tek dizedir (`M()` ile çözülür).

---

## 3. Çalıştırma, kontrol, yayın

```bash
npm install
npx tsc --noEmit && npx eslint src      # her değişiklikten sonra
```

### Web (gh-pages)
```bash
npx expo export -p web                  # app.json'da experiments.baseUrl = "/kew"
cp dist/index.html dist/404.html && touch dist/.nojekyll
cp src/content/podcasts.json dist/podcasts.json
# gh-pages dalındaki pod/*.mp3 (podcast sesleri) korunmalı: dist/pod/ içine kopyala
# sonra dist içeriğini gh-pages dalına koy, commit + push
```
Test için Playwright kullanılabilir (localStorage `kew:v3` içine durum yazıp sayfayı açmak pratik).

### Android
- Bulut: `npx eas-cli@latest build -p android --profile preview` (APK) / `production` (AAB).
- Yerel derleme yapıldıysa: `./gradlew --max-workers=1 assembleRelease bundleRelease`, `-Xmx2600m -XX:+UseSerialGC` (bellek az).
- İmza anahtarı (keystore) depoda **yok**; kullanıcıdan iste, asla commit etme.
- Kullanıcı APK'yı kendi telefonuna kurar; Play'den gelen kopyayla imza çakışırsa önce eskisini kaldırması gerekir.
- **Kullanıcı tercihi:** önce web güncellenir; APK'yı kullanıcı "go" deyince derle.

---

## 4. Podcast

- 16 bölüm: Kurmancî 10 (A1×5, A2×5), Soranî 6 (A1×3, A2×3). Özgün metinler, kelimeler ve 3 soruluk test.
- Metinler: `tools/podcast/kmr.py`, `tools/podcast/ckb.py` (+ `ckb_lat.txt`: Mazdek ile Latin'e çevrilmiş satırlar).
- Sesler gh-pages'te: `https://gaffarokuyan.github.io/kew/pod/<id>.mp3`. Uygulama sesi internetten çeker,
  bu yüzden yeni ses / bölüm için APK gerekmez; `podcasts.json` içindeki `version` artırılmalı.
- `build.py <version>`: bölümleri birleştirir, ses varsa `audio` URL'si, `dur` ve satır başlangıçları (`at`) ekler.
- Yeni dil eklemek = yeni bölüm dosyası; kod değişmez (her bölüm kendi `course` alanını taşır).

### Karakter sesleri (ElevenLabs `eleven_v4`)
| Karakter | Ses | voice_id |
|---|---|---|
| Juji | Gökçe Deniz | `oPC5I9GKjMReiaM29gjY` |
| Rojda, Berfîn | Ülgen | `9UoAU5im7Rl44J2IvBHU` |
| Azad | Yunus C | `aB3kjBYXGX3jTKxg1bsE` |
| Bapîr (dede) | Seyfullah Kartal | `mF7tIc9VLrznhGooGjaT` |
| Dayik (anne) | Belma | `KbaseEXyT9EE0CQLEfbB` |
| Bijîşk (doktor) | Buket | `FDs1ZX5J4e4f2c2erxtW` |
| Firoşkar (satıcı) | Murat Ekim | `TqNc7APmsiuh2GbDHtCn` |

`el.py` yöntemi (kullanıcının "SESLENDIRME" rehberine göre):
1. Her satırın başına İngilizce duygu etiketi: `[cheerful]`, `[old man, nostalgic]`…
2. Önce Latin harfle üret → ElevenLabs **Scribe** (`scribe_v1`, `kmr` / `ckb`) ile yazıya dök → benzerlik puanı.
3. Puan < 0.9 ise Arap harfli Kurmancî ile de üret (`to_arabic`), iyi olanı tut.
4. Zor kelimeler için `FIX` sözlüğünde heceleme ipucu (`xwiş-ka`); `best.py` zayıf satırlar için birden çok deneme üretip en iyisini `pick.json`a yazar.
5. "Juji" adı "Jûjî" diye okutulur. Aynı anda en fazla 3 istek.
Claude sesi **dinleyemez**; doğrulama yalnızca STT ile. Şüpheli satırları kullanıcıya liste olarak bildir.

---

## 5. Ders sesleri (Kurmancî)

- `assets/audio/*.mp3` + `src/content/audioMap.ts`. `audio.ts` metni noktalama silinmiş / küçük harf varyantlarıyla da arar.
- **Kasım 2026:** tüm kayıtlar Ülgen (`eleven_v4`) ile yeniden üretiliyor ve sesi hiç olmayan 546 B1 metni ekleniyor:
  `tools/podcast/lesson.py`. Kaldığı yerden devam eder (her kayıt için `.done` dosyası tutar), en sonda `audioMap.ts`'i yeniden yazar
  ve zayıf kayıtları `lesson_report.txt`'e döker. Bitip bitmediğini `audioMap.ts` başlığından anla
  ("ElevenLabs eleven_v4, Ülgen" yazıyorsa bitti).
- Eski sesler: `arsiv/ses-eski/dersler-kurdishtts/`.
- **Kısa i kontrolü (Kasım 2026):** Kurmancî `i` = Türkçe ı sesi. `tools/icheck/`: kısa i geçen 1319 kayıt `juji-stt` (Kurdish STT) ile tarandı, i→î duyulan 97 kayıt Ülgen ile i→ı yazılarak (olmazsa Arap harfiyle) yeniden okutuldu; 76 kayıt düzeldi (`duzelen.txt`; 5 tanesi Soranî kadın klonu sesiyle, Soranî dil ipucu + Arap harfi: ifix3.py), 21 kayıt `kalan.txt`te. Sonra kullanıcı listeyi kendi sesiyle okudu (kayıt sohbette); okuduğu 52 madde ElevenLabs speech-to-speech (`eleven_multilingual_sts_v2`) ile Ülgen sesine çevrilip yerine kondu (`tools/icheck/sts.py`, kullanıcı bu yolu dinleyerek seçti). Eski hâller `arsiv/ses-eski/i-duzeltme-oncesi/`. ElevenLabs anahtarı `~/.secrets/elevenlabs`.

> Betiklerdeki yollar ilk oturumun makinesine göre yazılmış (`/home/claude/kew_pod/`, anahtar dosyaları `~/.k3`, `~/.k4`…).
> Yeni ortamda bu yolları ve anahtar dosyalarını kendi ortamına göre ayarla.

---

## 6. Dış servisler

| Servis | Ne için | Not |
|---|---|---|
| ElevenLabs | Podcast ve ders sesleri, Scribe STT | Kredi biter: hata `quota_exceeded`. Anahtar izinleri: Text to Speech, Speech to Text, Voices Read, User Read |
| Kurdish TTS (kurdishtts.com) | Uygulama içi konuşma kontrolü (STT); eski ses üretimi | Ücretsiz kota ayda 20.000 karakter; TTS ve STT ayrı anahtar |
| Mazdek AI (MCP) | Yazım denetimi `kmr`/`ckb`/`zza` (ücretsiz), Soranî Arap⇄Latin (ücretsiz), çeviri (ücretli) | TTS yok |
| Supabase | `juji-stt`, `juji-league` edge function | Başlık `x-juji-app: juji-app-1`. Lig: takma ad + haftalık XP; cihazda gizli anahtar, sunucuda yalnızca hash'i. Haftalar Pazartesi 00:00 (TR saati); grup 30 kişi, 10 lig (Tov→Stêrk) |

---

## 7. Kurallar ve kullanıcı tercihleri

- Yalnızca `b1-kilim-tasarim` dalına push et (ve web için `gh-pages`). **main'e asla.** Etiket (tag) push'u bu ortamda reddediliyor.
- Kurmancî yazım: Hawar alfabesi; kontrol için Mazdek spellcheck. Soranî içerikte Latin karşılığı `LAT` haritasında.
- Tıklama sesi kaldırıldı (kullanıcı istemedi); `sfx("tap")` yalnızca titreşim.
- Kullanıcı kısa ve doğrudan yanıt sever. Uzun işlerde ilerlemeyi kısa notlarla bildir.
- İngilizce kursu: cevap karşılaştırmada kısaltmalar açılır (I'm = I am, doesn't = does not; exercises.ts `enNorm`). Konuşma alıştırması ve ses farkı pratiği bu kursta kapalı; köprü, kültür, podcast kartları gizli.
- Web yayınında `_expo/` klasörü silinmez (eski parçalar kalsın, açık sekmeler bozulmasın); ErrorBoundary eski parça hatasında bir kez yeniler.
- Tasarım: "kilim" teması (kilim desenli ayraçlar, sıcak renkler, köşesi küçük yuvarlatılmış kartlar).

---

## 8. Açık işler

- Ders seslerinin Ülgen ile yeniden üretimi (§5) — bitince web'i güncelle, APK için kullanıcının "go"sunu bekle.
- Podcast'te şüpheli satırlar (kullanıcı dinleyip bildirecek).
- Zazakî ve Soranî içeriğin anadili konuşan biri tarafından gözden geçirilmesi.
- Soranî / Zazakî ders sesleri (Zazakî için TTS yok).
- B2 seviyesi (istendi, ertelendi).
- Juji Plus'ı açmak (kullanıcı kararı: altyapı hazır, Play'de yayın ve ilk birkaç yüz kullanıcıdan sonra). Dersler her zaman ücretsiz kalacak.
- Play Console: gizlilik sayfası (mikrofon), Data safety formu, kapalı test için AAB yükleme — kullanıcı yapar.
