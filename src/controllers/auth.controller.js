const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")

/*
*- user register controller
*POST /api/auth/register
*/
async function userRegisterController(req,res){
     const {email , name , password} = req.body; 

     const isExists = await userModel.findOne({
            email: email
     })
     console.log("Email received:", email);
     console.log("Found user:", isExists);

     if(isExists){
        return res.status(422).json({
            message : "Email Already Exists with email.",
            status : "failed"
        })
     }

     const user = await userModel.create({
        email, name , password
     })
    
     const token = jwt.sign({userId : user._id} , process.env.JWT_SECRET, {expiresIn : "3d"})
     
     res.cookie("token", token)

    //Email Send logic
      await emailService.sendRegisterationEmail(
        user.email , 
        user.name
       );
      console.log("Registration Email function Called")

     //...
     res.status(201).json({
        user:{
            _id : user._id,
            email : user.email,
            name : user.name 
        },
        token
    })  

}


/** 
 * -User login conttroller
 * -POST /api/auth/login 
*/
async function userLoginController(req,res){
    const {email , password} = req.body;

    const user = await userModel.findOne({email}).select("+password")

    if (!user){
        return  res.status(401).json({
            message : "Invalid Email or Password",
            status : "failed"
        })
    }
    const isValidPassword = await user.comparePassword(password)
  
    if(!isValidPassword){
        return res.status(401).json({
            message: "Invalid Email or Password"
        })
    }
    
    const token = jwt.sign({userId : user._id} , process.env.JWT_SECRET, {expiresIn : "3d"})
     
    res.cookie("token", token)
     
    res.status(200).json({
        user:{
            _id : user._id,
            email : user.email,
            name : user.name 
        },
        token
    });
       
}


/**
 * -User Logout Controller
 * _POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // was: re.headers , authorization

        if (!token) {
            return res.status(400).json({
                message: "No active session found" // was: returning success message on 400
            });
        }

        // Properly clear the cookie
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        await tokenBlackListModel.create({ token });

        return res.status(200).json({
            message: "User logged out successfully"
        });

    } catch (err) {
        console.error("userLogoutController error:", err);
        return res.status(500).json({ message: err.message });
    }
}



module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}