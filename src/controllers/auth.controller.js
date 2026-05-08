const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const emailService=require("../services/email.service.js")
const tokenBlackListModel=require("../models/blackList.model.js")


async function userRegisterController(req, res) {
  const { email, name, password } = req.body;

  const isExist = await userModel.findOne({
    email: email,
  });

  if (isExist) {
    return res.status(422).json({
      message: "User already exist with email",
      status: "failed",
    });
  }

  const user = await userModel.create({
    email,
    name,
    password,
  });

  const token = jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" },
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "user register successfully",
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  await emailService.sendRegistrationEmail(user.email,user.name)
}

async function userLoginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel
    .findOne({
      email,
    })
    .select("+password");

  if (!user) {
    return res.status(401).json({
      message: "email or password is invalid",
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(401).json({
      mesage: "email or password is invalid",
    });
  }

  const token = jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" },
  );

  res.cookie("token", token);

  res.status(200).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });


}

async function userLogoutController(req,res){
  const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }



    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}

module.exports = { userRegisterController, userLoginController,userLogoutController };
