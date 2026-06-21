const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/** 
 * Create a new Transaction
 * The 10 Step Transfer Flow:
 *  1. Validate Request
 *  2. Validate Idempotency Key
 *  3. Check Account status
 *  4. Derive sender balance from ledger
 *  5. Create Transaction (PENDING)
 *  6. Create DEBIT ledger
 *  7. Create CREDIT ledger
 *  8. Mark transaction COMPLETED
 *  9. Commit MongoDB session
 *  10. Send email notification
 */

async function createTransaction(req, res) {
    try {
        /**
         * 1. Validate Request
         */
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "fromAccount, toAccount, amount and idempotencyKey are required"
            });
        }

        const fromUserAccount = await accountModel.findOne({ _id: fromAccount });
        const toUserAccount = await accountModel.findOne({ _id: toAccount });

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount"
            });
        }

        /**
         * 2. Validate Idempotency Key
         */
        const isTransactionAlreadyExists = await transactionModel.findOne({ idempotencyKey });

        if (isTransactionAlreadyExists) {
            if (isTransactionAlreadyExists.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: isTransactionAlreadyExists
                });
            }
            if (isTransactionAlreadyExists.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still processing"
                });
            }
            if (isTransactionAlreadyExists.status === "FAILED") {
                return res.status(500).json({
                    message: "Transaction processing failed, please retry"
                });
            }
            if (isTransactionAlreadyExists.status === "REVERSED") {
                return res.status(500).json({
                    message: "Transaction was reversed, please retry"
                });
            }
        }

        /**
         * 3. Check Account Status
         */
        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            });
        }

        /**
         * 4. Derive sender balance from ledger
         */
        const balance = await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}, requested amount is ${amount}`
            });
        }


    let transaction;    

    try{

        /**
         * 5-9. Create Transaction, Ledger Entries, Commit
         */
        const session = await mongoose.startSession();
        session.startTransaction();

        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], {session}))[ 0 ]

        // 6. DEBIT ledger
        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

          await (()=>{
          return new Promise((resolve)=> setTimeout(resolve ,15 * 1000));
          })() 

        // 7. CREDIT ledger
        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        // 8. Mark COMPLETED
        transaction.status = "COMPLETED";
        await transactionModel.findOneAndUpdate(
            {_id: transaction._id },
            {status: "COMPLETED" },
            { session }
        ); 

        
        // 9. Commit
        await session.commitTransaction();
        session.endSession();

    } catch(error){
       
        return res.status(400).json({
            message:"Transaction is Pending Deu to some isseu , please retry after sometimes"
        })
    };
    

        
        /**
         * 10. Send Email Notification
         */
        await emailService.sendTransactionEmail(req.user.email, req.user.name, toAccount);

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction
        });

    } catch (err) {
        console.error("createTransaction error:", err);
        return res.status(500).json({ message: err.message });
    }
}

async function createInitialFundsTransaction(req, res) {
    try {
        const { toAccount, amount, idempotencyKey } = req.body;

        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, amount and idempotencyKey are required"
            });
        }

        const toUserAccount = await accountModel.findOne({ _id: toAccount });
        if (!toUserAccount) {
            return res.status(400).json({ message: "Invalid toAccount" });
        }

        const fromUserAccount = await accountModel.findOne({ user: req.user._id });
        if (!fromUserAccount) {
            return res.status(400).json({ message: "System user account not found" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        });

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction
        });

    } catch (err) {
        console.error("createInitialFundsTransaction error:", err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};