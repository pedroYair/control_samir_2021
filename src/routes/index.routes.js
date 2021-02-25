const express = require("express");
const router = express.Router();
const cnx = require("../config/databaseConecction");
// const { isLoggedIn } = require('../controllers/auth');

router.get("/", async(req, res) => {

   // res.send("inicio");
   res.render("index");

});

module.exports = router;