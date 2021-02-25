const express = require("express");
const router = express.Router();
const cnx = require("../config/databaseConecction");
const { isLoggedIn, isAdmin } = require('../controllers/auth');

// lista de usuarios
router.get("/", isLoggedIn, async(req, res) => {
    const deudores = await cnx.query("SELECT * FROM deudor ORDER BY NOMBRE");
    res.render("deudores/lista", { deudores: deudores });
});

// formulario nuevo deudor
router.get("/add", isLoggedIn, isAdmin, async(req, res) => {
    res.render("deudores/agregar");
});

// agregar deudor
router.post("/add", isLoggedIn, isAdmin, async(req, res) => {

    const { nombre, apellido } = req.body;
    const deudor = {
        NOMBRE: nombre,
        apellido: apellido
    };
    const hoy = new Date();
    deudor.FECHA_REG = hoy.getFullYear() + "-" + (hoy.getMonth() + 1) + "-" + hoy.getDate();

    try {
        await cnx.query("INSERT INTO deudor SET  ?", [deudor]);
        req.flash("success", 'Deudor registrado');
        res.redirect("/deudores");

    } catch (error) {
        req.flash("message", 'El deudor no pudo ser registrado');
        res.redirect("/deudores/add");
    }

});

// formulario nuevo deudor
router.get("/edit/:id", isLoggedIn, isAdmin, async(req, res) => {

    const { id } = req.params;
    let deudor = await cnx.query("SELECT * FROM deudor WHERE ID = ? LIMIT 1", [id]);
    
    if(deudor.length == 1)
    {
        res.render("deudores/editar", { deudor: deudor[0] });
    }
    else {
        res.render("403");
    }
});

// ejecutar edicion de curso
router.post("/edit/:id", isLoggedIn, isAdmin, async(req, res) => {

    const { id } = req.params;
    const { nombre, apellido, estado } = req.body;

    const deudor = {
        NOMBRE: nombre,
        APELLIDO: apellido,
        ESTADO: estado
    };

    try {
        await cnx.query("UPDATE deudor SET ? WHERE ID = ? LIMIT 1", [deudor, id]);
        req.flash("success", 'Deudor actualizado');
        res.redirect("/deudores");

    } catch (error) {
        req.flash("message", 'El deudor no pudo ser actualizado');
        res.redirect("/deudores/edit/" + id);
    }
});

module.exports = router;