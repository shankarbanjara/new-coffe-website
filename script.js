/* Shared JS: cart + i18n + nav helpers */

// --------- Simple i18n ---------
const I18N_KEY = "hch_lang";
const DEFAULT_LANG = "ja";

const t = {
  en: {
    "nav.home":"Home",
    "nav.menu":"Menu",
    "nav.about":"About",
    "nav.location":"Location",
    "nav.contact":"Contact",
    "nav.cart":"Cart",
    "hero.headline_1":"Welcome to",
    "hero.headline_2":"Himalayan Coffee House",
    "hero.sub":"Where Mountain Peaks Meet Perfect Brews in the Heart of Kathmandu",
    "hero.cta.menu":"Explore Our Menu",
    "hero.cta.find":"Find Us in Thamel",
    "menu.header":"Our Menu",
    "menu.sub":"Discover authentic Nepali flavors blended with world-class coffee craftsmanship",
    "cart.title":"Your Cart",
    "cart.empty":"Your cart is empty.",
    "cart.item":"Item",
    "cart.price":"Price",
    "cart.qty":"Qty",
    "cart.subtotal":"Subtotal",
    "cart.total":"Total",
    "cart.clear":"Clear Cart",
    "cart.checkout":"Checkout",
    "cart.continue":"Continue Shopping",
  },
  ja: {
    "nav.home":"ホーム",
    "nav.menu":"メニュー",
    "nav.about":"私たちについて",
    "nav.location":"アクセス",
    "nav.contact":"お問い合わせ",
    "nav.cart":"カート",
    "hero.headline_1":"ようこそ",
    "hero.headline_2":"ヒマラヤン・コーヒー・ハウス",
    "hero.sub":"カトマンズの中心で、山の恵みをそのまま一杯に",
    "hero.cta.menu":"メニューを見る",
    "hero.cta.find":"場所を確認",
    "menu.header":"メニュー",
    "menu.sub":"本格的なネパールの味わいと世界基準のクラフトを一杯に",
    "cart.title":"ショッピングカート",
    "cart.empty":"カートは空です。",
    "cart.item":"商品名",
    "cart.price":"価格",
    "cart.qty":"数量",
    "cart.subtotal":"小計",
    "cart.total":"合計",
    "cart.clear":"カートを空にする",
    "cart.checkout":"お会計へ",
    "cart.continue":"買い物を続ける",
  }
};

function getLang(){
  return localStorage.getItem(I18N_KEY) || DEFAULT_LANG;
}
function setLang(lang){
  localStorage.setItem(I18N_KEY, lang);
  applyTranslations();
}

function applyTranslations(){
  const lang = getLang();
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const txt = t[lang]?.[key] || t["en"][key] || el.textContent;
    el.textContent = txt;
  });
  // For placeholders/titles if needed
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    const key = el.getAttribute("data-i18n-placeholder");
    const txt = t[lang]?.[key] || t["en"][key] || "";
    el.setAttribute("placeholder", txt);
  });
}

// --------- Cart logic (localStorage) ---------
const CART_KEY = "hch_cart";

function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount(){
  const count = getCart().reduce((n, it)=> n + (it.qty||1), 0);
  document.querySelectorAll("#cart-count").forEach(el=> el.textContent = count);
}

function addToCart(item){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === item.id);
  if (idx > -1){
    cart[idx].qty += item.qty || 1;
  } else {
    cart.push({
      id: item.id, 
      name: item.name, 
      price: item.price, 
      image: item.image, // Store image URL
      qty: item.qty||1
    });
  }
  saveCart(cart);
  showToast(`${item.name} をカートに追加しました`);
}

function removeFromCart(id){
  let cart = getCart();
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
}

function updateQty(id, delta){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx > -1){
    cart[idx].qty = Math.max(1, cart[idx].qty + delta);
    saveCart(cart);
    renderCart();
  }
}

function clearCart(){
  saveCart([]);
  renderCart();
}

function currency(n){ return `रू ${Number(n).toLocaleString()}`; }

