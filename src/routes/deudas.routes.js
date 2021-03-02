const express = require("express");
const router = express.Router();
const cnx = require("../config/databaseConecction");
const { isLoggedIn } = require('../controllers/auth');

// lista de deudas
router.get("/", isLoggedIn, async(req, res) => {

        
    await cnx.query("DELETE FROM deudas WHERE TOTAL = 0");
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
        const detalle = await cnx.query("SELECT B.ID, NOMBRE, SUM(CANTIDAD) AS CANTIDAD, SUM(VALOR) AS VALOR FROM detalle_deuda AS A JOIN servicios AS B ON A.FK_SERVICIO = B.ID WHERE FK_DEUDA = ? GROUP BY FK_SERVICIO", [idDeuda]);
        res.render("deudas/agregar_detalle", {idDeuda: idDeuda, servicios: servicios, detalle: detalle});
    }
    else{
        res.render("404");
    } 
});


// eliminar servicio del detalle de venta
router.get("/delete/:idDeuda/:idServicio", isLoggedIn, async(req, res) => {

    const { idDeuda, idServicio } = req.params;
    console.log(req.params);

    try {
        await cnx.query("DELETE FROM detalle_deuda WHERE FK_DEUDA = ? AND FK_SERVICIO = ?", [idDeuda, idServicio]);
        req.flash("success", 'Servicio eliminado del detalle de la deuda');

    } catch (error) {
        req.flash("message", 'El servicio no pudo ser eliminado del detalle de la deuda');
    }
    
    res.redirect("/deudas/add_detalle/" + idDeuda);
});

module.exports = router;