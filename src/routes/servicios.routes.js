const express = require("express");
const router = express.Router();
const cnx = require("../config/databaseConecction");
const { isLoggedIn } = require('../controllers/auth');

// lista de servicios
router.get("/", isLoggedIn, async(req, res) => {
    const servicios = await cnx.query("SELECT * FROM servicios ORDER BY NOMBRE");
    res.render("servicios/lista", { servicios: servicios });
});

// formulario nuevo servicio
router.get("/add", isLoggedIn, async(req, res) => {
    res.render("servicios/agregar");
});

// agregar servicio
router.post("/add", isLoggedIn, async(req, res) => {

    const { nombre, precio, nota } = req.body;
    const servicio = {
        NOMBRE: nombre,
        VALOR_UNITARIO: precio,
        NOTA: nota
    };

    try {
        await cnx.query("INSERT INTO servicios SET  ?", [servicio]);
        req.flash("success", 'Servicio registrado');
        res.redirect("/servicios");

    } catch (error) {
        req.flash("message", 'El servicio no pudo ser registrado');
        res.redirect("/servicios/add");
    }

});

// formulario editar servicio
router.get("/edit/:id", isLoggedIn, async(req, res) => {

    const { id } = req.params;
    let servicio = await cnx.query("SELECT * FROM servicios WHERE ID = ? LIMIT 1", [id]);
    
    if(servicio.length == 1)
    {
        res.render("servicios/editar", { servicio: servicio[0] });
    }
    else {
        res.render("403");
    }
});

// ejecutar edicion de un servicio
router.post("/edit/:id", isLoggedIn, async(req, res) => {

    const { id } = req.params;
    const { nombre, precio, estado, nota } = req.body;

    const servicio = {
        NOMBRE: nombre,
        VALOR_UNITARIO: precio,
        ESTADO: estado,
        NOTA: nota
    };

    try {
        await cnx.query("UPDATE servicios SET ? WHERE ID = ? LIMIT 1", [servicio, id]);
        req.flash("success", 'Servicio actualizado');
        res.redirect("/servicios");

    } catch (error) {
        req.flash("message", 'El servicio no pudo ser actualizado');
        res.redirect("/servicios/edit/" + id);
    }
});

module.exports = router;