# Hukuk Asistanı — Premium UI/UX Sistemi

## Tasarım yönü

“Sessiz otorite”: mahkeme ciddiyetini, modern bir çalışma aracının açıklığıyla birleştirir. Görsel yoğunluk değil; hiyerarşi, güven ve bir sonraki adım öne çıkar.

## Renk tokenları

- ink-950: #0B0F14 — ana metin ve gece yüzey
- navy-900: #111827 — uygulama shell’i
- paper-50: #F8FAFC — belge yüzeyi
- gold-500: #C9A227 — premium vurgu, karar ve otorite
- blue-500: #2563EB — aksiyon ve bağlantı
- emerald-600: #059669 — doğrulanmış/tamamlandı
- amber-600: #D97706 — inceleme gerekli
- red-600: #DC2626 — risk, ihlal, kritik hata

Renk tek başına anlam taşımaz; her durum ikon, metin ve aria-label ile tekrarlanır.

## Tipografi ve akış

- Başlıklar: serif karakter, kısa ve ölçülü.
- Arayüz metni: sistem sans-serif; gövde 15–16px, satır yüksekliği 1.55.
- Kaynak ve metadata: 11–12px, yüksek kontrast.
- Mobilde yatay scroll yerine kart/accordion; uzun akışlarda sticky sonraki-adım çubuğu.
- Ana akış: Dosya seç → durum özeti → AI çalışma alanı → kaynak kontrolü → belge/tutanak → insan onayı → dışa aktar.

Her ekranda tek bir birincil CTA bulunur. Yıkıcı eylemler geri alınabilir veya ikinci onay ister.

## Duruşma salonu

Sahne yalnızca dekor değildir: kürsü, taraflar, zabıt kâtibi, bağlantı durumu ve celse fazı gerçek durumu yansıtır. Animasyon yalnızca canlı veri veya işlem değişimini gösterir; sahte canlı göstergeler kullanılmaz.

## Erişilebilirlik ve mobil

- Dokunma hedefleri minimum 44px.
- Klavye odağı her modal ve panelde görünür.
- prefers-reduced-motion için animasyonlar sadeleşir.
- Kontrast WCAG AA hedefinde.
- Hata metni input’a aria-describedby ile bağlanır.
- Duruşma filtreleri klavye ve ekran okuyucu ile erişilebilir.

## Mikro etkileşimler

- Kaynak bulundu: kısa yeşil doğrulama + kaynak sayısı.
- Kaynak bulunamadı: amber uyarı + neden kesin konuşulamadığı.
- Belge yükleme: yükleniyor → taranıyor → analiz edildi → inceleme gerekli.
- Duruşma: her yeni turn için kısa giriş animasyonu; reduced-motion’da animasyon yok.
- Export: indirme başladı/bitti durumu; başarısızlıkta yeniden dene.
