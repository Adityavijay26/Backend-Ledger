const accountModel = require("../models/account.model");
const mongoose = require ("mongoose")
async function createAccountController(req, res) {
    try {
        const user = req.user;

        const account = await accountModel.create({
            user: user._id
        });

        res.status(201).json({ account });

    } catch (err) {
        console.error("createAccountController error:", err);
        res.status(500).json({ message: err.message });
    }
}

async function getUserAccountController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id }); // was: account

        res.status(200).json({ accounts });

    } catch (err) {
        console.error("getUserAccountController error:", err);
        res.status(500).json({ message: err.message });
    }
} 

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        // Validate before hitting DB
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({ message: "Invalid accountId format" });
        }

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const balance = await account.getBalance();

        res.status(200).json({
            accountId: account._id,
            balance
        });

    } catch (err) {
        console.error("getAccountBalanceController error:", err);
        res.status(500).json({ message: err.message });
    }
}


module.exports = {
    createAccountController,
    getUserAccountController,
    getAccountBalanceController
}