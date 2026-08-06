# Evrensel 3D Render Pipeline

Web ve Capacitor mobil kabuğu aynı React katmanını kullanır. Görsel ortam WebGL2 ile başlar; WebGPU capability detection ile opsiyonel kalır. WebGL2 olmayan cihazda semantik 2D arayüz korunur.

## Kare politikası

1. Canvas ilk layout ve resize sonrasında tek kare üretir.
2. Pointer, resize ve görünürlük değişimi render döngüsünü uyandırır.
3. Son etkileşimden 900 ms sonra döngü durur.
4. Sekme görünür değilse requestAnimationFrame iptal edilir.
5. Mobil devicePixelRatio en fazla 1, masaüstü 1.5 ile sınırlandırılır.
6. Procedural shader model ve texture yükleme maliyetini ortadan kaldırır.
7. prefers-reduced-motion aktifse animasyon zamanı sabitlenir.

## Sahne sözleşmesi

- UI canvas üzerinde semantik HTML olarak kalır.
- Canvas pointer-events none ile etkileşimi çalmaz.
- Renk tek başına bilgi taşımaz; metin ve aria açıklaması korunur.
- Uzun hukuki metinler WebGL içine gömülmez; seçilebilir HTML kalır.
- WebGL sahnesi auth, belge veya tutanak yüklemesini bloke etmez.

## Performans

Masaüstünde aktif etkileşim sırasında 60 FPS hedeflenir. Mobilde düşük DPR, low-power context, reduced-motion ve idle sleep kullanılır. Ağır GLTF/texture eklenirse lazy-load ve dispose zorunludur.
