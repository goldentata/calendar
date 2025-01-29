class IndexController {
    getIndex(req, res) {
        res.send('Welcome to the API!');
    }

    // Additional methods for handling other routes can be added here
}

module.exports = IndexController;