require("dotenv").config()

const app = require("./src/app")
const conectToDB = require("./src/config/db")

conectToDB()

app.listen(3000, ()=>{
    console.log("Server is Running on Port 3000")  
})