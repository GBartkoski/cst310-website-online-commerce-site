export let products = [];

// Fetches the product catalog from the API and updates the shared products
// array. If the request fails, throws an error with a user-friendly message.
export async function fetchProducts() {
  try {
    const response = await fetch("https://dummyjson.com/products?limit=0");

    if (!response.ok) {
      throw new Error(`Product request failed with status ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data.products)) {
      throw new Error("The product response did not contain a product list.");
    }

    products = data.products.map((product) => ({
      ...product,
      productName: product.title,
      inStock: product.stock > 0,
    }));
    return products;
  } catch (error) {
    throw new Error("Unable to load products. Please try again later.", {
      cause: error,
    });
  }
}
