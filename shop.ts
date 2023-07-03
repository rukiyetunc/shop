class EventEmitter {
  private subscriptions: Record<string, Function[]> = {};
  // Method to subscribe to an event
  subscribe(event: string, callback: Function) {
    if (!this.subscriptions[event]) {
      // We create the event for the first subscription
      this.subscriptions[event] = [];
    }
    // Add callback to subscriber list
    this.subscriptions[event].push(callback);
  }

  // Method to unsubscribe from an event
  unsubscribe(event: string, callback: Function) {
    if (!this.subscriptions[event]) {
      return;
    }
    // We filter the callback from the subscriber list
    this.subscriptions[event] = this.subscriptions[event].filter(
      (cb) => cb !== callback
    );
  }

  //Method that triggers an event
  emit(event: string, data: unknown) {
    if (!this.subscriptions[event]) {
      return;
    }
    // We call the callback with the data to the subscribers
    this.subscriptions[event].forEach((cb) => cb(data));
  }
}

class Database {
  private eventEmiter: EventEmitter = new EventEmitter();
  private store: Record<string, unknown> = {};

  save(id: string, data: unknown) {
    this.store[id] = data;

    this.eventEmiter.emit("save", { id, data });

    console.log("Data saved", { id, data })
  }

  // Method to subscribe to update event
  onUpdate(
    updateId: string,
    callback: (eventData: { name: string; data: unknown }) => void
  ) {
    this.eventEmiter.subscribe(updateId, callback);
    return () => this.eventEmiter.unsubscribe(updateId, callback);
  }
}

class Cart {
  private eventEmiter: EventEmitter = new EventEmitter();
  private products: Record<string, number> = {};

  // Adds product cart and triggers "product added" event
  addProduct(product: string, quantity: number) {
    if (this.products[product]) {
      this.products[product] += quantity;
    } else {
      this.products[product] = quantity;
    }
    this.eventEmiter.emit("product-added", { product, quantity });
    this.eventEmiter.emit("quantity-updated", {
      product,
      updated_quantity: this.products[product],
    });
  }

  // Removes the product from the cart and triggers the "product-removed" event
  removeProduct(product: string, quantity: number) {
    if (!this.products[product]) {
      return;
    }
    this.products[product] -= quantity;
    if (this.products[product] <= 0) {
      delete this.products[product];
    }
    this.eventEmiter.emit("product-removed", { product, quantity });
    this.eventEmiter.emit("quantity-updated", {
      product,
      updated_quantity: this.products[product],
    });
  }

  // Updates the quantity of the product and triggers the "quantity-updated" event
  updateQuantity(product: string, reset_quantity: number) {
    if (!this.products[product]) {
      return;
    }
    this.products[product] = reset_quantity;
    this.eventEmiter.emit("quantity-updated", { product, reset_quantity });
    this.eventEmiter.emit("quantity-updated", { product, updated_quantity: this.products[product],
    });
  }

  // Clears the cart and triggers the "cart-cleared" event
  clearCart(cart: string , quantity :number) {
    this.eventEmiter.emit("cart-cleared", {cart, quantity});
  }

  // Subscribe to the "product-added" event and return the callback function
  onProductAdded(
    callback: (data: { product: string; quantity: number }) => void
  ) {
    this.eventEmiter.subscribe("product-added", callback);
  }

  // Subscribe to the "product-removed" event and return the callback function
  onProductRemoved(
    callback: (data: { product: string; quantity: number }) => void
  ) {
    this.eventEmiter.subscribe("product-removed", callback);
    return () => this.eventEmiter.unsubscribe("product-removed", callback);
  }

  // Subscribe to the "quantity-updated" event and return the callback function
  onQuantityUpdated(
    callback: (data: { product: string; quantity: number }) => void
  ) {
    this.eventEmiter.subscribe("quantity-updated", callback);
    return () => this.eventEmiter.unsubscribe("quantity-updated", callback);
  }

  // Subscribe to the "cart-cleared" event and return the callback function
  onCartCleared(callback: (data: { cart: string; quantity: number}) => void
  ) {
    this.eventEmiter.subscribe("cart-cleared", callback);
    return () => this.eventEmiter.unsubscribe("cart-cleared", callback);
  }
}

function main() {
  const cart = new Cart();
  const database = new Database();
  const updateListener = database.onUpdate("save", (eventData) => {
    console.log("Data updated:", eventData);
  });
  
  cart.onProductAdded((data) => {
    console.log("Product added:", data);
    database.save(data.product, data.quantity);
  });

  cart.onProductRemoved((data) => {
    console.log("Product removed:", data);
    database.save(data.product, data.quantity);
  });
  cart.onQuantityUpdated((data) => {
    console.log("Quantity updated:", data);
  });
  cart.onCartCleared((data) => {
    console.log("Cart cleared:", data);
    database.save(data.cart, data.quantity);
  });

  cart.addProduct("Apple", 5);
  cart.addProduct("Orange", 9);
  cart.updateQuantity("Apple", 10);
  cart.removeProduct("Apple", 2);
  cart.removeProduct("Orange", 5);
  cart.clearCart("Cart empty",0);
}

main();
