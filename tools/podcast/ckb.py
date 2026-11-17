"""Juji podcast episodes — Soranî A1–A2 (original scripts, Arabic script + Latin).
  python3 ckb.py strings -> ckb_strings.txt (transliterate with Mazdek into ckb_lat.txt, same order)
  python3 ckb.py         -> ckb.json
"""
import json, re, sys, unicodedata

D = "/home/claude/kew_pod/"
E = []
def ep(n, lvl, title, name, sub, lines, words, quiz):
    E.append({"id": f"ckb-{lvl.lower()}-{n:02d}", "course": "ckb", "lvl": lvl, "n": n, "title": title, "name": name, "sub": sub,
              "audio": None, "lines": [{"s": s, "t": t, "m": m} for s, t, m in lines], "words": words, "quiz": quiz})

ep(1, "A1", "سڵاو، من ژوژیم!", "Merhaba, ben Juji!|Hi, I am Juji!|Hallo, ich bin Juji!", "Selamlaşma ve tanışma|Greetings and introductions|Begrüßung und Vorstellung",
 [("Juji", "سڵاو هاوڕێیان! من ژوژیم. ئەمە پۆدکاستەکەمانە.", "Merhaba arkadaşlar! Ben Juji. Bu bizim podcastimiz.|Hi friends! I am Juji. This is our podcast.|Hallo Freunde! Ich bin Juji. Das ist unser Podcast."),
  ("Juji", "ئەمڕۆ میوانەکەمان ڕۆژدایە. سڵاو ڕۆژدا!", "Bugün konuğumuz Rojda. Merhaba Rojda!|Today our guest is Rojda. Hi Rojda!|Heute ist Rojda unser Gast. Hallo Rojda!"),
  ("Rojda", "سڵاو ژوژی! چۆنی؟", "Merhaba Juji! Nasılsın?|Hi Juji! How are you?|Hallo Juji! Wie geht es dir?"),
  ("Juji", "من باشم، سوپاس. تۆ چۆنی؟", "İyiyim, teşekkürler. Sen nasılsın?|I am fine, thanks. How are you?|Mir geht es gut, danke. Und dir?"),
  ("Rojda", "منیش باشم. من خەڵکی هەولێرم.", "Ben de iyiyim. Ben Hewlêrliyim.|I am fine too. I am from Hewlêr.|Mir geht es auch gut. Ich komme aus Hewlêr."),
  ("Juji", "تۆ خوێندکاریت؟", "Öğrenci misin?|Are you a student?|Bist du Studentin?"),
  ("Rojda", "بەڵێ، من خوێندکارم. لە زانکۆ دەخوێنم.", "Evet, öğrenciyim. Üniversitede okuyorum.|Yes, I am a student. I study at the university.|Ja, ich bin Studentin. Ich studiere an der Universität."),
  ("Juji", "چ زمانێک دەزانیت؟", "Hangi dilleri biliyorsun?|Which languages do you know?|Welche Sprachen kannst du?"),
  ("Rojda", "کوردی، عەرەبی و کەمێک ئینگلیزی دەزانم.", "Kürtçe, Arapça ve biraz İngilizce biliyorum.|I know Kurdish, Arabic and a little English.|Ich kann Kurdisch, Arabisch und ein bisschen Englisch."),
  ("Juji", "زۆر باشە! سوپاس بۆ هاتنت، ڕۆژدا.", "Çok güzel! Geldiğin için teşekkürler, Rojda.|Very good! Thanks for coming, Rojda.|Sehr gut! Danke, dass du gekommen bist, Rojda."),
  ("Rojda", "سوپاس بۆ تۆ. خوات لەگەڵ!", "Ben teşekkür ederim. Hoşça kal!|Thank you. Goodbye!|Ich danke dir. Tschüss!"),
  ("Juji", "خوات لەگەڵ! تا پۆدکاستی داهاتوو، ماڵئاوا.", "Güle güle! Bir sonraki podcaste kadar hoşça kalın.|Goodbye! Until the next podcast, take care.|Auf Wiedersehen! Bis zum nächsten Podcast.")],
 [["میوان", "misafir|guest|Gast"], ["زانکۆ", "üniversite|university|Universität"], ["زمان", "dil|language|Sprache"], ["کەمێک", "biraz|a little|ein bisschen"], ["خوات لەگەڵ", "hoşça kal|goodbye|tschüss"]],
 [{"q": "Rojda nereli?|Where is Rojda from?|Woher kommt Rojda?", "o": ["Hewlêr|Hewlêr|Hewlêr", "Silêmanî|Silêmanî|Silêmanî", "Kerkûk|Kerkûk|Kerkûk"], "a": 0},
  {"q": "Rojda ne yapıyor?|What does Rojda do?|Was macht Rojda?", "o": ["Üniversitede okuyor|She studies at university|Sie studiert", "Öğretmen|She is a teacher|Sie ist Lehrerin", "Doktor|She is a doctor|Sie ist Ärztin"], "a": 0},
  {"q": "Rojda hangi dilleri biliyor?|Which languages does Rojda know?|Welche Sprachen kann Rojda?", "o": ["Kürtçe, Arapça, biraz İngilizce|Kurdish, Arabic, a little English|Kurdisch, Arabisch, etwas Englisch", "Sadece Kürtçe|Only Kurdish|Nur Kurdisch", "Almanca ve Kürtçe|German and Kurdish|Deutsch und Kurdisch"], "a": 0}])

ep(2, "A1", "خێزانەکەی ئازاد", "Azad'ın ailesi|Azad's family|Azads Familie", "Aile ve ev|Family and home|Familie und Zuhause",
 [("Juji", "سڵاو! ئەمڕۆ ئازاد لەگەڵمانە. ئازاد، خێزانەکەتان چەند کەسن؟", "Merhaba! Bugün Azad bizimle. Azad, aileniz kaç kişi?|Hi! Today Azad is with us. Azad, how many people are in your family?|Hallo! Heute ist Azad bei uns. Azad, wie groß ist eure Familie?"),
  ("Azad", "ئێمە پێنج کەسین.", "Biz beş kişiyiz.|We are five people.|Wir sind fünf Personen."),
  ("Azad", "دایکم، باوکم، خوشکێکم، برایەکم و من.", "Annem, babam, bir kız kardeşim, bir erkek kardeşim ve ben.|My mother, my father, a sister, a brother and me.|Meine Mutter, mein Vater, eine Schwester, ein Bruder und ich."),
  ("Juji", "ناوی خوشکەکەت چییە؟", "Kız kardeşinin adı ne?|What is your sister's name?|Wie heißt deine Schwester?"),
  ("Azad", "ناوی بەرفینە. تەمەنی دە ساڵە.", "Adı Berfîn. On yaşında.|Her name is Berfîn. She is ten years old.|Sie heißt Berfîn. Sie ist zehn Jahre alt."),
  ("Juji", "براکەت گەورەیە یان بچووکە؟", "Erkek kardeşin büyük mü küçük mü?|Is your brother older or younger?|Ist dein Bruder älter oder jünger?"),
  ("Azad", "براکەم لە من گەورەترە. لە سلێمانی کار دەکات.", "Ağabeyim benden büyük. Silêmanîde çalışıyor.|My brother is older than me. He works in Silêmanî.|Mein Bruder ist älter als ich. Er arbeitet in Silêmanî."),
  ("Juji", "ئێوە لە کوێ دەژین؟", "Siz nerede yaşıyorsunuz?|Where do you live?|Wo wohnt ihr?"),
  ("Azad", "ئێمە لە هەولێر دەژین. ماڵەکەمان گەورە نییە، بەڵام زۆر خۆشە.", "Hewlêrde yaşıyoruz. Evimiz büyük değil ama çok güzel.|We live in Hewlêr. Our house is not big, but it is very nice.|Wir wohnen in Hewlêr. Unser Haus ist nicht groß, aber sehr schön."),
  ("Juji", "باپیرت لەگەڵتان دەژی؟", "Deden sizinle mi yaşıyor?|Does your grandfather live with you?|Wohnt dein Opa bei euch?"),
  ("Azad", "نەخێر، باپیرم لە گوند دەژی. هاوینان دەچین بۆ لای.", "Hayır, dedem köyde yaşıyor. Yazları onun yanına gidiyoruz.|No, my grandfather lives in the village. We visit him in summer.|Nein, mein Opa wohnt im Dorf. Im Sommer besuchen wir ihn."),
  ("Juji", "خێزانێکی خۆشە! سوپاس ئازاد.", "Güzel bir aile! Teşekkürler Azad.|A lovely family! Thanks, Azad.|Eine schöne Familie! Danke, Azad.")],
 [["خێزان", "aile|family|Familie"], ["گەورە", "büyük|big, older|groß, älter"], ["بچووک", "küçük|small, younger|klein, jünger"], ["باپیر", "dede|grandfather|Opa"], ["گوند", "köy|village|Dorf"]],
 [{"q": "Azadın ailesi kaç kişi?|How many people are in Azad's family?|Wie viele Personen hat Azads Familie?", "o": ["Beş|Five|Fünf", "Dört|Four|Vier", "Altı|Six|Sechs"], "a": 0},
  {"q": "Azadın ağabeyi nerede çalışıyor?|Where does Azad's brother work?|Wo arbeitet Azads Bruder?", "o": ["Silêmanîde|In Silêmanî|In Silêmanî", "Hewlêrde|In Hewlêr|In Hewlêr", "Köyde|In the village|Im Dorf"], "a": 0},
  {"q": "Yazları nereye gidiyorlar?|Where do they go in summer?|Wohin fahren sie im Sommer?", "o": ["Dedelerinin köyüne|To grandfather's village|Ins Dorf des Opas", "Denize|To the sea|Ans Meer", "Silêmanîye|To Silêmanî|Nach Silêmanî"], "a": 0}])

