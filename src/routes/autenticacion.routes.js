const express = require("express");
const router = express.Router();
const passport = require('passport');
const cnx = require("../config/databaseConecction");
const helpers = require("../controllers/herlpers");
const { isLoggedIn, isNotLoggedIn, isAdmin, isDocente, isEstudiante } = require('../controllers/auth');
const EmailCtrl = require('../controllers/emailControl');

// lista de usuarios
router.get("/", isLoggedIn, async(req, res) => {
    const usuarios = await cnx.query("SELECT * FROM usuarios ORDER BY APELLIDO");
    res.render("autenticacion/lista", { usuarios: usuarios });
});

// mostrar formulario de registro de usuario
router.get("/register", isLoggedIn, isAdmin, (req, res) => {
    res.render("autenticacion/register");
});

// ejecutar registro de usuario
router.post('/register', function(req, res, next) {
    passport.authenticate('localSignup', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/auth/register'); }
        return res.redirect('/auth/register');
    })(req, res, next);

});

// mostrar formulario login
router.get("/login", isNotLoggedIn, (req, res) => {
    res.render("autenticacion/login");
});

// ejecutar login
router.post('/login', isNotLoggedIn, function(req, res, next) {
    passport.authenticate('localLogin', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/auth/login'); }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/');
        });
    })(req, res, next);
});

// cerrar sesion
router.get("/logout", (req, res) => {
    req.logOut(); // metodo disponible gracias a passport
    res.render("autenticacion/login");
});

// mostrar formulario de recuperacion de contraseña
router.get("/reset", isNotLoggedIn, (req, res) => {
    res.render("autenticacion/recuperar_password");
});

// enviar email recuperacion de contraseña
router.post("/reset", isNotLoggedIn, async(req, res) => {

    const { email } = req.body;
    const usuario = await cnx.query("SELECT id, NOMBRE, APELLIDO FROM usuarios WHERE EMAIL = ? LIMIT 1", [email]);

    let respuesta = 1;
    if (usuario.length == 1) {
        const clave_plana = Math.floor((Math.random() * (99999 - 10000 + 1)) + 10000).toString();
        const nueva_pass = await helpers.encryptPassword(clave_plana);

        const resultado = await cnx.query("UPDATE usuarios SET CLAVE = ? WHERE id = ? LIMIT 1", [nueva_pass, usuario[0].id]);

        if (resultado.affectedRows == 1) {
            try {
                const mensaje = `Sr(a) ${usuario[0].NOMBRE} ${usuario[0].APELLIDO} a continuación encontrará las nuevas credenciales de acceso a la plataforma: \n Email: ${email} \n Nueva contraseña: ${clave_plana}`;
                req.body.email = email;
                req.body.mensaje = mensaje;
                EmailCtrl.sendEmail(req);
            } catch (error) {
                console.log("El email no pudo ser enviado");
                respuesta = 3;
            }
        }

    } else {
        console.log("El email ingresado no esta registrado en la plataforma");
        respuesta = 2;
    }
    res.redirect("/auth/confirmar_reset/" + respuesta);
});

// mostrar formulario de recuperacion de contraseña
router.get("/confirmar_reset/:resp", isNotLoggedIn, (req, res) => {
    const { resp } = req.params;
    res.render("autenticacion/confirmar_reset", { respuesta: resp });
});

// mostrar formulario edicion de usuarios (por administrador)
router.get("/edit/:id", isLoggedIn, isAdmin, async(req, res) => {
    const id = req.params.id;
    const usuario = await cnx.query("SELECT * FROM usuarios WHERE id = ? LIMIT 1", [id]);
    const roles = ['Administrador', 'Moderador'];
    res.render("autenticacion/editar", { usuario: usuario[0], roles: roles });
});

// editar usuario (por administrador)
router.post("/edit/:id", isLoggedIn, isAdmin, async(req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, rol, estado } = req.body;
    const filas = await cnx.query("SELECT EMAIL FROM usuarios WHERE id = ? LIMIT 1", [id]);
    let notificacion = 'Usuario actualizado exitosamente';

    const usuario = {
        NOMBRE: nombre,
        APELLIDO: apellido,
        ROL: rol,
        ESTADO: estado
    };

    let clave_plana = "";

    // se se hace cambio de email se envia correo electronico
    if (filas[0].EMAIL != email) {
        usuario.EMAIL = email;
        clave_plana = Math.floor((Math.random() * (99999 - 10000 + 1)) + 10000).toString();
        usuario.CLAVE = await helpers.encryptPassword(clave_plana);
    }

    const resultado = await cnx.query("UPDATE usuarios SET ? WHERE id = ? LIMIT 1", [usuario, id]);

    if (resultado.affectedRows == 1) {

        if (filas[0].EMAIL != email) {
            try {
                const mensaje = `Hola Sr(a) ${nombre} ${apellido} a continuación encontrará las nuevas credenciales de acceso a la plataforma: \n Email: ${email} \n Nueva contraseña: ${clave_plana}`;
                req.body.email = email;
                req.body.mensaje = mensaje;
                EmailCtrl.sendEmail(req);
                notificacion = 'Usuario actualizado exitosamente, credenciales de acceso enviadas a ' + email;
            } catch (error) {
                notificacion = "El usuario fue actualizado pero las credenciales no pudieron ser enviadas a: " + email;
            }
        }

        req.flash("success", notificacion);
    } else {
        req.flash("message", 'El registro del usuario no pudo ser actualizado');
    }
    res.redirect("/auth");
});

// mostrar perfil de usuario
router.get("/perfil", isLoggedIn, async(req, res) => {
    res.render("autenticacion/perfil");
});

