// Global ayarları yapılandırma
toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-bottom-left",
  timeOut: 3000, // 3 saniye
  extendedTimeOut: 1000,
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut"
};

// Global değişkenler
let allProducts = [];
let cartItems = [];
let currentPage = 1;
let productsPerPage = 8;
let isLoading = false;
let allProductsLoaded = false;
let currentProduct = null;

$(document).ready(function () {
  loadCartFromStorage();
  fetchProducts();

  // SEPET ICON EVENTLERI
  $('#cartButton').on('click', function (e) {
    e.preventDefault();
    updateCart();
    toggleCart();
  });

  $('#closeCart').on('click', function (e) {
    e.preventDefault();
    toggleCart(true); // forceClose parametresi
  });

  $(document).on('click', function (e) {
    if (!$(e.target).closest('.cart').length &&
      !$(e.target).closest('#cartButton').length &&
      $('.cart').hasClass('open')) {
      if (cartItems.length === 0) {
        toggleCart(true);
      }
    }
  });

  // SEPET ITEM EVENTLERI
  $('#cartItems').on('click', '.cart-item-remove', function () {
    const itemId = $(this).closest('.cart-item').data('id');
    removeFromCart(itemId);
  });

  $('#cartItems').on('click', '.cart-plus', function () {
    const itemId = $(this).data('id');
    updateCartItemQuantity(itemId, 1);
  });

  $('#cartItems').on('click', '.cart-minus', function () {
    const itemId = $(this).data('id');
    updateCartItemQuantity(itemId, -1);
  });

  // KUPON EVENTI
  $('.cart-coupon button').on('click', function () {
    const couponCode = $('.cart-coupon input').val().trim().toLowerCase();

    if (couponCode === 'indirim10') {
      applyCoupon('indirim10', 10);
      toastr.success('İndirim uygulandı: %10 indirim!');
    } else if (couponCode === 'indirim20') {
      applyCoupon('indirim20', 20);
      toastr.success('İndirim uygulandı: %20 indirim!');
    } else {
      toastr.error('Geçersiz kupon kodu!');
    }
  });

  // ODEME EVENTI
  $('#checkout').on('click', function () {
    if (cartItems.length > 0) {
      toastr.success('Ödeme işlemi başlatılıyor...');

      // Ödeme butonu animasyonu
      $(this).addClass('loading');

      // Burada normalde ödeme sayfasına yönlendirilir
      setTimeout(() => {
        $(this).removeClass('loading');
        alert('Ödeme sayfasına yönlendiriliyorsunuz!');
      }, 1500);
    } else {
      toastr.error('Sepetinizde ürün bulunmamaktadır!');
    }
  });

  // SEPET TEMIZLEME EVENTI
  $('#clearCart').on('click', function () {
    clearCart();
  });

  // ARAMA EVENTI
  $('#searchInput').on('keyup', function () {
    const searchTerm = $(this).val();
    filterProducts(searchTerm);
  });

  // URUN EVENTLERI
  $('#products').on('click', '.add-to-cart-btn', function () {
    const productCard = $(this).closest('.product-card');
    const productId = productCard.data('id');
    addToCart(productId);
  });

  $('#products').on('click', '.details-btn, .product-title, .product-image', function () {
    const productId = $(this).closest('.product-card').data('id');
    showProductModal(productId);
  });

  // BASA GERI DON BUTONU EVENTI
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $('#backToTop').addClass('visible');
    } else {
      $('#backToTop').removeClass('visible');
    }
  });

  $('#backToTop').click(function () {
    $('html, body').animate({ scrollTop: 0 }, 500);
    return false;
  });

  loadCartState();

  $(window).scroll(function () {
    // Sayfa sonuna yaklaşıldığında daha fazla ürün yükle
    if ($(window).scrollTop() + $(window).height() > $(document).height() - 400) {
      loadMoreProducts();
    }
  });

  // MODAL EVENTLERI
  $('.product-detail-modal .quantity-btn.plus').off('click').on('click', function () {
    let quantity = parseInt($('#modalProductQuantity').val());
    $('#modalProductQuantity').val(quantity + 1);
  });

  $('.product-detail-modal .quantity-btn.minus').off('click').on('click', function () {
    let quantity = parseInt($('#modalProductQuantity').val());
    if (quantity > 1) {
      $('#modalProductQuantity').val(quantity - 1);
    }
  });

  // Sepete ekle butonu
  $('#modalAddToCart').off('click').on('click', function () {
    if (currentProduct) {
      const quantity = parseInt($('#modalProductQuantity').val());
      addToCart(currentProduct.id, quantity);
    }
  });

  $('#modalAddToWishlist').off('click').on('click', function () {
    const button = $(this);
    if (button.hasClass('active')) {
      button.removeClass('active');
      toastr.info('Ürün favorilerden kaldırıldı');
    } else {
      button.addClass('active');
      toastr.success('Ürün favorilere eklendi');
    }
  });
});

