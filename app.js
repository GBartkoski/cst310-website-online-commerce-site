import { products } from "./products.js";
import { addToCart, cart, removeFromCart } from "./cart.js";

let visibleProducts = products;
const productCooldowns = new Map();

const cartCountElement = document.querySelector("#cart-count");
const productGridElement = document.querySelector("#product-grid");
const categoryFiltersElement = document.querySelector("#category-filters");
const cartItemsElement = document.querySelector("#cart-items");
const cartTotalElement = document.querySelector("#cart-total");
const cartMessageElement = document.querySelector("#cart-message");
const errorMessageElement = document.querySelector("#error-message");

// Updates the cart counter displayed in the navigation so the user sees the current item total.
function updateCartBadge() {
  if (cartCountElement) {
    cartCountElement.textContent = cart.length;
  }
}

// Draws product cards, including stock state and any active add-to-cart cooldown.
function renderProducts(productList) {
  if (!productGridElement) {
    return;
  }
  // Updates the visible product list and clears the grid so it can be rebuilt.
  visibleProducts = productList;
  productGridElement.innerHTML = "";

  // Builds one card and its controls for each product in the visible list.
  productList.forEach((product) => {
    const coolingDown = productCooldowns.has(product.productName);
    const card = document.createElement("article");
    card.className = "product-card";

    // Displays the product name as a heading for accessibility and clarity.
    const title = document.createElement("h3");
    title.textContent = product.productName;

    // Displays the category and price for each product.
    const category = document.createElement("p");
    category.textContent = "Category: " + product.category;

    // Displays the price with two decimal places for consistency.
    const price = document.createElement("p");
    price.textContent = "Price: $" + product.price.toFixed(2);

    // Creates an add-to-cart button that is disabled if the product is out of stock or in a cooldown state.
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = !product.inStock
      ? "Out of Stock"
      : coolingDown
        ? "Added to Cart"
        : "Add to Cart";
    addButton.disabled = !product.inStock || coolingDown;
    addButton.setAttribute("aria-disabled", String(addButton.disabled));
    // Provides a status message for screen readers to announce when a product is added to the cart.
    const feedback = document.createElement("p");
    feedback.className = "product-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.textContent = coolingDown
      ? `${product.productName} was added to your cart.`
      : "";
    // Adds a click handler that attempts to add the product to the cart and handles errors gracefully.
    if (product.inStock) {
      // Adds this product, reports failures, and temporarily prevents duplicate clicks.
      addButton.addEventListener("click", () => {
        const productName = product.productName;

        if (productCooldowns.has(product.productName)) {
          return;
        }

        // Saves the original button state so it can be restored if adding to the cart fails.
        const originalDisabled = addButton.disabled;
        const originalAriaDisabled = addButton.getAttribute("aria-disabled");
        let addedToCart = false;

        addButton.disabled = true;
        addButton.setAttribute("aria-busy", "true");

        // Attempts to add the product to the cart and updates the UI accordingly.
        try {
          addToCart(productName);
          addedToCart = true;
          updateCartBadge();
          renderCart();
          if (errorMessageElement) {
            errorMessageElement.textContent = "";
          }
        } catch (error) {
          if (errorMessageElement) {
            errorMessageElement.textContent =
              error instanceof Error
                ? error.message
                : "We could not add this item. Please try again.";
          }
        } finally {
          addButton.removeAttribute("aria-busy");

          // If the product was successfully added, disables the button and shows a confirmation message.
          if (addedToCart) {
            addButton.disabled = true;
            addButton.setAttribute("aria-disabled", "true");
            addButton.textContent = "Added to Cart";
            feedback.textContent = `${product.productName} was added to your cart.`;

            // Clears the confirmation and restores the button after three seconds.
            const cooldownTimer = window.setTimeout(() => {
              productCooldowns.delete(product.productName);
              renderProducts(visibleProducts);
            }, 3000);
            productCooldowns.set(product.productName, cooldownTimer);
          } else {
            addButton.disabled = originalDisabled;
            if (originalAriaDisabled === null) {
              addButton.removeAttribute("aria-disabled");
            } else {
              addButton.setAttribute("aria-disabled", originalAriaDisabled);
            }
          }
        }
      });
    }

    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(price);
    card.appendChild(addButton);
    card.appendChild(feedback);

    productGridElement.appendChild(card);
  });
}

// Creates one filter button per category and a button to restore the full catalog.
function renderCategories() {
  if (!categoryFiltersElement) {
    return;
  }

  categoryFiltersElement.innerHTML = "";

  const categories = [...new Set(products.map((product) => product.category))];

  // Adds a button that filters the product grid to one category.
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    // Renders only products that match the selected category.
    button.addEventListener("click", () => {
      const filteredProducts = products.filter(
        (product) => product.category === category,
      );
      renderProducts(filteredProducts);
    });

    categoryFiltersElement.appendChild(button);
  });

  // Adds a button that restores the full product list after a category filter is applied.
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.textContent = "All Products";
  // Restores the complete product list after a category filter is selected.
  allButton.addEventListener("click", () => {
    renderProducts(products);
  });
  categoryFiltersElement.appendChild(allButton);
}

// Draws cart rows with remove controls and updates the displayed total.
function renderCart() {
  if (!cartItemsElement) {
    return;
  }

  cartItemsElement.innerHTML = "";

  if (cart.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "Your cart is empty.";
    cartItemsElement.appendChild(emptyMessage);
    if (cartTotalElement) {
      cartTotalElement.textContent = "Total: $0.00";
    }
    return;
  }

  let total = 0;

  // Creates a list item for each cart entry, including a remove button that handles errors gracefully.
  cart.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.className = "cart-item";

    // Displays the product name and price for each cart entry.
    const itemDetails = document.createElement("span");
    itemDetails.textContent = `${item.productName} - $${item.price.toFixed(2)}`;

    // Creates a remove button that attempts to delete the cart entry and restores it if saving fails.
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute(
      "aria-label",
      `Remove ${item.productName} from cart`,
    );

    // Removes this entry, then refreshes the cart badge and displayed contents.
    removeButton.addEventListener("click", () => {
      try {
        removeFromCart(index);
        if (cartMessageElement) {
          cartMessageElement.textContent = "";
        }
        updateCartBadge();
        renderCart();
      } catch (error) {
        if (cartMessageElement) {
          cartMessageElement.textContent =
            error instanceof Error
              ? error.message
              : "We could not remove this item. Please try again.";
        }
      }
    });

    listItem.appendChild(itemDetails);
    listItem.appendChild(removeButton);
    cartItemsElement.appendChild(listItem);
    total += item.price;
  });

  if (cartTotalElement) {
    cartTotalElement.textContent = "Total: $" + total.toFixed(2);
  }
}

// Initializes shared navigation, product, and cart views after the page markup is ready.
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCategories();
  renderProducts(products);
  renderCart();
});
