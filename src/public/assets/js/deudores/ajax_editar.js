/* permite obtener los datos del deudor a editar */

$(function() {
    $(document).on('click', 'a', function(event) {
        let id = this.id;
        if (id != undefined) {
            if (id.indexOf("deu") != -1) {
                const idDeudor = id.substring(3);

                $.ajax({
                    type: 'post',
                    url: "/deudores/obtener_deudor",
                    data: { 'idDeudor': idDeudor },
                    dataType: 'text'
                }).done(function(data) {
                    let object = JSON.parse(data);
                        document.getElementById("nombre_editar").value = object.nombre;
                        document.getElementById("apellido_editar").value = object.apellido;
                        let estado = document.getElementById(`estado${object.estado}`);
                        estado.selected = true;
                        document.getElementById("idDeudor").value = object.id;
                        $('#modal-default-editar').modal('show');
                });
            }
        }

    });
});