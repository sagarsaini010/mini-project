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
        res.redirect("/profile");
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
        res.status(200).redirect("/profile");
      } else return res.redirect("/login");
    });
  }
});

// function isLoggedIn(req, res, next) {
//   if (req.cookies.token === "") return res.redirect("/login");
//   else {
//     let data = jwt.verify(req.cookies.token, "heysagar");
//     req.user = data;
//     next();
//   }
// }

app.get("/profile", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email }).populate("posts");
  
  res.render("profile", { user });
});

app.post("/post", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let post = await postModel.create({
    user: user._id,
    content,
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.get('/like/:id', isLoggedIn, async (req,res)=>{
    
    let post = await postModel.findOne({_id: req.params.id}).populate('user');
   
    if(post.likes.indexOf(req.user.userid) === -1){
       post.likes.push(req.user.userid);
    }
    else{
      post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }

    await post.save();
    res.redirect('/profile')

})
app.get('/edit/:id', isLoggedIn, async (req,res)=>{
    
    let post = await postModel.findOne({_id: req.params.id}).populate('user');
   
    res.render('edit',{post})

})
app.post('/update/:id', isLoggedIn, async (req,res)=>{
    
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
   
    res.redirect('/profile')

})

function isLoggedIn(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const data = jwt.verify(token, "heysagar");
    req.user = data;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.redirect("/login");
  }
}

app.listen(3000);