ep(3, "A1", "لە بازاڕ", "Çarşıda|At the market|Auf dem Markt", "Alışveriş ve sayılar|Shopping and numbers|Einkaufen und Zahlen",
 [("Juji", "ئەمڕۆ لە بازاڕی هەولێرین. بازاڕ زۆر قەرەباڵغە!", "Bugün Hewlêr çarşısındayız. Çarşı çok kalabalık!|Today we are at the Hewlêr market. It is very crowded!|Heute sind wir auf dem Markt in Hewlêr. Es ist sehr voll!"),
  ("Firoşkar", "فەرموون! میوەی تازە! سێو، ترێ، هەنار!", "Buyurun! Taze meyve! Elma, üzüm, nar!|Welcome! Fresh fruit! Apples, grapes, pomegranates!|Bitte schön! Frisches Obst! Äpfel, Trauben, Granatäpfel!"),
  ("Rojda", "سڵاو. کیلۆیەک سێو بە چەندە؟", "Merhaba. Bir kilo elma ne kadar?|Hello. How much is a kilo of apples?|Hallo. Was kostet ein Kilo Äpfel?"),
  ("Firoşkar", "کیلۆیەک بە هەزار دینارە.", "Bir kilosu bin dinar.|One kilo is a thousand dinars.|Ein Kilo kostet tausend Dinar."),
  ("Rojda", "دوو کیلۆ سێوم دەوێت. هەنارت هەیە؟", "İki kilo elma istiyorum. Narın var mı?|I want two kilos of apples. Do you have pomegranates?|Ich möchte zwei Kilo Äpfel. Hast du Granatäpfel?"),
  ("Firoşkar", "بەڵێ، هەنارەکانمان زۆر شیرینن. کیلۆیەک بە دوو هەزار دینارە.", "Evet, narlarımız çok tatlı. Bir kilosu iki bin dinar.|Yes, our pomegranates are very sweet. A kilo is two thousand dinars.|Ja, unsere Granatäpfel sind sehr süß. Ein Kilo kostet zweitausend Dinar."),
  ("Rojda", "زۆر گرانە! هەرزانتر نییە؟", "Çok pahalı! Daha ucuzu yok mu?|That is very expensive! Is there nothing cheaper?|Das ist sehr teuer! Gibt es nichts Billigeres?"),
  ("Firoşkar", "باشە، بۆ تۆ بە هەزار و پێنج سەد.", "Tamam, sana bin beş yüze.|All right, for you one thousand five hundred.|Gut, für dich tausendfünfhundert."),
  ("Rojda", "باشە، کیلۆیەک هەناریشم بدەرێ.", "Tamam, bir kilo nar da ver.|OK, give me a kilo of pomegranates too.|Gut, gib mir auch ein Kilo Granatäpfel."),
  ("Firoşkar", "هەمووی دەکاتە سێ هەزار و پێنج سەد دینار.", "Hepsi üç bin beş yüz dinar ediyor.|All together that makes three thousand five hundred dinars.|Zusammen macht das dreitausendfünfhundert Dinar."),
  ("Rojda", "فەرموو. زۆر سوپاس!", "Buyur. Çok teşekkürler!|Here you are. Thank you very much!|Bitte. Vielen Dank!"),
  ("Firoşkar", "نۆشی گیان بێت! دووبارە وەرەوە.", "Afiyet olsun! Yine gel.|Enjoy! Come again.|Guten Appetit! Komm wieder.")],
 [["بازاڕ", "çarşı|market|Markt"], ["تازە", "taze|fresh|frisch"], ["بە چەندە؟", "ne kadar?|how much is it?|wie viel kostet es?"], ["گران", "pahalı|expensive|teuer"], ["هەرزان", "ucuz|cheap|billig"]],
 [{"q": "Bir kilo elma kaç dinar?|How much is a kilo of apples?|Was kostet ein Kilo Äpfel?", "o": ["Bin|A thousand|Tausend", "İki bin|Two thousand|Zweitausend", "Beş yüz|Five hundred|Fünfhundert"], "a": 0},
  {"q": "Rojda narı kaça alıyor?|What does Rojda pay for the pomegranates?|Was zahlt Rojda für die Granatäpfel?", "o": ["Bin beş yüz|One thousand five hundred|Tausendfünfhundert", "İki bin|Two thousand|Zweitausend", "Bin|A thousand|Tausend"], "a": 0},
  {"q": "Hepsi ne kadar tutuyor?|What is the total?|Wie viel kostet alles?", "o": ["Üç bin beş yüz dinar|Three thousand five hundred dinars|Dreitausendfünfhundert Dinar", "Üç bin dinar|Three thousand dinars|Dreitausend Dinar", "Dört bin dinar|Four thousand dinars|Viertausend Dinar"], "a": 0}])