// --------- UI wiring ---------
function wireAddToCartButtons(){
  document.querySelectorAll("[data-add-to-cart]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      const price = parseFloat(btn.getAttribute("data-price"));
      const image = btn.closest('.card-hover').querySelector('img')?.src || '';
      addToCart({id, name, price, image, qty:1});
    });
  });
}

// Cart page render - UPDATED TO SHOW IMAGES
function renderCart(){
  const container = document.querySelector("#cart-rows");
  if (!container) return;
  const cart = getCart();

  const emptyRow = document.querySelector("#cart-empty");
  if (cart.length === 0){
    if (emptyRow) emptyRow.style.display = 'block';
    container.innerHTML = "";
    document.querySelector("#cart-total").textContent = currency(0);
    return;
  } else {
    if (emptyRow) emptyRow.style.display = 'none';
  }

  container.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    const sub = item.price * item.qty;
    total += sub;
    const row = document.createElement("tr");
    row.className = "border-b";
    row.innerHTML = `
      <td class="py-4">
        <div class="flex items-center gap-3">
          <img src="${item.image}" alt="${item.name}" class="cart-product-image">
          <span>${item.name}</span>
        </div>
      </td>
      <td class="py-4">${currency(item.price)}</td>
      <td class="py-4">
        <div class="inline-flex items-center border rounded-lg overflow-hidden">
          <button class="px-3 py-1 hover:bg-gray-100" data-action="dec">-</button>
          <span class="px-4">${item.qty}</span>
          <button class="px-3 py-1 hover:bg-gray-100" data-action="inc">+</button>
        </div>
      </td>
      <td class="py-4 font-semibold">${currency(sub)}</td>
      <td class="py-4">
        <button class="text-red-600 hover:underline" data-action="remove">Remove</button>
      </td>
    `;
    row.querySelector("[data-action='dec']").addEventListener("click", ()=> updateQty(item.id, -1));
    row.querySelector("[data-action='inc']").addEventListener("click", ()=> updateQty(item.id, +1));
    row.querySelector("[data-action='remove']").addEventListener("click", ()=> removeFromCart(item.id));
    container.appendChild(row);
  });
  document.querySelector("#cart-total").textContent = currency(total);
}

// --------- Toast feedback ---------
let toastTimer = null;
function showToast(message){
  let el = document.querySelector("#toast");
  if (!el){
    el = document.createElement("div");
    el.id = "toast";
    el.className = "fixed left-1/2 -translate-x-1/2 bottom-6 bg-black text-white px-4 py-3 rounded-lg shadow-lg opacity-0 transition-opacity";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.style.opacity = "0", 1500);
}

// --------- Lang switcher wiring ---------
function wireLangSwitcher(){
  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
  });
}

// --------- Fixed Navigation ---------
function makeNavFixed() {
  const nav = document.querySelector('nav');
  if (nav && !nav.classList.contains('fixed-nav')) {
    nav.classList.add('fixed-nav');
  }
}

// --------- On load ---------
document.addEventListener("DOMContentLoaded", () => {
  // init lang
  if (!localStorage.getItem(I18N_KEY)) setLang(DEFAULT_LANG);
  applyTranslations();
  updateCartCount();
  wireLangSwitcher();
  wireAddToCartButtons();
  renderCart();
  makeNavFixed(); // Make navigation fixed
});

// Enhanced translation function
function applyTranslations(){
  const lang = getLang();
  
  // Translate all static elements
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const txt = t[lang]?.[key] || t["en"][key] || el.textContent;
    el.textContent = txt;
  });
  
  // Update cart items names if they exist
  updateCartItemTranslations(lang);
}

function updateCartItemTranslations(lang) {
  const cart = getCart();
  cart.forEach(item => {
    // If item has a translation key, update it
    if (item.translationKey) {
      item.name = t[lang]?.[item.translationKey] || t["en"][item.translationKey] || item.name;
    }
  });
  saveCart(cart);
  renderCart();
}