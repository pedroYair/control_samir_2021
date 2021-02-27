const express = require("express");
const router = express.Router();
const cnx = require("../config/databaseConecction");
const { isLoggedIn } = require('../controllers/auth');

// lista de deudas
router.get("/", isLoggedIn, async(req, res) => {
    const deudas = await cnx.query("SELECT b.ID, NOMBRE, SUM(TOTAL) AS TOTAL FROM deudas AS a JOIN deudor AS b ON a.FK_DEUDOR = b.ID ORDER BY NOMBRE");
    res.render("deudas/lista", { deudas: deudas });
});

// agregar deuda
router.get("/add/:idDeudor", isLoggedIn, async(req, res) => {

    const { idDeudor } = req.params;
    const deudor = await cnx.query("SELECT COUNT(ID) AS CANTIDAD FROM deudor WHERE ID = ? LIMIT 1", [idDeudor]);

    if(deudor.length == 1){

        const hoy = new Date();
        const deuda = {
            FK_DEUDOR: idDeudor,
            FECHA: hoy.getFullYear() + "-" + (hoy.getMonth() + 1) + "-" + hoy.getDate(),
            TOTAL: 0
        };

        try {
            const resultado = await cnx.query("INSERT INTO deudas SET  ?", [deuda]);
            req.flash("success", 'Deuda creada proceda a ingresar el detalle');
            res.redirect("/deudas/add_detalle/" + resultado.insertId);
    
        } catch (error) {
            req.flash("message", 'El la deuda no pudo ser registrada');
            res.redirect("/deudas");
        }
    }
    else{
        render("404");
    }
    

});

// ejecutar agregar detalle de venta
router.post("/add_detalle", isLoggedIn, async(req, res) => {

    const { idDeuda, idServicio, valor, cantidad, nota } = req.body;

    const detalle = {
        FK_DEUDA: idDeuda,
        FK_SERVICIO: idServicio,
        VALOR: valor,
        CANTIDAD: cantidad,
        NOTA: nota
    };

    try {
        const resultado = await cnx.query("INSERT INTO detalle_deuda SET ?", [detalle]);
        req.flash("success", 'Detalle registrado');
        // resultado.insertId

        if(resultado.insertId)
        {
            await cnx.query("UPDATE deudas SET TOTAL = TOTAL + ? WHERE ID = ?", [valor, idDeuda]);
        }

    } catch (error) {
        req.flash("message", 'El detalle no pudo ser registrado');
    }

    res.redirect("/deudas/add_detalle/" + idDeuda);

});

// formulario detalle de venta
router.get("/add_detalle/:idDeuda", isLoggedIn, async(req, res) => {

    const { idDeuda } = req.params;
    const deuda = await cnx.query("SELECT COUNT(ID) AS CANTIDAD FROM deudas WHERE ID = ? LIMIT 1", [idDeuda]);
    const servicios = await cnx.query("SELECT ID, NOMBRE FROM servicios ORDER BY NOMBRE");

    if(deuda.length == 1 && servicios.length > 0)
    {
        res.render("deudas/agregar_detalle", {idDeuda: idDeuda, servicios: servicios});
    }
    else{
        res.render("404");
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