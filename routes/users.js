//#region imports
var express = require("express");
var router = express.Router();

require("../models/connection");

const User = require("../models/users");

const { checkBody } = require("../modules/checkBody");

const jwt = require("jsonwebtoken");
const uid2 = require("uid2");

const moment = require("moment");

const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");
const secretKey = uid2(32);

const dotenv = require('dotenv')
//#endregion


//#region post method

router.post("/addUser", async(req, res) => {

  const requireBody = ["username", "password", "email"];
  const { email, username, password, isAdmin } = req.body;

  if (!checkBody(req.body, requireBody)) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return res.json({ result: false, error: "Invalid email format" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ result: false, error: "User already exists" });
    }

    const payload = {
      createdAt: moment().format("LLLL"),
      expiresAt: moment().add(5, "minutes").format("LLLL"),
    };

    const token = jwt.sign(payload, secretKey, { algorithm: "HS256" });

    const newUser = new User({
      storeName: "NoStoreName",
      username,
      email,
      token,
      password: bcrypt.hashSync(password, 10),
      isAdmin,
    });

    const savedUser = await newUser.save();
    res.json({result:true, token:savedUser.token,payload});
  }
  catch (error){
    res.status(500).json({result:false,error:"Server error"});
  }
});


router.post("/signin", async (req, res) => {

  const requireBody = ["username", "password"];
  const { username, password } = req.body;

  if (!checkBody(req.body, requireBody)) {
    return res.json({ result: false, error: "Missing or empty field" });

  }

  try {
    const user = await User.findOne({ username: { $regex: new RegExp(username, 'i') } });

    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ result: false, error: "Wrong password" });
    }

    const decodedToken = jwt.decode(user.token);
    const currentMoment = moment();

    if (decodedToken && currentMoment.isBefore(decodedToken.exp)) {
      return res.json({
        result: true,
        token: user.token,
        username: user.username,
        storeName: user.storeName,
        isAdmin:user.isAdmin,
      });
    }

    const payload = {
      username,
      email: req.body.email || "",
      createdAt: currentMoment.format("LLLL"),
      expiresAt: currentMoment.add(5, "minutes").format("LLLL"),
    };

    const newAccessToken = jwt.sign(payload, secretKey, { algorithm: "HS256" });
    user.token = newAccessToken;
    await user.save();

    res.json({
      result: true,
      payload,
      token: newAccessToken,
      username: user.username,
      storeName: user.storeName,
      isAdmin: user.isAdmin,
    });

  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).json({ result: false, error: "Error during signin" });
  }
});

// ?
router.post("/user", (req, res) => {
  const { username } = req.body;
  User.findOne({ username }).then((data) => {

    if (data) {
      res.json({ id: data._id });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "stockstockify@gmail.com",
    pass: process.env.SECRET_PASS,
  },
});


router.post("/forgotPassword", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }
    console.log(user)
    const resetToken = uid2(32);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = moment().add(1, "hour");

    await user.save();

    const resetLink = `https://stockify-frontend-wine.vercel.app/resetPassword?token=${resetToken}`;

    const mailOptions = {
      from: "stockstockify@gmail.com",
      to: email,
      subject: "Réinitialisation de mot de passe",
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.json({ result: false, error: "Failed to send password reset email" });
      } else {
        res.json({ result: true, message: "Password reset email sent successfully", token: resetToken });
      }
    });

  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ result: false, error: "Error during password reset" });
  }
});

router.post("/resetPassword", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      {
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: moment().toDate() },
      },
      {
        $set: {
          password: bcrypt.hashSync(newPassword, 10),
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      },
      { new: true }
    );

    if (user) {
      return res.json({ result: true, message: "Password reset successfully" });
    } else {
      return res.json({ result: false, error: "Invalid or expired token" });
    }

  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ result: false, error: "Failed to reset password" });
  }
});

//#endregion


//#region PUT method

router.put("/updateUser/:id", async (req, res) => {

  const id = req.params.id;
  const { isAdmin, username, email } = req.body;

  try {
    await User.updateOne({ _id: id }, { isAdmin, username, email })

    res.json({ result: true, message: "User udpdated successfully" });
  }
  catch (error) {
    res.status(500).json({ result: false, error: "Server error" });
  }
});

//#endregion


//#region GET method

router.get("/allUser", async (req, res) => {
  try {
    const users = await User.find();

    if (users.length > 0) {
      return res.json({ data: users })
    }

    return res.json({ result: false, error: "No users found" });
  }
  catch (error) {
    res.status(500).json({ result: false, error: "Error fetching users" });
  }
})



//#endregion


//#region DELETE method

router.delete("/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }

    await User.deleteOne({ email });
    res.json({ result: true, message: "User deleted successfully" });
  }
  catch (error) {
    res.status(500).json({ result: false, error: "Error deleting user" });
  }
})

//#endregion


module.exports = router;