ep(1, "A2", "نەورۆزی جاران", "Eski Newrozlar|Newroz in the old days|Newroz von früher", "Bayram ve gelenekler|Festival and traditions|Fest und Bräuche",
 [("Juji", "بەهار هات! هەوا گەرم دەبێت و چیاکان سەوز دەبن.", "Bahar geldi! Hava ısınıyor, dağlar yeşilleniyor.|Spring has come! It is getting warm and the mountains turn green.|Der Frühling ist da! Es wird warm und die Berge werden grün."),
  ("Juji", "میوانەکەمان باپیرەیە. باپیرە، کاتێک تۆ منداڵ بوویت، نەورۆز چۆن بوو؟", "Konuğumuz dede. Dede, sen çocukken Newroz nasıldı?|Our guest is Grandpa. Grandpa, what was Newroz like when you were a child?|Unser Gast ist Opa. Opa, wie war Newroz, als du ein Kind warst?"),
  ("Bapîr", "شەوی نەورۆز هەموو خەڵکی گوند لەسەر گردەکە ئاگریان دەکردەوە.", "Newroz gecesi bütün köy halkı tepede ateş yakardı.|On Newroz night the whole village lit fires on the hill.|In der Newroz-Nacht zündete das ganze Dorf Feuer auf dem Hügel an."),
  ("Bapîr", "ڕۆژی دواتر دەچووین بۆ سەیران.", "Ertesi gün pikniğe giderdik.|The next day we went on a picnic.|Am nächsten Tag machten wir ein Picknick."),
  ("Juji", "چیتان لەگەڵ خۆتان دەبرد؟", "Yanınızda ne götürürdünüz?|What did you take with you?|Was habt ihr mitgenommen?"),
  ("Bapîr", "دایکم بەیانی زوو دۆڵمەی دروست دەکرد.", "Annem sabah erkenden dolma yapardı.|My mother made dolma early in the morning.|Meine Mutter machte früh am Morgen Dolma."),
  ("Juji", "گۆرانیتان دەگوت و هەڵدەپەڕین؟", "Şarkı söyleyip halay çeker miydiniz?|Did you sing and dance?|Habt ihr gesungen und getanzt?"),
  ("Bapîr", "بەڵێ! دەهۆڵ و زوڕنا لێدەدرا و تا ئێوارە هەڵدەپەڕین.", "Evet! Davul zurna çalınır, akşama kadar halay çekerdik.|Yes! Drum and zurna were played and we danced until evening.|Ja! Trommel und Zurna spielten und wir tanzten bis zum Abend."),
  ("Juji", "ئەمڕۆش نەورۆز هەر وایە؟", "Bugün de Newroz böyle mi?|Is Newroz still like that today?|Ist Newroz heute noch so?"),
  ("Bapîr", "بەڵێ. هەموو ساڵێک جلی کوردی لەبەر دەکەین و دەچینە دەرەوە.", "Evet. Her yıl Kürt kıyafetlerimizi giyip dışarı çıkıyoruz.|Yes. Every year we put on Kurdish clothes and go outside.|Ja. Jedes Jahr ziehen wir kurdische Kleidung an und gehen hinaus."),
  ("Bapîr", "نەورۆز جەژنی بەهار و ئازادییە.", "Newroz baharın ve özgürlüğün bayramıdır.|Newroz is the festival of spring and freedom.|Newroz ist das Fest des Frühlings und der Freiheit."),
  ("Juji", "نەورۆزتان پیرۆز بێت!", "Newrozunuz kutlu olsun!|Happy Newroz!|Frohes Newroz!")],
 [["بەهار", "bahar|spring|Frühling"], ["ئاگر", "ateş|fire|Feuer"], ["سەیران", "piknik|picnic|Picknick"], ["هەڵپەڕکێ", "halay|folk dance|Reigentanz"], ["جەژن", "bayram|festival|Fest"]],
 [{"q": "Newroz gecesi köylüler ne yapardı?|What did the villagers do on Newroz night?|Was taten die Dorfbewohner in der Newroz-Nacht?", "o": ["Tepede ateş yakarlardı|Lit fires on the hill|Feuer auf dem Hügel", "Şehre giderlerdi|Went to town|In die Stadt fahren", "Erken yatarlardı|Went to bed early|Früh schlafen"], "a": 0},
  {"q": "Dedenin annesi sabah ne yapardı?|What did Grandpa's mother make in the morning?|Was machte Opas Mutter am Morgen?", "o": ["Dolma|Dolma|Dolma", "Kebap|Kebab|Kebab", "Çorba|Soup|Suppe"], "a": 0},
  {"q": "Dedeye göre Newroz neyin bayramı?|According to Grandpa, Newroz is the festival of…|Laut Opa ist Newroz das Fest…", "o": ["Baharın ve özgürlüğün|Spring and freedom|Frühling und Freiheit", "Hasadın|The harvest|Der Ernte", "Kışın|Winter|Des Winters"], "a": 0}])

