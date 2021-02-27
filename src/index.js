const express = require("express");
const flash = require("connect-flash");
const expsesion = require("express-session");
const mysql_sesion = require("express-mysql-session");
const passport = require("passport");
const path = require("path"); // perite trabajar con directorios
const { database } = require("./config/keys");
require('./controllers/passport');

// inicializaciones -------------------------------
const app = express();

// settings ----------------------------------------

app.set("port", process.env.PORT || 3000);

// body parser
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
app.use(express.json()); //Used to parse JSON bodies

// motor de plantillas
app.set("view engine", "ejs");

// carpeta de vistas
app.set("views", path.join(__dirname + "/views"));

// carpeta archivos estaticos
app.use(express.static(path.join(__dirname + "/public"))); // con path.join nos aseguramos ue funcione en windows, MAC etc

// middelwares -------------------------------------
app.use(expsesion({
    secret: 'plansesion',
    resave: false,
    saveUninitialized: false,
    store: new mysql_sesion(database) // para que las sesiones se guarden en la bd
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// variables globales ------------------------------

app.use((req, res, next) => {
    app.locals.success = req.flash("success"); // se debe configurar las sesiones para que funcione
    app.locals.message = req.flash("message");
    app.locals.info = req.flash("info");
    app.locals.user = req.user; // variable global que almacena los datos del usuario en sesion
    app.locals.formatInt = function intNumbersFormat(num) {
        return (num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'));
    };
    app.locals.formatFloat = function floatNumbersFormat(num) {
        return (
            num
            .toFixed(2) // always two decimal digits
            // .replace('.', ',') // replace decimal point character with ,
            .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        );
    };
    next(); // para que continue la ejecucion del codigo
});

// routes ------------------------------------------

app.use("/", require("./routes/index.routes"));
app.use('/auth', require("./routes/autenticacion.routes"));
app.use('/servicios', require("./routes/servicios.routes"));
app.use('/deudores', require("./routes/deudores.routes"));
app.use('/deudas', require("./routes/deudas.routes"));

app.use((req, res, next) => {
    res.status(404).render("404");
});

// ejecucion servidor -----------------------------

app.listen(app.get("port"), () => {
    console.log("servidor escuchando por el puerto", app.get("port"));
});