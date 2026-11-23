"""Soranî B2 section (8 units) -> /home/claude/kew_ckb/b2.json (same shape as a1/a2/b1.json)."""
import json

def U(id, ku, col, name, words, sents, tips, story=None, note=None):
    u = {"id": "ckb_b2_" + id, "ku": ku, "col": col, "name": name, "words": words, "sents": sents, "tips": tips}
    if story: u["story"] = story
    if note: u["note"] = note
    return u

units = [
U("kar", "کار و پیشە", "#5b3a29", "İş hayatı|Working life|Berufsleben",
 [["چاوپێکەوتن", "iş görüşmesi, mülakat|job interview|Vorstellungsgespräch"], ["ئەزموون", "deneyim|experience|Erfahrung"],
  ["بڕوانامە", "diploma|degree, diploma|Abschluss, Diplom", "🎓"], ["شارەزایی", "uzmanlık, beceri|expertise, skill|Fachwissen"],
  ["بەرپرسیار", "sorumlu|responsible|verantwortlich"], ["هاوکار", "iş arkadaşı|colleague|Kollege"],
  ["کۆمپانیا", "şirket|company|Firma", "🏢"], ["داواکاری", "başvuru|application|Bewerbung"],
  ["بەڕێوەبەر", "müdür|manager|Leiter, Chef"], ["بوار", "alan|field|Bereich"],
  ["گەشە کردن", "gelişmek|to grow, develop|sich entwickeln"], ["پلە بەرزبوونەوە", "terfi|promotion|Beförderung"]],
 [["بۆ ئەو کارەی کە لە ڕۆژنامەکەدا بڵاوکرابووەوە، داواکاریم ناردووە.", "Gazetede yayımlanmış olan iş için başvuru gönderdim.|I have applied for the job that had been published in the newspaper.|Ich habe mich auf die Stelle beworben, die in der Zeitung ausgeschrieben war."],
  ["بەڕێوەبەرەکە پرسیاری لە ئەزموونی پێشووم کرد.", "Müdür önceki deneyimimi sordu.|The manager asked about my previous experience.|Der Chef fragte nach meiner bisherigen Erfahrung."],
  ["پێنج ساڵ ئەزموونم لە بواری ڕۆژنامەنووسیدا هەیە.", "Gazetecilik alanında beş yıllık deneyimim var.|I have five years of experience in journalism.|Ich habe fünf Jahre Erfahrung im Journalismus."],
  ["کارێکم دەوێت کە تێیدا گەشە بکەم.", "İçinde gelişebileceğim bir iş istiyorum.|I want a job in which I can grow.|Ich möchte eine Arbeit, in der ich mich entwickeln kann."],
  ["هاوکارەکانم هەمیشە یارمەتیم دەدەن.", "İş arkadaşlarım bana hep yardım eder.|My colleagues always help me.|Meine Kollegen helfen mir immer."],
  ["ئەگەر ئەم کارە وەربگرم، دەبێت بچمە هەولێر.", "Bu işi alırsam Hewlêre gitmem gerekecek.|If I get this job, I will have to move to Hewlêr.|Wenn ich die Stelle bekomme, muss ich nach Hewlêr ziehen."],
  ["دوای چاوپێکەوتنەکە، هەستم کرد کە باش بوو.", "Görüşmeden sonra iyi geçtiğini hissettim.|After the interview I felt it had gone well.|Nach dem Gespräch hatte ich das Gefühl, dass es gut lief."]],
 [["… کە …", "«کە» ilgi cümlesi kurar: «کارێک کە تێیدا گەشە بکەم» = içinde gelişebileceğim bir iş. Önceki isim çoğu zaman ‎-ێک ya da ‎-ەی alır: «ئەو کارەی کە…».|«کە» introduces a relative clause: «کارێک کە تێیدا گەشە بکەم» = a job in which I can grow. The noun before it usually takes ‎-ێک or ‎-ەی: «ئەو کارەی کە…».|«کە» leitet einen Relativsatz ein: «کارێک کە تێیدا گەشە بکەم» = eine Arbeit, in der ich mich entwickeln kann. Das Nomen davor trägt meist ‎-ێک oder ‎-ەی: «ئەو کارەی کە…»."],
  ["بڵاوکرابووەوە", "Geçmişin geçmişi (-ابوو): bir olaydan önce olmuş olanı anlatır: «yayımlanmış olan».|Past perfect (-ابوو): something that had already happened: «had been published».|Plusquamperfekt (-ابوو): etwas, das schon vorher geschehen war: «war veröffentlicht worden»."]]),

U("teknik", "تەکنەلۆژیا و میدیا", "#2f4f6f", "Teknoloji ve medya|Technology and media|Technik und Medien",
 [["تۆڕە کۆمەڵایەتییەکان", "sosyal medya|social media|soziale Netzwerke"], ["بەرنامە", "program, uygulama|programme, app|Programm, App", "📱"],
  ["وشەی نهێنی", "şifre|password|Passwort", "🔑"], ["زانیاری", "bilgi|information|Information"],
  ["هەواڵی ساختە", "sahte haber|fake news|Falschmeldung"], ["سەرچاوە", "kaynak|source|Quelle"],
  ["شاشە", "ekran|screen|Bildschirm", "🖥️"], ["ئاڵوودەبوون", "bağımlılık|addiction|Sucht"],
  ["بەسوود", "faydalı|useful|nützlich"], ["بڵاو کردنەوە", "yaymak, paylaşmak|to share, publish|verbreiten, teilen"],
  ["پەیوەندی", "iletişim, bağlantı|communication, contact|Kommunikation, Kontakt"], ["بەبێ ئەوەی", "-meden, -madan|without (doing)|ohne dass"]],
 [["پێش ئەوەی هەواڵێک بڵاو بکەیتەوە، پێویستە سەرچاوەکەی بزانیت.", "Bir haberi paylaşmadan önce kaynağını bilmelisin.|Before you share a piece of news, you need to know its source.|Bevor du eine Nachricht teilst, musst du ihre Quelle kennen."],
  ["زۆر لە گەنجان ڕۆژانە چەند کاتژمێر لەسەر تۆڕە کۆمەڵایەتییەکان بەسەر دەبەن.", "Gençlerin çoğu her gün saatlerini sosyal medyada geçiriyor.|Many young people spend hours a day on social media.|Viele junge Leute verbringen täglich Stunden in sozialen Netzwerken."],
  ["وشەی نهێنییەکەت بە کەس مەڵێ.", "Şifreni kimseye söyleme.|Do not tell anyone your password.|Sag niemandem dein Passwort."],
  ["بەبێ ئەوەی بزانم، مۆبایلەکەم کاتێکی زۆری لێ بردم.", "Farkında olmadan telefonum çok vaktimi aldı.|Without my noticing, my phone took a lot of my time.|Ohne dass ich es merkte, nahm mir mein Handy viel Zeit."],
  ["ئەم بەرنامەیە بۆ فێربوونی زمان زۆر بەسوودە.", "Bu uygulama dil öğrenmek için çok faydalı.|This app is very useful for learning languages.|Diese App ist zum Sprachenlernen sehr nützlich."],
  ["هەواڵی ساختە زۆر خێراتر لە هەواڵی ڕاست بڵاو دەبێتەوە.", "Sahte haber doğru haberden çok daha hızlı yayılır.|Fake news spreads much faster than true news.|Falschmeldungen verbreiten sich viel schneller als wahre Nachrichten."],
  ["هەفتەی جارێک شاشەکەم دادەخەم و کتێب دەخوێنمەوە.", "Haftada bir ekranı kapatıp kitap okurum.|Once a week I switch off the screen and read a book.|Einmal pro Woche mache ich den Bildschirm aus und lese ein Buch."]],
 [["پێش ئەوەی + ب-", "«پێش ئەوەی» (‑meden önce) ve «بەبێ ئەوەی» (‑meden) sonrasında fiil istek kipinde gelir: «پێش ئەوەی بڵاو بکەیتەوە».|«پێش ئەوەی» (before) and «بەبێ ئەوەی» (without) are followed by the subjunctive: «پێش ئەوەی بڵاو بکەیتەوە».|Nach «پێش ئەوەی» (bevor) und «بەبێ ئەوەی» (ohne dass) steht der Konjunktiv: «پێش ئەوەی بڵاو بکەیتەوە»."],
  ["مە- … !", "Olumsuz emir «مە-» ile yapılır: «مەڵێ!» söyleme!, «مەچۆ!» gitme!|The negative imperative uses «مە-»: «مەڵێ!» don't say!, «مەچۆ!» don't go!|Der verneinte Imperativ nutzt «مە-»: «مەڵێ!» sag nicht!, «مەچۆ!» geh nicht!"]]),

U("zanko", "خوێندنی باڵا", "#4a5d23", "Üniversite hayatı|University life|Studium",
 [["کۆلێژ", "fakülte|faculty, college|Fakultät"], ["بەش", "bölüm|department|Fachbereich"],
  ["تاقیکردنەوە", "sınav|exam|Prüfung", "📝"], ["نمرە", "not|grade, mark|Note"],
  ["لێکۆڵینەوە", "araştırma|research|Forschung"], ["وتار", "makale, ödev yazısı|essay, article|Aufsatz"],
  ["دەرچوون", "mezuniyet|graduation|Abschluss"], ["ماستەر", "yüksek lisans|master's degree|Master"],
  ["وەرگیران", "kabul edilmek|to be admitted|aufgenommen werden"], ["ماندووبوون", "yorgunluk, emek|tiredness, effort|Mühe"],
  ["سەرکەوتن", "başarı|success|Erfolg", "🏆"], ["زاراوە", "lehçe|dialect|Dialekt"]],
 [["ساڵی داهاتوو لە بەشی ئەدەبی کوردی وەردەگیرێم.", "Gelecek yıl Kürt edebiyatı bölümüne kabul edileceğim.|Next year I will be admitted to the Kurdish literature department.|Nächstes Jahr werde ich im Fach Kurdische Literatur aufgenommen."],
  ["پێش تاقیکردنەوەکان، شەوان تا درەنگ دەخوێنمەوە.", "Sınavlardan önce geceleri geç saate kadar çalışırım.|Before the exams I study late into the night.|Vor den Prüfungen lerne ich bis spät in die Nacht."],
  ["لێکۆڵینەوەکەم دەربارەی زاراوەکانی زمانی کوردییە.", "Araştırmam Kürtçenin lehçeleri hakkında.|My research is about the dialects of Kurdish.|Meine Forschung handelt von den Dialekten des Kurdischen."],
  ["ئەگەر نمرەی بەرزترم بهێنایە، دەچوومە کۆلێژی پزیشکی.", "Daha yüksek not alsaydım tıp fakültesine giderdim.|If I had got higher marks, I would have gone to medical school.|Hätte ich bessere Noten gehabt, wäre ich an die medizinische Fakultät gegangen."],
  ["مامۆستاکەمان داوای لێکردین وتارێک بنووسین.", "Hocamız bizden bir makale yazmamızı istedi.|Our teacher asked us to write an essay.|Unsere Lehrerin bat uns, einen Aufsatz zu schreiben."],
  ["دوای دەرچوون، دەمەوێت ماستەر بخوێنم.", "Mezun olduktan sonra yüksek lisans yapmak istiyorum.|After graduating I want to do a master's.|Nach dem Abschluss möchte ich einen Master machen."],
  ["سەرکەوتن بەبێ ماندووبوون نایەت.", "Başarı emeksiz gelmez.|Success does not come without effort.|Erfolg kommt nicht ohne Mühe."]],
 [["ئەگەر … بهێنایە، دەچووم", "Gerçekleşmemiş koşul: «ئەگەر» + -ایە ile biten geçmiş istek, sonuçta دە- + geçmiş kök: «-saydım, -erdim».|Unreal condition: «ئەگەر» + past subjunctive ending in -ایە, then دە- + past stem: «if I had…, I would have…».|Irrealer Bedingungssatz: «ئەگەر» + Konjunktiv der Vergangenheit auf -ایە, dann دە- + Vergangenheitsstamm: «hätte ich…, wäre ich…»."]],
 story={"title": "ڕۆژی تاقیکردنەوە", "lines": [
  ["Rojda", "ئازاد، ئامادەیت بۆ تاقیکردنەوەی ئەمڕۆ؟", "Azad, bugünkü sınava hazır mısın?|Azad, are you ready for today's exam?|Azad, bist du bereit für die Prüfung heute?"],
  ["Azad", "نازانم... دوێنێ شەو تا کاتژمێر دوو دەمخوێندەوە.", "Bilmiyorum... Dün gece saat ikiye kadar çalıştım.|I don't know... Last night I studied until two o'clock.|Ich weiß nicht... Gestern habe ich bis zwei Uhr gelernt.",
   {"q": "Azad dün gece ne zamana kadar çalıştı?|Until when did Azad study last night?|Bis wann hat Azad gestern gelernt?", "options": ["نازانم... دوێنێ شەو تا کاتژمێر دوو دەمخوێندەوە.", "نازانم... دوێنێ شەو زوو نووستم.", "نازانم... دوێنێ شەو فیلمم بینی."]}],
  ["Rojda", "خەوی کەم باش نییە. پێویستە مێشکت پشوو بدات.", "Az uyku iyi değil. Beyninin dinlenmesi gerek.|Too little sleep is not good. Your brain needs to rest.|Wenig Schlaf ist nicht gut. Dein Gehirn muss sich ausruhen."],
  ["Azad", "ڕاستە. بەڵام ئەگەر زووتر دەستم پێ بکردایە، ئێستا ئارامتر دەبووم.", "Doğru. Ama daha erken başlasaydım şimdi daha rahat olurdum.|True. But if I had started earlier, I would be calmer now.|Stimmt. Aber hätte ich früher angefangen, wäre ich jetzt ruhiger."],
  ["Rojda", "مەترسە! تۆ هەمیشە نمرەی باش دەهێنیت.", "Korkma! Sen hep iyi not alırsın.|Don't worry! You always get good marks.|Keine Sorge! Du bekommst immer gute Noten."],
  ["Azad", "سوپاس، ڕۆژدا. دوای تاقیکردنەوەکە، با بچین چا بخۆینەوە.", "Sağ ol Rojda. Sınavdan sonra gidip çay içelim.|Thanks, Rojda. After the exam, let's go and have tea.|Danke, Rojda. Nach der Prüfung lass uns Tee trinken gehen.",
   {"q": "Sınavdan sonra ne yapmak istiyorlar?|What do they want to do after the exam?|Was wollen sie nach der Prüfung machen?", "options": ["سوپاس، ڕۆژدا. دوای تاقیکردنەوەکە، با بچین چا بخۆینەوە.", "سوپاس، ڕۆژدا. دوای تاقیکردنەوەکە، دەچمەوە ماڵەوە و دەنووم.", "سوپاس، ڕۆژدا. دوای تاقیکردنەوەکە، دەچمە کتێبخانە."]}],
  ["Rojda", "باشە! سەرکەوتوو بیت!", "Tamam! Başarılar!|Deal! Good luck!|Abgemacht! Viel Erfolg!"]]}),

U("shar", "ژیانی شار", "#6b4f2a", "Şehir hayatı|City life|Stadtleben",
 [["هاتوچۆ", "trafik|traffic|Verkehr", "🚗"], ["کرێ", "kira|rent|Miete"], ["ئاپارتمان", "apartman dairesi|flat, apartment|Wohnung", "🏢"],
  ["شارەوانی", "belediye|municipality|Stadtverwaltung"], ["خزمەتگوزاری", "hizmet|service|Dienstleistung"], ["گواستنەوەی گشتی", "toplu taşıma|public transport|öffentlicher Verkehr", "🚌"],
  ["دەنگەدەنگ", "gürültü|noise|Lärm"], ["کێشە", "sorun|problem|Problem"], ["بەڵێن دان", "söz vermek|to promise|versprechen"],
  ["هەرچەندە", "-se de, rağmen|although|obwohl"], ["ماندووکەر", "yorucu|tiring|anstrengend"], ["گەورەترین", "en büyük|the biggest|der größte"]],
 [["هەرچەندە ژیان لە شار ئاسانترە، بەڵام هاتوچۆ زۆر ماندووکەرە.", "Şehirde hayat daha kolay olsa da trafik çok yorucu.|Although life in the city is easier, the traffic is very tiring.|Obwohl das Leben in der Stadt leichter ist, ist der Verkehr sehr anstrengend."],
  ["کرێی خانوو لە هەولێر ساڵ بە ساڵ گرانتر دەبێت.", "Hewlêrde ev kiraları yıldan yıla pahalanıyor.|Rents in Hewlêr get more expensive year by year.|Die Mieten in Hewlêr werden von Jahr zu Jahr teurer."],
  ["شارەوانی بەڵێنی داوە پارکێکی نوێ دروست بکات.", "Belediye yeni bir park yapmaya söz verdi.|The municipality has promised to build a new park.|Die Stadt hat versprochen, einen neuen Park zu bauen."],
  ["گەورەترین کێشەی شارەکەمان دەنگەدەنگە.", "Şehrimizin en büyük sorunu gürültü.|The biggest problem in our city is noise.|Das größte Problem unserer Stadt ist der Lärm."],
  ["ئەگەر گواستنەوەی گشتی باشتر بێت، کەمتر ئۆتۆمبێل بەکار دەهێنین.", "Toplu taşıma daha iyi olursa daha az araba kullanırız.|If public transport were better, we would use cars less.|Wenn der öffentliche Verkehr besser wäre, würden wir weniger Auto fahren."],
  ["ئێمە لە ئاپارتمانێکی بچووک لە نزیک بازاڕ دەژین.", "Çarşının yakınında küçük bir dairede yaşıyoruz.|We live in a small flat near the bazaar.|Wir wohnen in einer kleinen Wohnung nahe dem Basar."],
  ["خزمەتگوزارییەکانی شار لە هی گوندەکان باشترن.", "Şehirdeki hizmetler köylerdekinden daha iyi.|Services in the city are better than in the villages.|Die Dienstleistungen in der Stadt sind besser als in den Dörfern."]],
 [["-تر / -ترین", "Karşılaştırma «-تر» (daha), üstünlük «-ترین» (en): گران → گرانتر → گرانترین. «لە» = -den: «لە هی گوندەکان باشترن».|Comparative «-تر», superlative «-ترین»: گران → گرانتر → گرانترین. «لە» = than: «لە هی گوندەکان باشترن».|Komparativ «-تر», Superlativ «-ترین»: گران → گرانتر → گرانترین. «لە» = als: «لە هی گوندەکان باشترن»."],
  ["هەرچەندە …، بەڵام …", "«هەرچەندە» (‑se de) cümlesinin ardından çoğu zaman «بەڵام» gelir.|A clause with «هەرچەندە» (although) is usually followed by «بەڵام».|Auf einen Satz mit «هەرچەندە» (obwohl) folgt meist «بەڵام»."]]),

U("meju", "مێژوو و کەلەپوور", "#7a3b2e", "Tarih ve miras|History and heritage|Geschichte und Erbe",
 [["مێژوو", "tarih|history|Geschichte"], ["کەلەپوور", "miras, gelenek|heritage|Erbe"], ["قەڵا", "kale|citadel|Zitadelle", "🏰"],
  ["شوێنەوار", "tarihi eser, kalıntı|antiquities, ruins|Altertümer"], ["مۆزەخانە", "müze|museum|Museum", "🏛️"], ["سەدە", "yüzyıl|century|Jahrhundert"],
  ["ئەشکەوت", "mağara|cave|Höhle"], ["دۆزرانەوە", "keşfedilmek, bulunmak|to be discovered|entdeckt werden"], ["نیشتەجێبوون", "yerleşmek|to settle|sich niederlassen"],
  ["نەوە", "kuşak, nesil|generation|Generation"], ["ڕابردوو", "geçmiş|the past|Vergangenheit"], ["شارستانییەت", "medeniyet|civilisation|Zivilisation"]],
 [["قەڵای هەولێر یەکێکە لە کۆنترین شوێنە نیشتەجێبووەکانی جیهان.", "Hewlêr Kalesi dünyanın en eski yerleşim yerlerinden biridir.|The Hewlêr Citadel is one of the oldest inhabited places in the world.|Die Zitadelle von Hewlêr ist einer der ältesten bewohnten Orte der Welt."],
  ["لە ئەشکەوتی شانەدەردا ئێسکی مرۆڤی نیاندەرتاڵ دۆزرایەوە.", "Şaneder Mağarasında Neandertal insanı kemikleri bulundu.|Neanderthal bones were discovered in Shanidar Cave.|In der Shanidar-Höhle wurden Neandertaler-Knochen entdeckt."],
  ["مۆزەخانەکە پڕە لە شوێنەواری سەدەکانی پێشوو.", "Müze geçmiş yüzyıllardan kalma eserlerle dolu.|The museum is full of antiquities from past centuries.|Das Museum ist voller Altertümer aus früheren Jahrhunderten."],
  ["پێویستە کەلەپوورەکەمان بۆ نەوەکانی داهاتوو بپارێزین.", "Mirasımızı gelecek kuşaklar için korumalıyız.|We must protect our heritage for future generations.|Wir müssen unser Erbe für künftige Generationen bewahren."],
  ["باپیرم چیرۆکی کۆنی گوندەکەمانی بۆ گێڕاینەوە.", "Dedem köyümüzün eski hikâyesini bize anlattı.|My grandfather told us the old story of our village.|Mein Großvater erzählte uns die alte Geschichte unseres Dorfes."],
  ["مێژوو تەنها ڕابردوو نییە، وانەیەکیشە بۆ داهاتوو.", "Tarih sadece geçmiş değil, gelecek için bir derstir de.|History is not only the past, it is also a lesson for the future.|Geschichte ist nicht nur Vergangenheit, sondern auch eine Lehre für die Zukunft."],
  ["شارستانییەتە کۆنەکان لە نزیک ڕووبارەکان نیشتەجێ دەبوون.", "Eski medeniyetler nehirlerin yakınına yerleşirdi.|Ancient civilisations used to settle near rivers.|Alte Zivilisationen siedelten sich an Flüssen an."]],
 [["-را / -رایەوە", "Edilgen geçmiş: kök + ‎-را: «دۆزرایەوە» bulundu, «گوترا» söylendi. Fiilde ‎-ەوە varsa sona eklenir.|Past passive: stem + ‎-را: «دۆزرایەوە» was discovered, «گوترا» was said. A verb with ‎-ەوە keeps it at the end.|Passiv der Vergangenheit: Stamm + ‎-را: «دۆزرایەوە» wurde entdeckt, «گوترا» wurde gesagt. Verben mit ‎-ەوە behalten es am Ende."]]),

U("edeb", "ئەدەب و شیعر", "#3b3a6b", "Edebiyat ve şiir|Literature and poetry|Literatur und Dichtung",
 [["شیعر", "şiir|poem, poetry|Gedicht"], ["شاعیر", "şair|poet|Dichter", "✍️"], ["ڕۆمان", "roman|novel|Roman", "📖"],
  ["نووسەر", "yazar|writer|Schriftsteller"], ["چیرۆکی کورت", "öykü|short story|Kurzgeschichte"], ["دیوان", "divan, şiir kitabı|collected poems|Gedichtsammlung"],
  ["خوێنەر", "okur|reader|Leser"], ["بەرهەم", "eser|work (of art)|Werk"], ["خەیاڵ", "hayal|imagination|Fantasie"],
  ["کلاسیکی", "klasik|classical|klassisch"], ["سادە", "sade, basit|simple|einfach"], ["زار", "ağız, lehçe|dialect|Mundart"]],
 [["نالی یەکێکە لە گەورەترین شاعیرە کلاسیکییەکانی کورد.", "Nalî en büyük klasik Kürt şairlerinden biridir.|Nalî is one of the greatest classical Kurdish poets.|Nalî ist einer der größten klassischen kurdischen Dichter."],
  ["شێرکۆ بێکەس شیعرەکانی بە زمانێکی سادە و جوان دەنووسی.", "Şêrko Bêkes şiirlerini sade ve güzel bir dille yazardı.|Şêrko Bêkes wrote his poems in simple, beautiful language.|Şêrko Bêkes schrieb seine Gedichte in einer einfachen, schönen Sprache."],
  ["هەر جارێک ئەم شیعرە دەخوێنمەوە، شتێکی نوێی تێدا دەدۆزمەوە.", "Bu şiiri her okuyuşumda içinde yeni bir şey buluyorum.|Every time I read this poem, I find something new in it.|Jedes Mal, wenn ich dieses Gedicht lese, entdecke ich etwas Neues darin."],
  ["نووسەرەکە لە بەرهەمە نوێیەکەیدا باسی ژیانی گوند دەکات.", "Yazar yeni eserinde köy hayatını anlatıyor.|In her new work the writer describes village life.|In ihrem neuen Werk beschreibt die Autorin das Dorfleben."],
  ["دیوانی مەولەوی بە زاری هەورامی نووسراوە.", "Mewlewî'nin divanı Hewramî ağzıyla yazılmıştır.|Mewlewî's collected poems are written in the Hewramî dialect.|Mewlewîs Gedichtsammlung ist im Hewramî-Dialekt geschrieben."],
  ["ئەم ڕۆمانە خوێنەرێکی زۆری لە نێو گەنجاندا هەیە.", "Bu romanın gençler arasında çok okuru var.|This novel has many readers among young people.|Dieser Roman hat viele Leser unter jungen Leuten."],
  ["خەیاڵی منداڵان لە هی گەورەکان بەهێزترە.", "Çocukların hayal gücü büyüklerinkinden güçlüdür.|Children's imagination is stronger than adults'.|Die Fantasie von Kindern ist stärker als die von Erwachsenen."]],
 [["هەر جارێک …، …", "«هەر جارێک» = her … -dığında: «هەر جارێک دەیخوێنمەوە» her okuduğumda.|«هەر جارێک» = every time: «هەر جارێک دەیخوێنمەوە» every time I read it.|«هەر جارێک» = jedes Mal, wenn: «هەر جارێک دەیخوێنمەوە» jedes Mal, wenn ich es lese."],
  ["نووسراوە", "Edilgen geçmiş zaman (miş'li): «نووسراوە» yazılmıştır, «وەرگێڕدراوە» çevrilmiştir.|Passive present perfect: «نووسراوە» has been written, «وەرگێڕدراوە» has been translated.|Passiv Perfekt: «نووسراوە» ist geschrieben worden, «وەرگێڕدراوە» ist übersetzt worden."]]),

U("hest", "هەست و پەیوەندی", "#8a3a52", "Duygular ve ilişkiler|Feelings and relationships|Gefühle und Beziehungen",
 [["هەست", "duygu|feeling|Gefühl"], ["خەم", "dert, keder|sorrow, worry|Kummer"], ["خۆشەویستی", "sevgi|love|Liebe", "❤️"],
  ["متمانە", "güven|trust|Vertrauen"], ["دڵتەنگ", "özlemiş, hüzünlü|missing someone, sad|sehnsüchtig, traurig"], ["شانازی", "gurur|pride|Stolz"],
  ["تووڕە", "kızgın|angry|wütend"], ["هاوڕێیەتی", "arkadaşlık|friendship|Freundschaft"], ["لێبوردن", "affetmek, af|forgiveness|Vergebung"],
  ["گلەیی", "sitem, yakınma|reproach|Vorwurf"], ["پشتگیری", "destek|support|Unterstützung"], ["دڵ شکاندن", "kalp kırmak|to hurt someone's feelings|jemanden kränken"]],
 [["هاوڕێیەتی ڕاستەقینە لەسەر متمانە دروست دەبێت.", "Gerçek dostluk güven üzerine kurulur.|True friendship is built on trust.|Echte Freundschaft beruht auf Vertrauen."],
  ["کاتێک لە ماڵەوە دوورم، زۆر دڵتەنگی دایکم دەبم.", "Evden uzaktayken annemi çok özlerim.|When I am away from home, I miss my mother a lot.|Wenn ich weit weg von zu Hause bin, vermisse ich meine Mutter sehr."],
  ["شانازی بە سەرکەوتنی خوشکەکەم دەکەم.", "Kız kardeşimin başarısıyla gurur duyuyorum.|I am proud of my sister's success.|Ich bin stolz auf den Erfolg meiner Schwester."],
  ["ببورە، نەمدەویست دڵت بشکێنم.", "Özür dilerim, kalbini kırmak istemedim.|Sorry, I didn't mean to hurt your feelings.|Entschuldige, ich wollte dich nicht kränken."],
  ["کاتێک تووڕە دەبم، هەوڵ دەدەم بێدەنگ بم و بیر بکەمەوە.", "Kızdığımda susmaya ve düşünmeye çalışırım.|When I get angry, I try to stay quiet and think.|Wenn ich wütend werde, versuche ich still zu sein und nachzudenken."],
  ["لە کاتە سەختەکاندا، خێزانەکەم هەمیشە پشتگیریم دەکەن.", "Zor zamanlarda ailem bana hep destek olur.|In hard times my family always supports me.|In schweren Zeiten unterstützt mich meine Familie immer."],
  ["لێبوردن ئاسان نییە، بەڵام دڵ ئارام دەکاتەوە.", "Affetmek kolay değil ama kalbi rahatlatır.|Forgiving is not easy, but it calms the heart.|Vergeben ist nicht leicht, aber es beruhigt das Herz."]],
 [["دڵتەنگی … بوون", "«Birini özlemek» = «دڵتەنگی کەسێک بوون»: «دڵتەنگی دایکم دەبم». Fiil «بوون»dur, özlenen kişi ezafe ile bağlanır.|«To miss someone» = «دڵتەنگی کەسێک بوون»: «دڵتەنگی دایکم دەبم». The verb is «بوون»; the person is linked with the ezafe.|«Jemanden vermissen» = «دڵتەنگی کەسێک بوون»: «دڵتەنگی دایکم دەبم». Das Verb ist «بوون», die Person wird mit Ezafe angehängt."],
  ["نەمدەویست", "Geçmişte süren olumsuz istek: نە + دە + ویست, kişi eki öne gelir: «نەمدەویست» istemiyordum.|Negative past continuous of «want»: نە + دە + ویست with the clitic in front: «نەمدەویست» I didn't want.|Verneinte Verlaufsform von «wollen»: نە + دە + ویست, Klitikon vorn: «نەمدەویست» ich wollte nicht."]],
 story={"title": "گلەیی", "lines": [
  ["Berfîn", "ڕۆژدا، بۆچی دوێنێ وەڵامی پەیامەکەمت نەدایەوە؟", "Rojda, dün neden mesajıma cevap vermedin?|Rojda, why didn't you answer my message yesterday?|Rojda, warum hast du gestern nicht auf meine Nachricht geantwortet?"],
  ["Rojda", "ببورە، مۆبایلەکەم کوژابووەوە و درەنگ بینیم.", "Özür dilerim, telefonum kapanmıştı ve geç gördüm.|Sorry, my phone had died and I saw it late.|Entschuldige, mein Handy war aus und ich habe es spät gesehen.",
   {"q": "Rojda neden cevap vermedi?|Why didn't Rojda answer?|Warum hat Rojda nicht geantwortet?", "options": ["ببورە، مۆبایلەکەم کوژابووەوە و درەنگ بینیم.", "ببورە، تووڕە بووم و نەمویست وەڵام بدەمەوە.", "ببورە، لە گەشتدا بووم و ئینتەرنێت نەبوو."]}],
  ["Berfîn", "وامزانی لێم تووڕەیت. زۆر خەمبار بووم.", "Bana kızgın olduğunu sandım. Çok üzüldüm.|I thought you were angry with me. I was very sad.|Ich dachte, du bist wütend auf mich. Ich war sehr traurig."],
  ["Rojda", "نا، هەرگیز! تۆ باشترین هاوڕێی منیت.", "Hayır, asla! Sen benim en iyi arkadaşımsın.|No, never! You are my best friend.|Nein, niemals! Du bist meine beste Freundin."],
  ["Berfîn", "منیش هەر وا. جاری داهاتوو ئەگەر کێشەیەک هەبوو، ڕاستەوخۆ پێم بڵێ.", "Ben de öyle. Bir dahaki sefere bir sorun olursa doğrudan söyle.|Me too. Next time, if there is a problem, tell me directly.|Ich auch. Wenn es nächstes Mal ein Problem gibt, sag es mir direkt.",
   {"q": "Berfîn bir dahaki sefere ne istiyor?|What does Berfîn ask for next time?|Was wünscht sich Berfîn für das nächste Mal?", "options": ["منیش هەر وا. جاری داهاتوو ئەگەر کێشەیەک هەبوو، ڕاستەوخۆ پێم بڵێ.", "منیش هەر وا. جاری داهاتوو پەیامم بۆ مەنێرە.", "منیش هەر وا. جاری داهاتوو با بچینە سینەما."]}],
  ["Rojda", "بەڵێن بێت. ئێستا با بچین بەستەنی بخۆین!", "Söz. Şimdi gidip dondurma yiyelim!|Promise. Now let's go and have ice cream!|Versprochen. Jetzt lass uns ein Eis essen gehen!"]]}),

U("fermi", "زمانی فەرمی", "#2e5b55", "Resmî dil ve aktarım|Formal language and reported speech|Formelle Sprache und indirekte Rede",
 [["بەڕێز", "sayın|dear (formal)|sehr geehrte(r)"], ["مۆڵەت", "izin|leave, permission|Urlaub, Erlaubnis"], ["کۆبوونەوە", "toplantı|meeting|Besprechung"],
  ["سکاڵا", "şikâyet|complaint|Beschwerde"], ["بەڵگەنامە", "belge|document|Dokument", "📄"], ["پێشکەش کردن", "sunmak, teslim etmek|to submit, present|einreichen"],
  ["ئاگادار کردنەوە", "haber vermek|to inform|informieren"], ["دوا خستن", "ertelemek|to postpone|verschieben"], ["ئایا", "acaba, -mi|whether, (question marker)|ob"],
  ["بە زووترین کات", "en kısa zamanda|as soon as possible|so bald wie möglich"], ["لەگەڵ ڕێزدا", "saygılarımla|yours sincerely|mit freundlichen Grüßen"], ["گوتی کە", "-dığını söyledi|said that|sagte, dass"]],
 [["بەڕێز بەڕێوەبەر، بەم نامەیە داوای مۆڵەتی سێ ڕۆژ دەکەم.", "Sayın müdür, bu yazıyla üç günlük izin talep ediyorum.|Dear director, with this letter I request three days of leave.|Sehr geehrter Herr Direktor, mit diesem Schreiben beantrage ich drei Tage Urlaub."],
  ["گوتی کە سبەینێ کۆبوونەوەکە دوا دەخرێت.", "Yarınki toplantının erteleneceğini söyledi.|She said that tomorrow's meeting would be postponed.|Sie sagte, dass die Besprechung morgen verschoben wird."],
  ["پرسیی ئایا بەڵگەنامەکانمان ئامادە کردووە.", "Belgeleri hazırlayıp hazırlamadığımızı sordu.|He asked whether we had prepared the documents.|Er fragte, ob wir die Dokumente vorbereitet hätten."],
  ["سکاڵاکەمان پێشکەشی شارەوانی کرد.", "Şikâyetimizi belediyeye sunduk.|We submitted our complaint to the municipality.|Wir haben unsere Beschwerde bei der Stadt eingereicht."],
  ["تکایە بە زووترین کات ئاگادارمان بکەنەوە.", "Lütfen en kısa zamanda bize haber verin.|Please let us know as soon as possible.|Bitte informieren Sie uns so bald wie möglich."],
  ["مامۆستاکە پێی گوتین کە تاقیکردنەوەکە ئاسان دەبێت.", "Öğretmen bize sınavın kolay olacağını söyledi.|The teacher told us that the exam would be easy.|Der Lehrer sagte uns, dass die Prüfung leicht sein würde."],
  ["لەگەڵ ڕێزدا، چاوەڕێی وەڵامتان دەکەین.", "Saygılarımızla, cevabınızı bekliyoruz.|Yours sincerely, we look forward to your reply.|Mit freundlichen Grüßen, wir freuen uns auf Ihre Antwort."]],
 [["گوتی کە … / پرسیی ئایا …", "Dolaylı anlatım: «گوتی کە» (‑dığını söyledi) ve «پرسیی ئایا» (‑ip ‑madığını sordu). Zaman çoğu zaman olduğu gibi kalır.|Reported speech: «گوتی کە» (said that) and «پرسیی ئایا» (asked whether). The tense usually stays as it was.|Indirekte Rede: «گوتی کە» (sagte, dass) und «پرسیی ئایا» (fragte, ob). Die Zeitform bleibt meist erhalten."],
  ["بەڕێز … / لەگەڵ ڕێزدا", "Resmî mektup «بەڕێز» (sayın) ile başlar, «لەگەڵ ڕێزدا» (saygılarımla) ile biter. Resmî dilde «ئێوە» (siz) kullanılır.|A formal letter opens with «بەڕێز» (dear) and closes with «لەگەڵ ڕێزدا» (yours sincerely). Formal Soranî uses «ئێوە» (you, plural).|Ein formeller Brief beginnt mit «بەڕێز» und endet mit «لەگەڵ ڕێزدا». Formell verwendet man «ئێوە» (Sie)."]],
 note="Tebrikler! Soranî B2 tamam: artık iş, okul ve şehir hayatında rahatça konuşabilir, edebiyat ve tarih üzerine okuyabilir, resmî bir mektup yazabilirsin. Pîroz be! 🎉|Congratulations! Soranî B2 is done: you can now speak comfortably about work, study and city life, read about literature and history, and write a formal letter. Pîroz be! 🎉|Glückwunsch! Soranî B2 geschafft: Du kannst jetzt sicher über Arbeit, Studium und Stadtleben sprechen, über Literatur und Geschichte lesen und einen formellen Brief schreiben. Pîroz be! 🎉"),
]

sec = {"lvl": "B2", "name": "İleri orta|Upper intermediate|Obere Mittelstufe",
       "sub": "İş hayatı, teknoloji, üniversite, şehir, tarih, edebiyat, duygular, resmî dil|Work, technology, university, the city, history, literature, feelings, formal language|Arbeit, Technik, Studium, Stadt, Geschichte, Literatur, Gefühle, formelle Sprache",
       "units": units}
# checks
assert len(units) == 8 and sum(1 for u in units if u.get("story")) == 2
for u in units:
    assert len(u["words"]) == 12 and len(u["sents"]) == 7, u["id"]
    for w in u["words"]: assert w[1].count("|") == 2, w
    for s in u["sents"]: assert s[1].count("|") == 2, s
    for t in u["tips"]: assert t[1].count("|") == 2, t
    if u.get("story"):
        qs = [l for l in u["story"]["lines"] if len(l) > 3]; assert len(qs) == 2
        for l in qs: assert l[3]["options"][0] == l[1]
json.dump(sec, open("/home/claude/kew_ckb/b2.json", "w"), ensure_ascii=False, indent=1)
print("ok", sum(len(u["words"]) for u in units), "words", sum(len(u["sents"]) for u in units), "sentences")
