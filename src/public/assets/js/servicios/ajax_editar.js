/* permite obtener los datos del servicio a editar */

$(function() {
    $(document).on('click', 'a', function(event) {
        let id = this.id;
        if (id != undefined) {
            if (id.indexOf("ser") != -1) {
                const idServicio = id.substring(3);

                $.ajax({
                    type: 'post',
                    url: "/servicios/obtener_servicio",
                    data: { 'idServicio': idServicio},
                    dataType: 'text'
                }).done(function(data) {
                    let object = JSON.parse(data);
                        document.getElementById("nombre_editar").value = object.nombre;
                        document.getElementById("precio_editar").value = object.precio;
                        document.getElementById("nota_editar").value = object.nota;
                        let estado = document.getElementById(`estado${object.estado}`);
                        estado.selected = true;
                        document.getElementById("idServicio").value = object.id;
                        $('#modal-default-editar').modal('show');
                });
            }
        }

    });
});