ep(2, "A2", "گەشتێک بۆ سلێمانی", "Silêmanî yolculuğu|A trip to Silêmanî|Eine Reise nach Silêmanî", "Yolculuk ve geçmiş zaman|Travel and the past tense|Reisen und Vergangenheit",
 [("Juji", "ئازاد، هەفتەی ڕابردوو چوویت بۆ سلێمانی. گەشتەکە چۆن بوو؟", "Azad, geçen hafta Silêmanîye gittin. Yolculuk nasıldı?|Azad, you went to Silêmanî last week. How was the trip?|Azad, du warst letzte Woche in Silêmanî. Wie war die Reise?"),
  ("Azad", "زۆر خۆش بوو! بە پاس چووم. ڕێگاکە سێ کاتژمێری خایاند.", "Çok güzeldi! Otobüsle gittim. Yol üç saat sürdü.|It was great! I went by bus. The road took three hours.|Sehr schön! Ich fuhr mit dem Bus. Die Fahrt dauerte drei Stunden."),
  ("Juji", "لە سلێمانی چیت بینی؟", "Silêmanîde ne gördün?|What did you see in Silêmanî?|Was hast du in Silêmanî gesehen?"),
  ("Azad", "چووم بۆ بازاڕە کۆنەکە و پارکی ئازادی.", "Eski çarşıya ve Azadî Parkına gittim.|I went to the old bazaar and Azadî Park.|Ich war auf dem alten Basar und im Azadî-Park."),
  ("Azad", "ئێوارە چووینە سەر چیای گۆیژە. شارەکە لە سەرەوە زۆر جوان بوو.", "Akşam Goyje Dağına çıktık. Şehir yukarıdan çok güzeldi.|In the evening we went up Mount Goyje. The city looked beautiful from above.|Am Abend fuhren wir auf den Berg Goyje. Die Stadt war von oben wunderschön."),
  ("Juji", "چیت خوارد؟", "Ne yedin?|What did you eat?|Was hast du gegessen?"),
  ("Azad", "کەبابم خوارد و دۆم خواردەوە. زۆر بەتام بوو.", "Kebap yedim, ayran içtim. Çok lezzetliydi.|I ate kebab and drank ayran. It was delicious.|Ich habe Kebab gegessen und Ayran getrunken. Sehr lecker."),
  ("Juji", "لە کوێ مایتەوە؟", "Nerede kaldın?|Where did you stay?|Wo hast du übernachtet?"),
  ("Azad", "لە ماڵی هاوڕێیەکم مامەوە. ئەو شارەکەی پیشان دام.", "Bir arkadaşımın evinde kaldım. Bana şehri o gezdirdi.|I stayed at a friend's house. He showed me the city.|Ich wohnte bei einem Freund. Er hat mir die Stadt gezeigt."),
  ("Juji", "دووبارە دەچیتەوە؟", "Yine gidecek misin?|Will you go again?|Fährst du wieder hin?"),
  ("Azad", "بێگومان! بەهاری داهاتوو دەمەوێت بچم بۆ هەورامان.", "Elbette! Gelecek bahar Hewramana gitmek istiyorum.|Of course! Next spring I want to go to Hewraman.|Natürlich! Nächsten Frühling möchte ich nach Hewraman fahren.")],
 [["هەفتەی ڕابردوو", "geçen hafta|last week|letzte Woche"], ["گەشت", "yolculuk, gezi|trip|Reise"], ["پاس", "otobüs|bus|Bus"], ["بەتام", "lezzetli|tasty|lecker"], ["بێگومان", "elbette|of course|natürlich"]],
 [{"q": "Azad Silêmanîye nasıl gitti?|How did Azad travel to Silêmanî?|Wie reiste Azad nach Silêmanî?", "o": ["Otobüsle|By bus|Mit dem Bus", "Uçakla|By plane|Mit dem Flugzeug", "Taksiyle|By taxi|Mit dem Taxi"], "a": 0},
  {"q": "Akşam nereye çıktılar?|Where did they go in the evening?|Wohin gingen sie am Abend?", "o": ["Goyje Dağına|Up Mount Goyje|Auf den Berg Goyje", "Çarşıya|To the bazaar|Auf den Basar", "Sinemaya|To the cinema|Ins Kino"], "a": 0},
  {"q": "Azad nerede kaldı?|Where did Azad stay?|Wo übernachtete Azad?", "o": ["Arkadaşının evinde|At a friend's house|Bei einem Freund", "Otelde|In a hotel|Im Hotel", "Çadırda|In a tent|Im Zelt"], "a": 0}])

