// Kullanıcıdan bilgi alma
const name = prompt('İsminizi girin:');
const age = prompt('Yaşınızı girin:');
const job = prompt('Mesleğinizi girin:');

const user = {
  name,
  age,
  job,
};

console.log("Kullanıcı bilgileri: ", user);

// Sepet ve ürünler dizisi
let basket = [];

// Ürün ekleme fonksiyonu
function addProductToBasket(name, price) {
  basket.push({ name, price });
  console.log(`${name} ürünü sepete eklendi. Fiyatı: ${price} TL`);
}


// sonsuz döngü ile ürün ekleme
while (true) {
  const name = prompt('Eklemek istediğiniz ürünün adını girin (Çıkmak için "q"):');
  if (name.toLowerCase() === 'q') break;

  const price = parseFloat(prompt('Ürünün fiyatını girin:'));
  if (!isNaN(price)) {
    addProductToBasket(name, price);
  } else {
    console.log('Geçerli bir fiyat giriniz.');
  }
}

// Sepeti listeleme fonksiyonu
function listBasket() {
  console.log('Sepetiniz:');
  basket.forEach((item, index) => {
    console.log(`${index + 1}. Ürün: ${item.name}, Fiyat: ${item.price} TL`);
  });

  const total = basket.reduce((sum, item) => sum + item.price, 0);
  console.log(`Toplam fiyat: ${total} TL`);
}

listBasket();