// Fancybox
function showProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  currentProduct = product;

  $.fancybox.open({
    src: '#productModalTemplate',
    type: 'inline',
    opts: {
      beforeShow: function () {
        updateModalContent(product);
      },
      touch: false,
      smallBtn: true,
      toolbar: false,
      keyboard: true
    }
  });
}

// Modal içeriğini güncelle
function updateModalContent(product) {
  $('#modalProductImage').attr('src', product.image);
  $('#modalProductTitle').text(product.title);
  $('#modalProductPrice').text(`${product.price.toFixed(2)} TL`);
  $('#modalCategory').text(`Kategori: ${product.category}`);
  $('#modalDescription').text(product.description);
  $('#modalProductQuantity').val(1);

  // İndirim varsa göster
  if (product.originalPrice && product.originalPrice > product.price) {
    $('#modalOriginalPrice').text(`${product.originalPrice.toFixed(2)} TL`);
    const discount = Math.round((1 - (product.price / product.originalPrice)) * 100);
    $('#modalDiscountPercent').text(`%${discount}`);
    $('#modalOriginalPrice, #modalDiscountPercent').show();
  } else {
    $('#modalOriginalPrice, #modalDiscountPercent').hide();
  }

  let rating = 5; // Varsayılan değer
  let ratingCount = 0;

  if (product.rating) {
    if (typeof product.rating === 'object') {
      rating = product.rating.rate || 5;
      ratingCount = product.rating.count || 0;
    } else {
      rating = product.rating;
      ratingCount = product.ratingCount || 0;
    }
  }

  const stars = generateStarRating(rating);
  $('#modalProductRating').html(stars);
  $('#modalReviewCount').text(`(${ratingCount} değerlendirme)`);

  $('#modalProductThumbnails').empty();
  $('#modalProductThumbnails').append(`
      <div class="product-thumbnail active" data-image="${product.image}">
        <img src="${product.image}" alt="${product.title}">
      </div>
    `);
}

// Yıldız derecelendirme HTML'i oluştur
function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  let starsHtml = '';
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }

  if (halfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }

  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }

  return starsHtml;
}

function createProductCard(product) {
  const template = document.getElementById('productCardTemplate');
  const productCard = document.importNode(template.content, true).firstElementChild;

  productCard.dataset.id = product.id;

  const img = productCard.querySelector('.product-image img');
  img.src = product.image;
  img.alt = product.title;

  productCard.querySelector('.product-category').textContent = product.category;
  productCard.querySelector('.product-title').textContent = product.title;
  productCard.querySelector('.product-price').textContent = `${product.price.toFixed(2)} TL`;

  productCard.querySelector('.add-to-cart-btn').dataset.id = product.id;

  return $(productCard);
}

function fetchProducts() {
  $.ajax({
    url: "https://fakestoreapi.com/products",
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      allProducts = data;
      displayProducts(allProducts);

      // İlk sayfa yüklendikten sonra category ve sort dropdownları oluştur
      setupDropdowns();

      toastr.success(`${allProducts.length} ürün başarıyla yüklendi`);
    },
    error: function (error) {
      console.error('Ürünler yüklenirken hata oluştu:', error);
      toastr.error('Ürünleri yüklerken bir sorun oluştu. Lütfen sayfayı yenileyin.');

      $('#products').html(`
        <div class="error">
          <p>Ürünleri yüklerken bir sorun oluştu.</p>
          <button onclick="fetchProducts()">Tekrar Dene</button>
        </div>
      `);
    }
  });
}

