import { fetchProducts } from "./products.js";
import { addToCart, cart, removeFromCart } from "./cart.js";

let visibleProducts = [];
const productCooldowns = new Map();

const cartCountElement = document.querySelector("#cart-count");
const productGridElement = document.querySelector("#product-grid");
const categoryFiltersElement = document.querySelector("#category-filters");
const cartItemsElement = document.querySelector("#cart-items");
const cartTotalElement = document.querySelector("#cart-total");
const cartMessageElement = document.querySelector("#cart-message");
const errorMessageElement = document.querySelector("#error-message");

// Updates the cart badge to reflect the current total quantity of items in the cart.
function updateCartBadge() {
  if (cartCountElement) {
    cartCountElement.textContent = cart.reduce(
      (count, item) => count + item.quantity,
      0,
    );
  }
}

// Renders the product catalog in a grid of cards, each with an add button
// that is disabled if the product is out of stock or if a recent add operation
// is still cooling down. The card also includes an expandable details section
// for any additional fields returned by the API.
function renderProducts(productList) {
  if (!productGridElement) {
    return;
  }

  // Keep the current subset so the add-button cooldown can redraw the same
  // filtered view later, and remove stale cards before building the new view.
  visibleProducts = productList;
  productGridElement.innerHTML = "";

  // Build each card independently so its content and handlers use that
  // product's own API data, stock status, and cart action.
  productList.forEach((product) => {
    const coolingDown = productCooldowns.has(product.productName);
    const card = document.createElement("article");
    card.className = "product-card";

    // Present the essential information directly on the card so users can
    // identify the item, understand its category, and see its price quickly.
    const title = document.createElement("h3");
    title.textContent = product.productName;

    // Displays the category and price for each product.
    const category = document.createElement("p");
    category.textContent = "Category: " + product.category;

    // Displays the price with two decimal places for consistency.
    const price = document.createElement("p");
    price.textContent = "Price: $" + product.price.toFixed(2);

    const description = document.createElement("p");
    description.textContent = product.description;

    // Product thumbnails are optional in the API response. 
    // If present, they are shown above the product title for visual identification.
    if (product.thumbnail) {
      const image = document.createElement("img");
      image.src = product.thumbnail;
      image.alt = product.productName;
      image.loading = "lazy";
      card.appendChild(image);
    }

    // The API response may include additional fields that are not displayed on
    // the card. These are shown in an expandable details element for shoppers
    // who want to see the full product data.
    const extraFields = Object.entries(product).filter(
      ([key]) =>
        ![
          "id",
          "title",
          "productName",
          "description",
          "category",
          "price",
          "stock",
          "inStock",
          "thumbnail",
        ].includes(key),
    );

    const moreInformation = document.createElement("details");
    const informationHeading = document.createElement("summary");
    informationHeading.textContent = "More product information";
    moreInformation.appendChild(informationHeading);

    const informationList = document.createElement("dl");
    extraFields.forEach(([key, value]) => {
      // Use a definition list to present the field name and its value. The field
      // name is converted from camelCase to a more readable format with spaces.
      const term = document.createElement("dt");
      term.textContent = key.replace(/([A-Z])/g, " $1");

      const detail = document.createElement("dd");
      detail.textContent =
        value !== null && typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      informationList.appendChild(term);
      informationList.appendChild(detail);
    });
    moreInformation.appendChild(informationList);

    // The add button is disabled if the product is out of stock or if a recent
    // add operation is still cooling down.
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = !product.inStock
      ? "Out of Stock"
      : coolingDown
        ? "Added to Cart"
        : "Add to Cart";
    addButton.disabled = !product.inStock || coolingDown;
    addButton.setAttribute("aria-disabled", String(addButton.disabled));
    // busy state is only set while the cart operation is attempted, so it is not
    // set here. It is set in the click handler and removed after the operation
    const feedback = document.createElement("p");
    feedback.className = "product-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.textContent = coolingDown
      ? `${product.productName} was added to your cart.`
      : "";
    
    // Only attach the add handler if the product is in stock. Out-of-stock items
    // can't be added to the cart, so the button is disabled and no click handler is needed.
    if (product.inStock) {
      
      // The add handler is responsible for updating the cart, showing feedback,
      // and preventing rapid repeated clicks. The button is restored to its
      // original state if the cart operation fails.
      addButton.addEventListener("click", () => {
        const productName = product.productName;

        if (productCooldowns.has(product.productName)) {
          return;
        }

        // The button is disabled and marked busy while the cart operation is
        // attempted. If the operation fails, the button is restored to its
        // original state so the shopper can try again.
        const originalDisabled = addButton.disabled;
        const originalAriaDisabled = addButton.getAttribute("aria-disabled");
        let addedToCart = false;

        addButton.disabled = true;
        addButton.setAttribute("aria-busy", "true");

        // The cart operation may fail if the product is no longer in stock or if
        // local storage cannot be written. In either case, the shopper should
        // be informed and the button restored to its original state.
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

          // If the add succeeded, show a temporary confirmation and prevent rapid
          // repeated clicks. Otherwise, restore the button's original state so
          // the shopper can try again.
          if (addedToCart) {
            addButton.disabled = true;
            addButton.setAttribute("aria-disabled", "true");
            addButton.textContent = "Added to Cart";
            feedback.textContent = `${product.productName} was added to your cart.`;

            // Remove the cooldown marker before redrawing so the product's
            // button returns to its normal stock-dependent state.
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

    // Append all the product card elements in a logical order so the title,
    // category, price, and description are visible first, followed by the
    // expandable details, add button, and live feedback region.
    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(price);
    card.appendChild(description);
    card.appendChild(moreInformation);
    card.appendChild(addButton);
    card.appendChild(feedback);

    productGridElement.appendChild(card);
  });
}

/**
 * Builds category filter buttons for the supplied product catalog.
 * Each category button displays only matching products, and the All Products
 * button restores the full catalog passed to this function.
 */
function renderCategories(productList) {
  if (!categoryFiltersElement) {
    return;
  }

  // Clear any previous category buttons so the new set reflects the current
  // catalog. This is important if the catalog is filtered or replaced.
  categoryFiltersElement.innerHTML = "";

  const categories = [
    ...new Set(productList.map((product) => product.category)),
  ];

  // Create a button for each unique category that filters the product grid.
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    // Renders only products that match the selected category.
    button.addEventListener("click", () => {
      const filteredProducts = productList.filter(
        (product) => product.category === category,
      );
      renderProducts(filteredProducts);
    });

    categoryFiltersElement.appendChild(button);
  });

  // Add a button that restores the complete product list after a category filter is selected.
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.textContent = "All Products";
  // Restores the complete product list after a category filter is selected.
  allButton.addEventListener("click", () => {
    renderProducts(productList);
  });
  categoryFiltersElement.appendChild(allButton);
}

// Renders the current cart contents, including each product's quantity and
// a total price. If the cart is empty, a message is shown instead.
function renderCart() {
  if (!cartItemsElement) {
    return;
  }

  // Clear the previous cart contents so the new state can be rendered.
  cartItemsElement.innerHTML = "";

  // If the cart is empty, show a message and a zero total.
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

  // Render each cart entry with its quantity and a remove button. The total
  // accumulates the extended line price, not just the unit price.
  cart.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className = "cart-item";

    // Display the product name, unit price, and quantity in a single line for clarity.
    const itemDetails = document.createElement("span");
    itemDetails.textContent = `${item.productName} - $${item.price.toFixed(2)} × ${item.quantity}`;

    // Create a remove button for each cart item.
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute(
      "aria-label",
      `Remove ${item.productName} from cart`,
    );

    // Clears the product from the cart and throws an error if the operation fails.
    removeButton.addEventListener("click", () => {
      try {
        removeFromCart(item.productName);
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
    // Accumulate the extended line price, not just the unit price.
    total += item.price * item.quantity;
  });

  // Show a currency total after all cart entries have contributed.
  if (cartTotalElement) {
    cartTotalElement.textContent = "Total: $" + total.toFixed(2);
  }
}

/**
 * Loads the live catalog after the document is ready, then initializes all
 * shared views. A fetch failure is shown to the user and uses an empty
 * catalog so cart rendering and navigation can still initialize.
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Keep the page usable if the API is unavailable; product views receive
  // an empty list while existing local cart contents can still be rendered.
  let productList = [];

  // Fetch before creating category controls so they reflect the live API
  // response. The user-facing message comes from fetchProducts' error.
  try {
    productList = await fetchProducts();
  } catch (error) {
    if (errorMessageElement) {
      errorMessageElement.textContent =
        error instanceof Error
          ? error.message
          : "Unable to load products. Please try again later.";
    }
  }

  // Initialize shared navigation and page-specific views only after the
  // catalog fetch completes or its failure has been handled.
  updateCartBadge();
  renderCategories(productList);
  renderProducts(productList);
  renderCart();
});
