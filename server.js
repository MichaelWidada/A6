/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Michael Widada Student ID: 184623239 Date: 12-04-2025
*
*  Published URL:  https://a6-flax-nine.vercel.app/
*
********************************************************************************/


const siteData = require("./modules/data-service");
const authData = require("./modules/auth-service");

const clientSessions = require("client-sessions");

const path = require("path");

const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

// app.use(express.static('public')); // causing tailwindCSS not working on vercel.com
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// app.set('views', __dirname + '/views');

app.use(clientSessions({
  cookieName: "session", 
  secret: "Salahketik.77", 
  duration: 2 * 60 * 1000, 
  activeDuration: 1000 * 60 
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
});

app.get("/addSite", ensureLogin, async (req, res) => {
  let provincesAndTerritories = await siteData.getAllProvincesAndTerritories()
  res.render("addSite", { provincesAndTerritories })
});

app.post("/addSite", ensureLogin, async (req, res) => {
  try {
    await siteData.addSite(req.body);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/sites", async (req,res)=>{

  let sites = [];
  try {
    if(req.query.region){
      sites = await siteData.getSitesByRegion(req.query.region);
    } else if(req.query.provinceOrTerritory) {
      sites = await siteData.getSitesByProvinceOrTerritoryName(req.query.provinceOrTerritory);
    } else {
      sites = await siteData.getAllSites();
    }
    // console.log("sites[0]: ", sites[0])
    res.render("sites", {sites})
  }catch(err){
    res.status(404).render("404", {message: err});
  }

});

app.get("/sites/:id", async (req,res)=>{
  
  try{
    let site = await siteData.getSiteById(req.params.id);
    // res.send(site);
    res.render("site", {site})
  }catch(err){
    // console.log(" err:",  err)
    res.status(404).render("404", {message: err});
  }
});



app.get("/editSite/:id", ensureLogin, async (req, res) => {

  try {
    let site = await siteData.getSiteById(req.params.id);
    let provincesAndTerritories = await siteData.getAllProvincesAndTerritories()

    res.render("editSite", { site, provincesAndTerritories });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }

});

app.post("/editSite", ensureLogin, async (req, res) => {

  try {
    await siteData.editSite(req.body.siteId, req.body);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/deleteSite/:id", ensureLogin, async (req, res) => {
  try {
    await siteData.deleteSite(req.params.id);
    res.redirect("/sites");
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
})

app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "", userName: "" });
});

app.get("/register", (req, res) => {
  res.render("register", {
    successMessage: "",
    errorMessage: "",
    userName: ""
  });
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render("register", {
        successMessage: "User created",
        errorMessage: "",
        userName: ""
      });
    })
    .catch((err) => {
      res.render("register", {
        successMessage: "",
        errorMessage: err,
        userName: req.body.userName
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  authData.checkUser(req.body).then((user) => {
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };

    res.redirect("/sites");
  }).catch(err => {
    res.render("login", {
      errorMessage: err,
      userName: req.body.userName
    });
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", {
    user: req.session.user
  });
});

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});


siteData.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log(`app listening on:  ${HTTP_PORT}`);
    });
}).catch(function(err){
    console.log(`unable to start server: ${err}`);
});
