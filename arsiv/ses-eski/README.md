# Eski ses kayıtları (arşiv)

Uygulamada kullanılmıyor; geri dönmek istenirse diye saklanıyor.

- `dersler-kurdishtts/`: Ülgen'den önceki ders sesleri (Kurdish TTS), 1.650 kayıt.
  Geri dönmek için: bu klasördeki `.mp3` dosyalarını `assets/audio/` içine, `audioMap.ts` dosyasını `src/content/audioMap.ts` yerine kopyala.
- `podcast-kurdishtts/`: podcastin ilk sesleri (Kurdish TTS, 3 ses). `.json` dosyaları satır zamanlarıdır.
- `podcast-ulgen-yunus-donusturme/`: podcastin ikinci sesleri (Kurdish TTS telaffuzu, ElevenLabs ile Ülgen / Yunus C sesine dönüştürülmüş).

Podcast seslerini geri koymak için mp3'leri gh-pages dalındaki `pod/` klasörüne, satır zamanlarını
`tools/podcast/build.py` ile `podcasts.json`a işle.
