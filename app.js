let products = [
  {
    productName: "Running shoes",
    price: 89.99,
    category: "footwear",
    inStock: true,
  },
  {
    productName: "Basketball Sneakers",
    price: 120.0,
    category: "footwear",
    inStock: false,
  },
  {
    productName: "Apples",
    price: 1.99,
    category: "Food item",
    inStock: true,
  },
  {
    productName: "Bananas",
    price: 0.99,
    category: "Food item",
    inStock: true,
  },
];

// key for localstorage to store the cart information
const CART_STORAGE_KEY = "shop-cart";

// loads the cart from localstorage if it exists
//loads the cart array if there is items
function loadCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error("Could not load cart from localStorage:", error);
    return [];
  }
}

// converts the array into a string and saves it under the key "shop-cart" in localstorage
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Could not save cart to localStorage:", error);
  }
}

// initializes the cart and other html elements for the page
let cart = loadCart();

const cartCountElement = document.querySelector("#cart-count");
const productGridElement = document.querySelector("#product-grid");
const categoryFiltersElement = document.querySelector("#category-filters");
const cartItemsElement = document.querySelector("#cart-items");
const cartTotalElement = document.querySelector("#cart-total");

// Updates the cart counter displayed in the navigation so the user sees the current item total.
function updateCartBadge() {
  if (cartCountElement) {
    cartCountElement.textContent = cart.length;
  }
}

// Adds a selected product to the cart only when it exists and is currently in stock.
function addToCart(productName) {
  const foundProduct = products.find(
    (product) => product.productName === productName,
  );

  if (!foundProduct) {
    console.log("Product not found: " + productName);
    return;
  }

  if (!foundProduct.inStock) {
    console.log("Product is out of stock: " + productName);
    return;
  }

  cart.push(foundProduct);
  saveCart();
  updateCartBadge();

  if (cartItemsElement) {
    renderCart();
  }

  console.log("Product added to cart: " + productName);
}

// Renders all available product cards in the product grid and disables the button for items that are out of stock.
function renderProducts(productList) {
  if (!productGridElement) {
    return;
  }

  productGridElement.innerHTML = "";

  productList.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const title = document.createElement("h3");
    title.textContent = product.productName;

    const category = document.createElement("p");
    category.textContent = "Category: " + product.category;

    const price = document.createElement("p");
    price.textContent = "Price: $" + product.price.toFixed(2);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = product.inStock ? "Add to Cart" : "Out of Stock";
    addButton.disabled = !product.inStock;
    addButton.setAttribute("aria-disabled", String(!product.inStock));
    if (product.inStock) {
      addButton.addEventListener("click", () => {
        addToCart(product.productName);
      });
    }

    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(price);
    card.appendChild(addButton);

    productGridElement.appendChild(card);
  });
}

// Creates the category filter buttons and includes an option to show every product again.
function renderCategories() {
  if (!categoryFiltersElement) {
    return;
  }

  categoryFiltersElement.innerHTML = "";

  const categories = [...new Set(products.map((product) => product.category))];

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => {
      const filteredProducts = products.filter(
        (product) => product.category === category,
      );
      renderProducts(filteredProducts);
    });

    categoryFiltersElement.appendChild(button);
  });

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.textContent = "All Products";
  allButton.addEventListener("click", () => {
    renderProducts(products);
  });
  categoryFiltersElement.appendChild(allButton);
}

// Renders the items currently in the cart and calculates the running total for checkout display.
function renderCart() {
  if (!cartItemsElement) {
    return;
  }

  cartItemsElement.innerHTML = "";

  if (cart.length === 0) {
    cartItemsElement.innerHTML = "<p>Your cart is empty.</p>";
    if (cartTotalElement) {
      cartTotalElement.textContent = "Total: $0.00";
    }
    return;
  }

  let total = 0;

  cart.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${item.productName} - $${item.price.toFixed(2)}`;
    cartItemsElement.appendChild(listItem);
    total += item.price;
  });

  if (cartTotalElement) {
    cartTotalElement.textContent = "Total: $" + total.toFixed(2);
  }
}

// Logs the current cart contents and total to the console for quick debugging and manual review.
function viewCart() {
  if (cart.length === 0) {
    console.log("Your cart is empty.");
    return;
  }

  let total = 0;

  console.log("Cart Contents:");
  cart.forEach((item) => {
    console.log(
      "Product Name: " + item.productName + ", Price: $" + item.price,
    );
    total += item.price;
  });

  console.log("Total: $" + total.toFixed(2));
}

// Filters the product list by the selected category and redraws only those matching items.
function filterByCategory(category) {
  const filteredProducts = products.filter(
    (product) => product.category === category,
  );

  if (filteredProducts.length === 0) {
    console.log("No products found in category: " + category);
    return;
  }

  renderProducts(filteredProducts);
}

// Initializes the page when the DOM finishes loading so the cart badge, filters, and product list are ready for the user.
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCategories();
  renderProducts(products);
  renderCart();
});

console.log("Products Array: ", products);

viewCart();