// editar usuario (desde el perfil)
router.post("/perfil", isLoggedIn, async(req, res) => {
    const { email, password1, password2 } = req.body;
    let valido = true;
    const usuario = {
        EMAIL: email
    };

    if (password1 != '' && password2 != '') {
        valido = await helpers.matchPassword(password1, req.user.CLAVE);
        if (valido) {
            const password = await helpers.encryptPassword(password2);
            usuario.CLAVE = password;
        } else {
            req.flash("message", 'La contraseña actual no coincide con la ingresada en el formulario');
            res.redirect("/auth/perfil");
        }
    }

    if (valido) {
        const resultado = await cnx.query("UPDATE usuarios SET ? WHERE id = ? LIMIT 1", [usuario, req.user.id]);

        if (resultado.affectedRows == 1) {
            req.flash("success", 'Perfil actualizado exitosamente');
        } else {
            req.flash("message", 'El perfil no pudo ser actualizado');
        }
        res.redirect("/auth/perfil");
    }
});

/*-----REGISTRO Y EDICION DE ESTUDIANTES POR LOS DOCENTES AL CREAR CURSOS----*/

// mostrar formulario de registro de estudiantes (registro realizado por docentes)
router.get("/register_est/:id", isLoggedIn, isDocente, async(req, res) => {
    const { id } = req.params;
    const curso = await cnx.query("SELECT COUNT(ID) AS CANTIDAD, ID, ESTADO FROM cursos WHERE ID = ? AND FK_DOCENTE = ? LIMIT 1", [id, req.user.id]);
    if (curso[0].CANTIDAD == 1 && curso[0].ESTADO == 1) {
        res.render("autenticacion/register_est", { id });
    } else {
        res.render("403");
    }

});

// ejecutar registro de usuario, y registro en matriculas
router.post('/register_est/:id', isLoggedIn, isDocente, function(req, res, next) {

    const { id } = req.params;
    passport.authenticate('localSignup', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/auth/register_est/' + id); }

        // registro del estudiante en el curso
        const matricula = { FK_CURSO: id, FK_ESTUDIANTE: user.id };
        try {
            cnx.query("INSERT INTO matriculas SET ?", [matricula]);
        } catch (error) {
            req.flash("message", 'El estudiante no pudo ser matriculado');
        }

        return res.redirect('/auth/register_est/' + id);
    })(req, res, next);

});

// mostrar formulario edicion de usuarios estudiantes (edicion de estudiantes por docentes)
router.get("/edit_est/:idCurso/:idEst", isLoggedIn, isDocente, async(req, res) => {

    const { idCurso, idEst } = req.params;
    const curso = await cnx.query("SELECT COUNT(ID) AS CANTIDAD, ID, ESTADO FROM cursos WHERE ID = ? AND FK_DOCENTE = ? LIMIT 1", [idCurso, req.user.id]);
    if (curso[0].CANTIDAD == 1 && curso[0].ESTADO == 1) {
        const usuario = await cnx.query("SELECT * FROM usuarios WHERE id = ? LIMIT 1", [idEst]);
        res.render("autenticacion/editar_est", { usuario: usuario[0], curso: idCurso });
    } else {
        res.render("403");
    }

});

// editar usuario (por docente)
router.post("/edit_est/:idCurso/:idEst", isLoggedIn, isDocente, async(req, res) => {

    const { idCurso, idEst } = req.params;
    const est = await cnx.query("SELECT EMAIL FROM usuarios WHERE id = ? LIMIT 1", [idEst]);
    const { nombre, apellido, identificacion, telefono, email } = req.body;
    const usuario = {
        NOMBRE: nombre,
        APELLIDO: apellido,
        IDENTIFICACION: identificacion,
        TELEFONO: telefono
    };
    let notificacion = 'Estudiante actualizado exitosamente';
    let clave_plana = "";

    if (est[0].EMAIL != email) {
        usuario.EMAIL = email;
        clave_plana = Math.floor((Math.random() * (99999 - 10000 + 1)) + 10000).toString();
        usuario.CLAVE = await helpers.encryptPassword(clave_plana);
    }

    const resultado = await cnx.query("UPDATE usuarios SET ? WHERE id = ? LIMIT 1", [usuario, idEst]);

    if (resultado.affectedRows == 1) {

        // si se hizo cambio de email se envia un correo con las credenciales
        if (est[0].EMAIL != email) {

            try {
                const mensaje = `Sr(a) ${nombre} ${apellido} a continuación encontrará las nuevas credenciales de acceso a la plataforma: \n Email: ${email} \n Nueva contraseña: ${clave_plana}`;
                req.body.email = email;
                req.body.mensaje = mensaje;
                EmailCtrl.sendEmail(req);
                notificacion = 'Estudiante actualizado exitosamente, credenciales de acceso enviadas a ' + email;

            } catch (error) {
                notificacion = "El usuario fue actualizado pero las credenciales no pudieron ser enviadas a: " + email;
            }
        }

        req.flash("success", notificacion);
    } else {
        req.flash("message", 'El registro del estudiante no pudo ser actualizado');
    }
    res.redirect("/matriculas/" + idCurso);
});

// detalle del docente (consultando desde el curso)
router.get("/ver/:idDocente", isLoggedIn, isEstudiante, async(req, res) => {
    const { idDocente } = req.params;
    const resultado = await cnx.query("SELECT COUNT(ID) AS CANTIDAD, NOMBRE, APELLIDO, EMAIL, ROL FROM usuarios WHERE id = ? LIMIT 1", [idDocente]);

    if (resultado[0].CANTIDAD == 1) {
        const docente = resultado[0];
        res.render("autenticacion/detalle_docente_est", { usuario: docente });

    } else {
        res.render("404");
    }

});

module.exports = router;