class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }
}

class Product {
    constructor(name, price) {
        this.name = name;
        this.price = price;
    }
}

module.exports = {
    User,
    Product
};