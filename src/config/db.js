const mongoose = require("mongoose");

function connectToDB() {
    mongoose.connect(process.env.MONGO_URL)
        .then(() => {
            console.log("Server is Connected to DB");
            console.log("DB Name:", mongoose.connection.name);
        })
        .catch((err) => {
            console.log("Error Connecting to DB");
            console.error(err);
            process.exit(1);
        });
}

module.exports = connectToDB;