const mysql = require("mysql");
const { promisify } = require("util");
const { database } = require("./keys");
const cnx = mysql.createPool(database);

cnx.getConnection((err, connection) => {
    if (err) {
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.error("Error: La conexion con la base de datos fue cerrada");
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
            console.error("Error: demasiadas conexiones a la base de datos");
        }
        if (err.code === "ECONNREFUSED") {
            console.error("Error: La conexion fue rechazada");
        }
    }
    if (connection) {
        connection.release();
        console.log("---Base de datos conectada---");
        return;
    }
});

cnx.query = promisify(cnx.query); // de esta forma cada que vez que se haga un query puedo usar async y await o promesas
module.exports = cnx;