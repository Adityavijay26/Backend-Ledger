const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a user"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Invalid Email Address"
      ],
      unique: true
    },

    name: {
      type: String,
      required: [true, "Name is required for creating a user"]
    },

    password: {
      type: String,
      required: [true, "Password is required for creating a user"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false
    },

    systemUser :{
      type: Boolean ,
      default : false,
      immutable: true,
      select: false
    }

  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
  return;
});

userSchema.methods.comparePassword = async function (password) {
 
  console.log(password, this.password)
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel