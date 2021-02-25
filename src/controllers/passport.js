const passport = require("passport");
const LocalStategy = require('passport-local').Strategy;
const cnx = require("../config/databaseConecction");
const helpers = require("./herlpers");
const EmailCtrl = require('./emailControl');

passport.use('localSignup', new LocalStategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async(req, username, password, done) => {

    const { nombre, apellido, rol } = req.body;
    const newUser = {
        EMAIL: username,
        CLAVE: password,
        NOMBRE: nombre,
        APELLIDO: apellido,
        ROL: rol
    }
    newUser.CLAVE = await helpers.encryptPassword(password);
    const resultado = await cnx.query("INSERT INTO usuarios SET  ?", [newUser]);
    newUser.id = resultado.insertId;

    if (resultado.insertId) {
        try {
            
            const mensaje = `Hola Sr(a) ${nombre} ${apellido} a continuación encontrará las credenciales de acceso a la plataforma: \n Email: ${username} \n Contraseña: ${password}`;
            req.body.email = username;
            req.body.mensaje = mensaje;
            EmailCtrl.sendEmail(req);
            
            return done(null, newUser, req.flash("success", "Usuario registrado. Credenciales enviadas a: " + username));
        } catch (error) {
            return done(null, newUser, req.flash("message", "El usuario fue registrado pero las credenciales no pudieron ser enviadas a: " + username));
        }
    } else {
        return done(null, newUser, req.flash("message", "El usuario no pudo ser registrado"));
    }
}));

// control de login
passport.use('localLogin', new LocalStategy({
    usernameField: 'email', // atributo name del campo que almacena el nombre de usuario en el form
    passwordField: 'password', // atributo name del campo que almacena la contraseña en el form
    passReqToCallback: true
}, async(req, username, password, done) => {
    const filas = await cnx.query("SELECT * FROM usuarios WHERE EMAIL = ? LIMIT 1", [username]);

    if (filas.length > 0) {
        const usuario = filas[0];
        const valido = await helpers.matchPassword(password, usuario.CLAVE);

        if (valido) {
            done(null, usuario, req.flash("success", "Bienvenido " + usuario.NOMBRE + " " + usuario.APELLIDO));
        } else {
            done(null, false, req.flash("message", "Email o contraseña incorrecta"));
        }
    } else {
        done(null, false, req.flash("message", "No existe una cuenta asociada a " + username));
    }
}));

// guardar el usuario dentro de la sesion, guardando su id
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// obtener los datos del usuario mediante su id
passport.deserializeUser(async(id, done) => {
    const usuarios = await cnx.query("SELECT * FROM usuarios WHERE id = ? LIMIT 1", [id]);
    done(null, usuarios[0]);
});