function displayProducts(products) {
  $('#products').empty();
  currentPage = 1;

  // fake loading effect
  allProductsLoaded = false;

  const initialProducts = products.slice(0, productsPerPage);

  if (initialProducts.length === 0) {
    $('#products').html('<div class="no-products">Aradığınız kriterlere uygun ürün bulunamadı.</div>');
    return;
  }

  appendProducts(initialProducts);

  // İlk sayfadan sonra daha fazla ürün var mı kontrol et
  if (products.length <= productsPerPage) {
    allProductsLoaded = true;
  } else {
    currentPage = 2;
  }
}

// Ürün arama ve filtreleme (Ana sayfa)
function filterProducts(searchTerm) {
  searchTerm = searchTerm.toLowerCase().trim();

  if (searchTerm === '') {
    displayProducts(allProducts);
  } else {
    const filteredProducts = allProducts.filter(product =>
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );

    displayProducts(filteredProducts);

    if (filteredProducts.length === 0) {
      toastr.warning(`"${searchTerm}" ile ilgili ürün bulunamadı`);
    } else if (filteredProducts.length < 5) {
      toastr.info(`"${searchTerm}" için ${filteredProducts.length} ürün bulundu`);
    }
  }
}

// Sepeti göster/gizle
function toggleCart(forceClose = false) {
  if (forceClose) {
    $('.cart').removeClass('open');
    localStorage.setItem('cartOpen', 'false');
    return;
  }

  if ($('.cart').hasClass('open')) {
    if (cartItems.length > 0) {
      return;
    } else {
      $('.cart').removeClass('open');
      localStorage.setItem('cartOpen', 'false');
    }
  } else {
    $('.cart').addClass('open');
    localStorage.setItem('cartOpen', 'true');
  }
}

// Sepete ürün ekleme
function addToCart(productId, quantity = 1) {
  const product = allProducts.find(p => p.id === productId);

  if (!product) return;

  const existingItem = cartItems.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cartItems.push({
      ...product,
      quantity: quantity
    });
  }

  updateCart();
  saveCartToStorage();

  $('.cart').addClass('open');
  localStorage.setItem('cartOpen', 'true');
  toastr.success(`${product.title} sepete ${quantity} adet eklendi`);
}

// Sepetten ürün çıkarma
function removeFromCart(productId) {
  const item = cartItems.find(item => item.id === productId);
  if (!item) return;

  const itemName = item.title || 'Ürün';
  const $cartItem = $(`.cart-item[data-id="${productId}"]`);

  $cartItem.addClass('removing');

  setTimeout(() => {
    cartItems = cartItems.filter(item => item.id !== productId);
    updateCart();
    saveCartToStorage();

    if (cartItems.length === 0) {
      localStorage.setItem('cartOpen', 'false');
    }

    toastr.info(`${itemName} sepetten kaldırıldı`);
  }, 300);
}

// Sepeti tamamen temizleme
function clearCart() {
  if (cartItems.length === 0) {
    toastr.info('Sepetiniz zaten boş');
    return;
  }

  $('#cartItems .cart-item').addClass('removing');

  setTimeout(() => {
    cartItems = [];
    updateCart();
    localStorage.removeItem('cartItems');
    localStorage.removeItem('activeCoupon'); // Kupon kodunu da temizle

    localStorage.setItem('cartOpen', 'false');
    toastr.success('Sepetiniz temizlendi');
  }, 300);
}

