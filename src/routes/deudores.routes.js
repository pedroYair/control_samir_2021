const express = require("express");
const router = express.Router();
const cnx = require("../config/databaseConecction");
const { isLoggedIn, isAdmin } = require('../controllers/auth');

// lista de deudores
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

// permite obtener los datos del factor a modificar - por ajax
router.post("/obtener_deudor", isLoggedIn, async(req, res) => {

    const { idDeudor } = req.body;
    let deudor = await cnx.query("SELECT * FROM deudor WHERE ID = ? LIMIT 1", [idDeudor]);

    if (deudor.length == 1) {

        deudor = deudor[0];
        res.json({
            id: deudor.ID,
            nombre: deudor.NOMBRE,
            apellido: deudor.APELLIDO,
            estado: deudor.ESTADO
        });
    } else {
        res.render("404");
    }
});

// ejecutar edicion de deudor
router.post("/edit", isLoggedIn, isAdmin, async(req, res) => {

    const { nombre_editar, apellido_editar, estado_editar, idDeudor } = req.body;

    const deudor = {
        NOMBRE: nombre_editar,
        APELLIDO: apellido_editar,
        ESTADO: estado_editar
    };

    try {
        await cnx.query("UPDATE deudor SET ? WHERE ID = ? LIMIT 1", [deudor, idDeudor]);
        req.flash("success", 'Deudor actualizado');
        res.redirect("/deudores");

    } catch (error) {
        req.flash("message", 'El deudor no pudo ser actualizado');
        res.redirect("/deudores/edit/" + id);
    }
});

// eliminar deudor
router.get("/delete/:id", isLoggedIn, async(req, res) => {

    const { id } = req.params;
    const deudas = await cnx.query("SELECT COUNT(ID) AS CANTIDAD FROM deudas WHERE FK_DEUDOR = ?", [id]);

    if (deudas[0].CANTIDAD == 0) {

        try {
            await cnx.query("DELETE FROM deudor WHERE ID = ? LIMIT 1", [id]);
            req.flash("success", 'Deudor eliminado');

        } catch (error) {
            req.flash("message", 'El deudor no pudo ser eliminado');
        }
        
    } else {
        req.flash("message", 'No se puede eliminar a este deudor porque cuenta con deudas registradas');
    }
    res.redirect("/deudores");
});

module.exports = router;