import { products } from "./products.js";

// Use one consistent local-storage key whenever the cart is loaded or saved.
const CART_STORAGE_KEY = "shop-cart";

// Loads the cart from local storage and returns a clean array of cart entries.
function loadCart() {
  try {
    // localStorage stores strings, so parse the saved JSON back into values.
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];

    // Do not process values that are not an array of cart entries.
    if (!Array.isArray(parsedCart)) {
      return [];
    }

    // Build a clean cart while skipping malformed entries and merging
    // duplicate product names into a single entry with a combined quantity.
    return parsedCart.reduce((items, item) => {
      if (!item || typeof item.productName !== "string") {
        return items;
      }

      // Old saved cart entries may not have quantity yet; treat those as one.
      const quantity =
        Number.isInteger(item.quantity) && item.quantity > 0
          ? item.quantity
          : 1;
      const existingItem = items.find(
        (cartItem) => cartItem.productName === item.productName,
      );

      if (existingItem) {
        // Preserve one row per product and add this entry's units to it.
        existingItem.quantity += quantity;
      } else {
        // Copy the saved product fields and store its normalized quantity.
        items.push({ ...item, quantity });
      }

      return items;
    }, []);
  } catch {
    // Invalid JSON or a storage access error means there is no usable saved cart.
    return [];
  }
}

// Saves the current cart state to local storage. If saving fails, the in-memory
// cart is unchanged and the error is propagated to the caller.
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Initialize the shared cart once so importing modules use the saved state.
export const cart = loadCart();

/// Adds a product to the cart by its name. If the product is not found in the
/// catalog or is out of stock, throws an error. If saving the cart fails, the
/// in-memory cart is restored to its previous state and a new error is thrown.
export function addToCart(productName) {
  // Only allow products that are in the catalog to be added to the cart.
  const foundProduct = products.find(
    (product) => product.productName === productName,
  );

  if (!foundProduct) {
    throw new Error("We could not find that product.");
  }

  // Do not allow out-of-stock products to be added to the cart. The UI should
  // prevent this, but the cart module is the final authority on what can be added.
  if (!foundProduct.inStock) {
    throw new Error(`${foundProduct.productName} is currently out of stock.`);
  }

  // Remember the existing row and quantity so a failed save can be undone.
  const existingItem = cart.find((item) => item.productName === productName);
  const originalQuantity = existingItem?.quantity;

  if (existingItem) {
    // Keep one entry for this product and increase its unit count.
    existingItem.quantity += 1;
  } else {
    // Copy the catalog product instead of modifying the shared API object.
    cart.push({ ...foundProduct, quantity: 1 });
  }

  try {
    // Save the updated cart to local storage. If this fails, the catch block
    // will restore the previous in-memory cart state and throw a new error.
    saveCart();
  } catch {
    // If saving fails, restore the previous cart state and report the failure.
    if (existingItem && originalQuantity !== undefined) {
      existingItem.quantity = originalQuantity;
    } else {
      cart.pop();
    }
    throw new Error("We could not save your cart. Please try again.");
  }
}

// removes a product fromt the cart by its name
// if not found, throws an error
export function removeFromCart(productName) {
  // Find the cart row by product name; the UI passes the name from its row.
  const index = cart.findIndex((item) => item.productName === productName);
  if (index < 0) {
    throw new Error("That cart item is no longer available.");
  }

  // splice removes and returns the row, which is kept for rollback if needed.
  const [removedItem] = cart.splice(index, 1);

  try {
    saveCart();
  } catch {
    // Put the product back at the same index to preserve cart ordering.
    cart.splice(index, 0, removedItem);
    throw new Error("We could not update your cart. Please try again.");
  }
}
