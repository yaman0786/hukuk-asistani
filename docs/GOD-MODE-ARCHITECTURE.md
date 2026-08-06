# Hukuk Asistanı — Üretim Mimarisi

## Ürün ilkesi

Bu ürün hukuki karar veren bir sistem değil; avukatın araştırma, dosya hazırlama ve duruşma provası işlerini hızlandıran, her iddiasını izlenebilir kaynağa bağlayan bir çalışma platformudur. “Sıfır halüsinasyon” pazarlama vaadi olarak kullanılmaz. Bunun yerine kaynak kapsamı, güven seviyesi, belirsizlik ve insan onayı ürünün görünür parçalarıdır.

## Katmanlar

Mobil/Web UI → TanStack Start / Vercel server routes → Supabase Auth/Postgres/pgvector/Storage/Realtime → resmî hukuk kaynakları.

Server katmanı auth, rate limit, dosya erişimi, belge çıkarma ve AI orkestrasyonunu yönetir. Supabase tarafında RLS, storage erişim policy’leri ve audit log zorunludur.

## RAG doğruluk sözleşmesi

1. Kullanıcı metni normalize edilir; embedding isteği sunucu tarafında ve timeout ile yapılır.
2. Arama sonucu source_id, kaynak türü, madde/karar bilgisi, sürüm ve benzerlik skoru ile taşınır.
3. Model yalnızca retrieved metinle desteklenebilen iddiaları kesin dille kurabilir.
4. Kaynak yoksa madde/karar numarası, süre, parasal tutar ve başarı ihtimali uydurulamaz.
5. Cevap sonrası validator; kaynak etiketi olmayan özgül hukuki iddiaları “doğrulama gerekli” olarak işaretler.

## Belge pipeline

upload → MIME/magic-byte doğrulama → malware scan → encrypted storage → text extraction → page/paragraph chunking → metadata → embedding → RLS-protected vector search

Belge içeriği prompt talimatı olarak değil, güvenilmeyen delil/bağlam olarak ele alınır. Dosya adı ve belge metni sistem talimatlarını geçersiz kılamaz.

## Canlı duruşma

- Ses: WebRTC peer connection; signaling Supabase Realtime.
- STT/TTS: sağlayıcı adaptörü arayüzü; ana uygulama sağlayıcıya bağımlı değildir.
- Metin tutanağı: olay sıralı, idempotent turn ID ile saklanır.
- Roller: hâkim, savcı, karşı taraf, vekil; her rolün izinli eylemi server-side kontrol edilir.
- AI ajanları paralel konuşmaz; celse yöneticisi tek bir turn scheduler ile sırayı belirler.
- Ses kayıtları opt-in, süre sınırlı ve silinebilir olmalıdır.

## Güvenlik

- service_role ve AI anahtarları yalnızca server runtime’da.
- Supabase public schema tablolarında RLS zorunlu.
- Yetkilendirme user_metadata ile değil, ekip üyeliği ve server-side policy ile yapılır.
- Storage path kullanıcı/ekip/dosya hiyerarşisiyle namespaced; doğrudan public URL yok.
- AES-256 at-rest ve TLS in-transit sağlayıcı seviyesinde; hassas alanlar ayrıca envelope encryption ile korunur.
- Paylaşım linkleri kısa ömürlü, iptal edilebilir, audit log’lu ve varsayılan olarak salt-okunur.

## Üretim kapıları

- AI yanıt p95: ilk token için 8 saniye hedefi.
- RAG başarısızlığı: cevap kesilmez; kullanıcıya kaynak bulunamadığı görünür.
- Kritik işlemler: upload, export, share, delete, verdict için audit event.
- Hata ekranı olay kodu üretir; gizli veri loglanmaz.
- npm test, npm run lint ve npm run build birlikte geçmeden yayın yapılmaz.