ep(3, "A2", "لە لای پزیشک", "Doktorda|At the doctor's|Beim Arzt", "Sağlık ve vücut|Health and the body|Gesundheit und Körper",
 [("Juji", "ئەمڕۆ لە نەخۆشخانەین. ڕۆژدا نەخۆشە.", "Bugün hastanedeyiz. Rojda hasta.|Today we are at the hospital. Rojda is ill.|Heute sind wir im Krankenhaus. Rojda ist krank."),
  ("Bijîşk", "سڵاو، چیتە؟ کوێت دێشێت؟", "Merhaba, neyin var? Neren ağrıyor?|Hello, what is wrong? Where does it hurt?|Hallo, was fehlt dir? Wo tut es weh?"),
  ("Rojda", "سەرم دێشێت و قوڕگیشم دێشێت.", "Başım ağrıyor, boğazım da ağrıyor.|My head hurts and my throat hurts too.|Mein Kopf tut weh und mein Hals auch."),
  ("Bijîşk", "لە کەیەوە؟", "Ne zamandan beri?|Since when?|Seit wann?"),
  ("Rojda", "لە دوێنێوە. شەو باش نەخەوتم.", "Dünden beri. Gece iyi uyuyamadım.|Since yesterday. I did not sleep well last night.|Seit gestern. Ich habe nachts schlecht geschlafen."),
  ("Bijîşk", "تات هەیە. سەرمات بووە.", "Ateşin var. Üşütmüşsün.|You have a fever. You have caught a cold.|Du hast Fieber. Du hast dich erkältet."),
  ("Bijîşk", "ئەم دەرمانە ڕۆژی سێ جار بخۆ و ئاو زۆر بخۆرەوە.", "Bu ilacı günde üç kez iç ve çok su iç.|Take this medicine three times a day and drink lots of water.|Nimm dieses Medikament dreimal täglich und trink viel Wasser."),
  ("Rojda", "دەتوانم بچم بۆ کار؟", "İşe gidebilir miyim?|Can I go to work?|Kann ich zur Arbeit gehen?"),
  ("Bijîşk", "نەخێر، دوو ڕۆژ لە ماڵەوە بمێنەوە و پشوو بدە.", "Hayır, iki gün evde kal ve dinlen.|No, stay at home for two days and rest.|Nein, bleib zwei Tage zu Hause und ruh dich aus."),
  ("Rojda", "باشە، زۆر سوپاس دکتۆر.", "Tamam, çok teşekkürler doktor.|OK, thank you very much, doctor.|Gut, vielen Dank, Frau Doktor."),
  ("Juji", "سەلامەت بیت، ڕۆژدا! کاتێک کەسێک نەخۆشە، دەڵێین: سەلامەت بیت.", "Geçmiş olsun, Rojda! Biri hasta olunca «selamet bît» deriz.|Get well, Rojda! When someone is ill, we say «selamet bît».|Gute Besserung, Rojda! Wenn jemand krank ist, sagen wir «selamet bît».")],
 [["نەخۆشخانە", "hastane|hospital|Krankenhaus"], ["دێشێت", "ağrıyor|it hurts|tut weh"], ["قوڕگ", "boğaz|throat|Hals"], ["تا", "ateş|fever|Fieber"], ["سەلامەت بیت", "geçmiş olsun|get well soon|gute Besserung"]],
 [{"q": "Rojdanın neresi ağrıyor?|What hurts Rojda?|Was tut Rojda weh?", "o": ["Başı ve boğazı|Head and throat|Kopf und Hals", "Midesi|Stomach|Bauch", "Ayağı|Foot|Fuß"], "a": 0},
  {"q": "İlacı günde kaç kez içecek?|How often should she take the medicine?|Wie oft soll sie das Medikament nehmen?", "o": ["Üç kez|Three times|Dreimal", "Bir kez|Once|Einmal", "İki kez|Twice|Zweimal"], "a": 0},
  {"q": "Doktor ne diyor?|What does the doctor say?|Was sagt die Ärztin?", "o": ["İki gün evde dinlen|Rest at home for two days|Zwei Tage ausruhen", "Hemen işe git|Go to work now|Sofort arbeiten", "Hastanede kal|Stay in hospital|Im Krankenhaus bleiben"], "a": 0}])

