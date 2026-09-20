// Products array containing product objects
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

// Empty array to hold items added to the cart
let cart = [];

// console log to show the current products in the products array
console.log("Products Array: ", products);

// Functions to add products to the cart and notify if
// the product is out of stock or not found

function addToCart(productName) {
  let foundProduct = products.find(
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
  console.log("Product added to cart: " + productName);
}

// view the cart contents displaying the
// product name, price, and total price of all items in the cart

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

// filter products by category and display the filtered products

function filterByCategory(category) {
  let filteredProducts = products.filter(
    (product) => product.category === category,
  );

  if (filteredProducts.length === 0) {
    console.log("No products found in category: " + category);
    return;
  }

  console.log("Products in category: " + category);
  filteredProducts.forEach((product) => {
    console.log(product.productName + " - $" + product.price);
  });
}

addToCart("Running shoes");
addToCart("Basketball Sneakers");
addToCart("Apples");
viewCart();
filterByCategory("footwear");
