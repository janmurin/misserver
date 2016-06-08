"use strict"
var products = [{
        name : "test",
        price : 12.9,
        inventory : 20
    }, {
        name : "test2",
        price : 30,
        inventory : 80
    }],
   orders = [];


class ProductLineItem {
	constructor(productID){
		this.product = products[productID];
		this.qty = 1;
		this.total = this.product.price;
	}
	updateQty(qty) {
		this.qty = qty;
		this.total = this.product.price * qty;
	}
}

class ProductlineItemContainer {
	constructor(){
		this.productLineItems = [];
	}
	getTotalPrice(){
		var sum = 0;
		for(let i = 0; i < this.productLineItems.length; i ++) {
			console.log(sum);
			sum += this.productLineItems[i].total;
		}
		return sum;
	}
}

class Order extends ProductlineItemContainer {
	constructor(basket) {
		this.productLineItems = basket.productLineItems;
	}
	setStatus(status) {
		this.status = status;
	}
}

Order.STATUS_PLACED = "placed";
Order.STATUS_DELIVERED = "delivered";
Order.STATUS_CANCELED = "cancelled";

class Basket extends ProductlineItemContainer {
	addProduct(productID){
		this.productLineItems.push(new ProductLineItem(productID))
		return this;
	}
	removeProduct(productID){
		for(let i = 0; i < this.productLineItems; i++) {
			if(this.productLineItems[i].product.id == productID) {
				delete this.productLineItems[i];
				break;
				break;
			}
		}
		return this;
	}
	updateProductQuantity(productID, qty) {
		for(let i = 0; i < this.productLineItems; i++) {
			if(this.productLineItems[i].product.id == productID) {
				this.productLineItems[i].updateQty(qty);
			}
		}
	}
	
	placeOrder() {
		var order = new Order(this);
		delete this;
		orders.push(order);
		return order;
	}
}

module.exports = {
	Basket : Basket,
	products : products,
	orders : orders
}