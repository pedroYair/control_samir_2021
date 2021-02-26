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

// permite obtener los datos del factor a modificar - por ajax
router.post("/obtener_servicio", isLoggedIn, async(req, res) => {

    const { idServicio } = req.body;
    let servicio = await cnx.query("SELECT * FROM servicios WHERE ID = ? LIMIT 1", [idServicio]);

    if (servicio.length == 1) {

        servicio = servicio[0];
        res.json({
            id: servicio.ID,
            nombre: servicio.NOMBRE,
            precio: servicio.VALOR_UNITARIO,
            nota: servicio.NOTA,
            estado: servicio.ESTADO
        });
    } else {
        res.render("404");
    }
});

// ejecutar edicion de un servicio
router.post("/edit", isLoggedIn, async(req, res) => {

    const { nombre_editar, precio_editar, estado_editar, nota_editar, idServicio } = req.body;

    const servicio = {
        NOMBRE: nombre_editar,
        VALOR_UNITARIO: precio_editar,
        ESTADO: estado_editar,
        NOTA: nota_editar
    };

    try {
        await cnx.query("UPDATE servicios SET ? WHERE ID = ? LIMIT 1", [servicio, idServicio]);
        req.flash("success", 'Servicio actualizado');

    } catch (error) {
        req.flash("message", 'El servicio no pudo ser actualizado');
    }
    res.redirect("/servicios");
});

module.exports = router;