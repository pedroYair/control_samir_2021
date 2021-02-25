module.exports = {

    isLoggedIn(req, res, next) { // para proteger vistas cuando el usuario no este logueado
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect("/auth/login");
    },
    isNotLoggedIn(req, res, next) { // para que el usuario no vea estas vistas cuando este logueado
        if (!req.isAuthenticated()) {
            return next();
        }
        return res.redirect("/");
    },
    isAdmin(req, res, next) {
        if (req.user.ROL == 'Administrador') {
            return next();
        }
        return res.redirect("/");
    },
    isDocente(req, res, next) {
        if (req.user.ROL == 'Docente') {
            return next();
        }
        return res.redirect("/");
    },
    isEstudiante(req, res, next) {
        if (req.user.ROL == 'Estudiante') {
            return next();
        }
        return res.redirect("/");
    }
};