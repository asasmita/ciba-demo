class KioskController {

    constructor() {}

    // Main kiosk page
    showKioskItems = (req, res) => {
        res.render('kiosk', { title: 'Kiosk Photo Print - Main Page' });
    }

    // Checkout page
    doCheckOut = (req, res) => {
        var selectedItem = null;
        var bankId = "";
        if (req.method == "POST") {
            selectedItem = req.body["item"];
            bankId = req.body["select_bank"];
        } else {
            selectedItem = req.query.item
        }
        var item = null;
        if (selectedItem == "item001") {
            item = {
                "code": "item001",
                "name": "Print Labels",
                "price": 0.25,
                "qty": 12,
            }
        } else if (selectedItem == "item002") {
            item = {
                "code": "item002",
                "name": "Print Name Cards",
                "price": 0.75,
                "qty": 100,
            }
        } else if (selectedItem == "item003") {
            item = {
                "code": "item003",
                "name": "Print Photos",
                "price": 0.50,
                "qty": 1,
            }
        }
        if (req.method == "POST") {
            item["qty"] = req.body["qty"];
        }
        if (bankId === "") {
            res.render('checkout', { item: item, title: 'Kiosk Photo Print - Check Out', noBankInfo: true, hasBankInfo: false });
        } else {
            item['bankId'] = bankId;
            res.render('checkout', { item: item, title: 'Kiosk Photo Print - Check Out', noBankInfo: false, hasBankInfo: true });
        }
    }
}

module.exports = KioskController;