def strings():
    out = []
    for e in E:
        out.append(e["title"]); out += [l["t"] for l in e["lines"]]; out += [w[0] for w in e["words"]]
    return out

NAMES = ["hewlêr", "silêmanî", "kerkûk", "azad", "rojda", "berfîn", "newroz", "kurdî", "hewraman", "goyje", "azadî", "jujî", "erebî", "înglîzî"]
def fix(lat, sent):
    lat = lat.strip()
    for n in NAMES: lat = re.sub(r"(?<![\wçşêîû])" + n, n[0].upper() + n[1:], lat)
    lat = lat.replace("Jujî", "Juji").replace("û Azadîye", "û azadîye")
    if sent: lat = re.sub(r"(^|[.!?]\s+)([a-zçşêîû])", lambda m: m.group(1) + m.group(2).upper(), lat)
    return unicodedata.normalize("NFC", lat)

if len(sys.argv) > 1 and sys.argv[1] == "strings":
    open(D + "ckb_strings.txt", "w").write("\n".join(strings())); print(len(strings()))
else:
    lat = open(D + "ckb_lat.txt").read().rstrip("\n").split("\n"); assert len(lat) == len(strings()), (len(lat), len(strings()))
    it = iter(lat)
    for e in E:
        e["titleLat"] = fix(next(it), True)
        for l in e["lines"]: l["lat"] = fix(next(it), True)
        e["words"] = [[w, m, fix(next(it), False)] for w, m in e["words"]]
    json.dump({"episodes": E}, open(D + "ckb.json", "w"), ensure_ascii=False, indent=1)
    print(len(E), sum(len(e["lines"]) for e in E))
