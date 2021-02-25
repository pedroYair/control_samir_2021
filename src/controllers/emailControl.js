var nodemailer = require('nodemailer');
// email sender function
try {
    exports.sendEmail = function(req) {
        // Definimos el transporter
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'dondesamir@gmail.com',
                pass: 'Samir301996'
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        // Definimos el email
        var mailOptions = {
            from: 'dondesamir@gmail.com',
            to: req.body.email,
            subject: 'Credenciales inicio de sesión Control Samir',
            text: req.body.mensaje
        };
        // Enviamos el email
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error.message);
                console.log("Verifique que el correo de la plataforma permita el acceso a aplicaciones no seguras");
                // res.send(500, error.message);
            } else {
                console.log("Email enviado");
                // res.status(200).jsonp(req.body);
            }
        });
    };

} catch (error) {
    console.log("El email no pudo ser enviado verifique que el correo de la plataforma permita el acceso a aplicaciones no seguras");
}
