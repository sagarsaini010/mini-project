const express = require("express");
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile", isLoggedIn, (req, res) => {
  console.log(req.user);
  res.render("login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.post("/create", async (req, res) => {
  if (req.body.name) {
    let { name, username, age, email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("user already registered");
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        const user = await userModel.create({
          name,
          username,
          age,
          email,
          password: hash,
        });

        const token = jwt.sign(
          { email: user.email, userid: user._id },
          "heysagar"
        );
        res.cookie("token", token);
        res.send(user);
      });
    });
  } else return res.redirect("/");
});

app.post("/login", async (req, res) => {
  if (req.body.email) {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Somthing went wrong");
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign(
          { email: user.email, userid: user._id },
          "heysagar"
        );
        res.cookie("token", token);
        res.status(200).send("you can login");
      } else return res.redirect("/login");
    });
  }
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") res.send("You must be logged in");
  else {
    let data = jwt.verify(req.cookies.token, "heysagar");
    req.user = data;
    next();
  }
}

app.listen(3000);
