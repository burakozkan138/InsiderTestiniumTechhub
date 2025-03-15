# Alışveriş Sepeti Uygulaması Hata Raporu

## Benim Gördüğüm Hatalar

İlk olarak uygulamayı açtım ve tam olarak ne işe yaradığını anlamaya çalıştım. Basit bir alışveriş sepeti uygulamasıydı.
Ürünleri "Sepete Ekle" butonuyla sepete ekledim ve stok miktarının azalmadığını, toplam fiyatın da yanlış hesaplandığını gördüm. 
Daha sonra ürünleri sepetten çıkardım ama stok miktarı yine de artmadı.

Ardından indirim kodu uygulamaya çalıştım. Geçersiz bir kod girince indirim uygulanmadı, bu doğruydu ama birkaç kez eklemeye çalıştığımda aynı şekilde hata mesajı birden fazla kez eklendi ve yan yana artmaya başladı. Doğru indirim kodu olan "INDIRIM10" kodunu uyguladığımda ise toplam fiyatın %10 azalması gerekirken, toplam fiyatın sadece %10'una düştüğünü fark ettim. Yani ters bir hesaplama yapılmıştı.

Kodlara bakmaya karar verdim ve hataları düzeltmeye çalıştım.

### 1. Stok Miktarı Doğru Güncellenmiyor

App class'ını incelediğimde, constructor içinde bir `ShoppingCart` nesnesi oluşturulduğunu gördüm. Sepete ürün ekleme işlemi `shoppingCart.addItem()` fonksiyonuyla yapılıyordu. Buradan `ShoppingCart` class'ına gittiğimde, `addItem` fonksiyonunun stok miktarını kontrol ettiğini fark ettim ama bir hata vardı:

**Hata:**
```javascript
if (product.stock <= quantity) { // < yerine <= kullanılmış
  throw new Error('Yetersiz stok!');
}
```
**Sorun:** Buradaki `<=` yanlış bir mantıksal kontrol. Bu şekilde stok miktarı kadar ekleme yapamayız. Ayrıca stoktan düşme işlemi unutulmuş.

**Düzeltme:**
```javascript
if (product.stock < quantity) {
  throw new Error('Yetersiz stok!');
}
product.stock -= quantity; // Stok azaltma eklendi
```
Bu düzeltme ile stok miktarı doğru şekilde kontrol edilecek ve ürün sepete eklendiğinde stok miktarı azalacaktır.

### 2. Toplam Fiyat Yanlış Hesaplanıyor

Sepete eklediğim ürünlerin fiyatlarında yanlış hesaplanıyordu. `calculateTotal` fonksiyonuna baktığımda sebebini anladım.

**Hata:**
```javascript
calculateTotal() {
    this.total = this.items.reduce((sum, item) => {
        return sum + item.price; // quantity çarpımı unutulmuş
    }, 0);
    
    if (this.discountApplied && this.total > 0) {
        this.total *= 0.1; // Yanlış indirim hesaplaması
    }
}
```
**Sorunlar:**
- `item.price` değerinin `item.quantity` ile çarpılması unutulmuş.
- İndirim uygulanırken %10'a düşürülmüş, oysa %10 indirim uygulanmalıydı.

**Düzeltme:**
```javascript
this.total = this.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
}, 0);

if (this.discountApplied && this.total > 0) {
    this.total *= 0.9; // %10 indirim için 0.9 ile çarpılmalı
}
```
Kod bloğu böyle güncellendiğinde toplam fiyat doğru şekilde hesaplanacak ve indirim uygulandığında %10 indirim yapılacaktır.

### 3. Sepetten Çıkartınca Stok Güncellenmiyor

Sepetten ürün çıkarttığımda stok miktarı artmıyordu. Bunun için `removeItem` fonksiyonuna baktığımda nedenini buldum.

**Hata:**
```javascript
if (product) {
    product.stock += 1; // Sabit artış, item.quantity kullanılmalı
}
```
**Sorun:** Stok miktarını sadece `1` arttırmak yerine `item.quantity` kadar arttırmalıyız.

**Düzeltme:**
```javascript
if (product) {
    product.stock += item.quantity;
}
window.app.renderProducts(); // Stok güncellemesi için render edilmeli
```
Bu düzeltme ile sepetten ürün çıkarıldığında stok miktarı doğru şekilde güncellenecektir.

### 4. Hata Mesajlarının Birikmesi

Geçersiz indirim kodu girdiğimde hata mesajlarının üst üste birikiyordu. Bunun için `showError` fonksiyonuna baktım.

**Hata:**
```javascript
document.getElementById('error-message').innerHTML += 'Geçersiz kod!';
```
**Sorun:** `+=` kullanıldığı için hata mesajı her seferinde ekleniyor.

**Düzeltme:**
```javascript
document.getElementById('error-message').innerHTML = 'Geçersiz kod!';
```
Bu düzeltme ile hata mesajları birikmeyecek ve her seferinde sadece bir hata mesajı gösterilecektir.

## Sonuç
Bu hataları düzelttiğimde uygulama daha düzgün çalışmaya başladı. Stok miktarı doğru şekilde güncelleniyor, toplam fiyatlar doğru hesaplanıyor ve hata mesajları birikmiyor. Artık uygulama kullanıcı dostu ve hatasız çalışıyor. Bu uygulama küçük bir alışveriş sepeti uygulaması olduğu için hatalar kolayca bulunup düzeltilebildi ve debugger gibi bir araca ihtiyaç duymadım. Daha büyük projelerde ise debugger kullanarak hataları bulmak daha kolay olur.