const express = require("express");
const router = express.Router();
const cnx = require("../config/databaseConecction");
const { isLoggedIn } = require('../controllers/auth');

router.get("/", isLoggedIn, async(req, res) => {

   let cantidad_usuarios = 0;
   let cantidad_servicios = 0;

   try {
      const usuarios = await cnx.query("SELECT COUNT(ID) AS CANTIDAD FROM usuarios");
      cantidad_usuarios = usuarios[0].CANTIDAD;

      const servicios = await cnx.query("SELECT COUNT(ID) AS CANTIDAD FROM servicios");
      cantidad_servicios = servicios[0].CANTIDAD;
   } catch (error) {
      
   }
   res.render("index", {cantidad_usuarios: cantidad_usuarios, cantidad_servicios: cantidad_servicios});

});

module.exports = router;