import { products } from "./products.js";

const CART_STORAGE_KEY = "shop-cart";

// Loads saved cart entries, falling back to an empty cart if storage is unavailable or invalid.
function loadCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch {
    return [];
  }
}

// Persists the current cart contents in local storage.
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export const cart = loadCart();

// Validates a product, adds it to the cart, and rolls back if persistence fails.
export function addToCart(productName) {
  const foundProduct = products.find(
    (product) => product.productName === productName,
  );

  if (!foundProduct) {
    throw new Error("We could not find that product.");
  }

  if (!foundProduct.inStock) {
    throw new Error(`${foundProduct.productName} is currently out of stock.`);
  }

  cart.push(foundProduct);

  try {
    saveCart();
  } catch {
    cart.pop();
    throw new Error("We could not save your cart. Please try again.");
  }
}

// Removes one cart entry by index and restores it if saving the change fails.
export function removeFromCart(index) {
  if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
    throw new Error("That cart item is no longer available.");
  }

  const [removedItem] = cart.splice(index, 1);

  try {
    saveCart();
  } catch {
    cart.splice(index, 0, removedItem);
    throw new Error("We could not update your cart. Please try again.");
  }
}