// Sepeti güncelleme
function updateCart() {
  const cartItemsContainer = $('#cartItems');
  cartItemsContainer.empty();
  let total = 0;
  let itemCount = 0;
  let shippingFee = 15.00; // Kargo ücreti

  // Sepet sayacı güncelleme
  $('.cart-count').text(itemCount);

  if (cartItems.length === 0) {
    cartItemsContainer.html(`
          <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <p>Sepetiniz boş</p>
            <button class="continue-shopping">Alışverişe Devam Et</button>
          </div>`);

    $('.continue-shopping').on('click', function () {
      toggleCart();
    });

    // Sepet boşsa toplam 0
    $('#cartTotal').text('0.00');
    $('.cart-count').text('0');
    $('.shipping').text('0.00 TL');
    $('.subtotal').text('0.00 TL');
    $('.discount').hide();
    $('.progress-fill').css('width', '0%');
    $('.progress-text').html('Ücretsiz kargo için <strong>200.00 TL</strong> daha harcayın!');

    return;
  }

  cartItems.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    itemCount += item.quantity;

    const cartItem = $(`
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">
          <a href="#" class="cart-item-link" onclick="showProductModal(${item.id}); return false;">
            <img src="${item.image}" alt="${item.title}">
          </a>
        </div>
        <div class="cart-item-details">
          <a href="#" class="cart-item-title" onclick="showProductModal(${item.id}); return false;">${item.title}</a>
          <div class="item-price-info">
            <span class="cart-item-price">${item.price.toFixed(2)} TL</span>
            <div class="cart-item-quantity">
              <button class="quantity-btn cart-minus" data-id="${item.id}"><i class="fas fa-minus"></i></button>
              <span>${item.quantity}</span>
              <button class="quantity-btn cart-plus" data-id="${item.id}"><i class="fas fa-plus"></i></button>
            </div>
          </div>
          <div class="cart-item-subtotal">
            <span>Toplam: ${subtotal.toFixed(2)} TL</span>
          </div>
        </div>
        <button class="cart-item-remove" title="Ürünü Kaldır">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `);

    cartItemsContainer.append(cartItem);
  });

  let subtotalAmount = total;
  let grandTotal = total;

  $('.subtotal').text(`${subtotalAmount.toFixed(2)} TL`);
  $('.cart-count').text(itemCount);

  // Kargo ücreti güncelleme
  if (total >= 200) {
    $('.progress-fill').css('width', '100%');
    $('.progress-text').html('Ücretsiz kargo <strong>kazandınız!</strong>');
    $('.shipping').text('0.00 TL');
    shippingFee = 0; // Ücretsiz kargo
  } else {
    const remaining = 200 - total;
    const percentage = (total / 200) * 100;
    $('.progress-fill').css('width', `${percentage}%`);
    $('.progress-text').html(`Ücretsiz kargo için <strong>${remaining.toFixed(2)} TL</strong> daha harcayın!`);
    $('.shipping').text(`${shippingFee.toFixed(2)} TL`);
    grandTotal += shippingFee;
  }

  // İndirim uygulaması
  const activeCoupon = JSON.parse(localStorage.getItem('activeCoupon'));
  let discount = 0;

  if (activeCoupon && total > 0) {
    discount = (total * activeCoupon.discount) / 100;
    $('.discount').show();
    $('.discount-amount').text(`-${discount.toFixed(2)} TL (${activeCoupon.code})`);
    grandTotal -= discount;
  } else if (total > 100) {
    discount = total * 0.05;
    $('.discount').show();
    $('.discount-amount').text(`-${discount.toFixed(2)} TL`);
    grandTotal -= discount; 
  } else {
    $('.discount').hide();
  }

  // Genel toplam güncelleme (subtotal + shipping - discount)
  $('#cartTotal').text(grandTotal.toFixed(2));
}

function updateCartItemQuantity(productId, change) {
  const item = cartItems.find(item => item.id === productId);

  if (!item) return;
  const newQuantity = item.quantity + change;

  if (newQuantity < 1) {
    // Miktar 0'a düşerse ürünü sepetten kaldır
    removeFromCart(productId);
    return;
  }

  item.quantity = newQuantity;
  updateCart();
  saveCartToStorage();

  if (change > 0) {
    toastr.info(`${item.title} miktarı artırıldı`);
  } else {
    toastr.info(`${item.title} miktarı azaltıldı`);
  }
}

// Sepeti local storage'a kaydetme
function saveCartToStorage() {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));

  if (cartItems.length > 0) {
    localStorage.setItem('cartOpen', 'true');
  }
}

// Local storage'dan sepeti yükleme
function loadCartFromStorage() {
  const storedCart = localStorage.getItem('cartItems');
  if (storedCart) {
    cartItems = JSON.parse(storedCart);
    updateCart();
  }
}

// Sayfa yüklendiğinde sepet durumunu kontrol etme
function loadCartState() {
  const cartOpen = localStorage.getItem('cartOpen') === 'true';

  // Sepette ürün varsa veya localStorage'da sepet açık olarak kaydedilmişse aç
  if (cartItems.length > 0 || cartOpen) {
    $('.cart').addClass('open');
  } else {
    $('.cart').removeClass('open');
  }
}

function setupDropdowns() {
  const categories = [...new Set(allProducts.map(product => product.category))];

  $('#categoryFilters').empty();
  $('#categoryFilters').append('<a href="#" data-category="all" class="active"><i class="fas fa-layer-group"></i> Tümü</a>');

  categories.forEach(category => {
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1); // ilk karakteri buyuk yap
    $('#categoryFilters').append(`
      <a href="#" data-category="${category}"><i class="fas fa-tag"></i> ${formattedCategory}</a>
    `);
  });

  $('#categoryDropdownBtn').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('#categoryFilters').toggleClass('show');
    $('#sortOptions').removeClass('show');
  });

  $('#sortDropdownBtn').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('#sortOptions').toggleClass('show');
    $('#categoryFilters').removeClass('show');
  });

  $(document).click(function () {
    $('.dropdown-content').removeClass('show');
  });

  $('.dropdown-content').click(function (e) {
    e.stopPropagation();
  });

  $('#categoryFilters').on('click', 'a', function (e) {
    e.preventDefault();
    const category = $(this).data('category');

    $('#categoryFilters a').removeClass('active');
    $(this).addClass('active');

    $('#categoryName').text($(this).text());

    $('#categoryFilters').removeClass('show');

    filterProductsByCategory(category);
  });

  $('#sortOptions').on('click', 'a', function (e) {
    e.preventDefault();
    const sortBy = $(this).data('sort');

    $('#sortOptions a').removeClass('active');
    $(this).addClass('active');

    const sortText = $(this).text().trim();
    $('#sortDropdownBtn').html(`<i class="fas fa-sort"></i> ${sortText} <span class="dropdown-arrow">▼</span>`);

    $('#sortOptions').removeClass('show');
    sortProducts(sortBy);
  });
}

function filterProductsByCategory(category) {
  window.currentFilter = category;

  const filteredProducts = getFilteredProducts();
  displayProducts(filteredProducts);
}

function sortProducts(sortBy) {
  window.currentSort = sortBy;

  const filteredProducts = getFilteredProducts();
  displayProducts(filteredProducts);
}


function applyCoupon(code, discountPercentage) {
  localStorage.setItem('activeCoupon', JSON.stringify({
    code: code,
    discount: discountPercentage
  }));

  updateCart();
  $('.cart-coupon input').val('');
}

function loadMoreProducts() {
  if (isLoading || allProductsLoaded) return;

  isLoading = true;

  // LOAD MORE SPINNER
  $('#products').append('<div id="loadingMore" class="loading-more"><div class="spinner"></div><p>Daha fazla ürün yükleniyor...</p></div>');

  // fake pagination yapılacak
  setTimeout(() => {
    const filteredProducts = getFilteredProducts(); // Mevcut filtre kriterlerine göre ürünleri al

    // Pagination için sınırlar
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;

    // Bu sayfada gösterilecek ürünler
    const pageProducts = filteredProducts.slice(start, end);

    // Yükleme göstergesini kaldır
    $('#loadingMore').remove();

    // Ürünleri göster
    if (pageProducts.length > 0) {
      appendProducts(pageProducts);
      currentPage++;

      if (end >= filteredProducts.length) {
        allProductsLoaded = true;
        // Son ürünler eklendikten SONRA "tüm ürünler yüklendi" mesajını ekle
        setTimeout(() => {
          $('#products').append('<div class="all-loaded">Tüm ürünler yüklendi</div>');
        }, 100);
      }
    } else {
      allProductsLoaded = true;
      $('#products').append('<div class="all-loaded">Tüm ürünler yüklendi</div>');
    }

    isLoading = false;
  }, 800);
}

function getFilteredProducts() {
  const currentCategory = window.currentFilter || 'all';
  const searchTerm = $('#searchInput').val().toLowerCase().trim();

  let filteredList = [...allProducts];
  if (currentCategory !== 'all') {
    filteredList = filteredList.filter(product => product.category.toLowerCase() === currentCategory.toLowerCase());
  }

  // Arama filtresi
  if (searchTerm !== '') {
    filteredList = filteredList.filter(product =>
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }

  // Sıralama uygula
  const currentSort = window.currentSort || 'default';
  switch (currentSort) {
    case 'price-asc':
      filteredList.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredList.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      filteredList.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'name-desc':
      filteredList.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }

  return filteredList;
}

function appendProducts(products) {
  products.forEach(product => {
    const productCard = createProductCard(product);
    $('#products').append(productCard);
  });
}