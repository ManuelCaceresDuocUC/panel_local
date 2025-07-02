import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./PanelPedidosLocal.css";

export default function PanelPedidosLocal() {
  const [localSeleccionado, setLocalSeleccionado] = useState("HYATT");
  const [pedidos, setPedidos] = useState([]);
  const [ultimoPedidoId, setUltimoPedidoId] = useState(null);
  const sonidoRef = useRef(new Audio("/sounds/notificacion.mp3"));

  const obtenerPedidos = async () => {
    if (!localSeleccionado) return;
    try {
      const response = await axios.get(`https://realbarlacteo-1.onrender.com/api/pedidos?local=${encodeURIComponent(localSeleccionado)}`);
;
      console.log("Respuesta del backend:", response.data);

      const nuevosPedidos = Array.isArray(response.data)
        ? response.data
        : response.data.pedidos || [];

      if (!Array.isArray(nuevosPedidos)) {
        console.error("Respuesta inesperada del backend:", response.data);
        return;
      }

      setPedidos(nuevosPedidos);

      const nuevo = nuevosPedidos.find(
        (p) => p.estado === "pagado" && p.id !== ultimoPedidoId
      );

      if (nuevo) {
        sonidoRef.current.play().catch(() => {});
        setUltimoPedidoId(nuevo.id);
      }
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
    }
  };

  useEffect(() => {
    const sonido = new Audio("/sounds/notificacion.mp3");

    const permitirAudio = () => {
      sonido.play().catch(() => {});
      window.removeEventListener("click", permitirAudio);
    };
    window.addEventListener("click", permitirAudio);

    const intervalo = setInterval(async () => {
      try {
        const response = await axios.get(`https://realbarlacteo-1.onrender.com/api/pedidos?local=${encodeURIComponent(localSeleccionado)}`);
;
        console.log("Respuesta del backend (intervalo):", response.data);

        const nuevosPedidos = Array.isArray(response.data)
          ? response.data
          : response.data.pedidos || [];

        if (!Array.isArray(nuevosPedidos)) {
          console.error("Respuesta inesperada del backend:", response.data);
          return;
        }

        setPedidos(nuevosPedidos);

        const nuevoPedido = nuevosPedidos.find(
          (p) => p.estado === "pagado" && p.id !== ultimoPedidoId
        );

        if (nuevoPedido) {
          sonido.play().catch(() => {});
          setUltimoPedidoId(nuevoPedido.id);
        }
      } catch (error) {
        console.error("Error al obtener pedidos:", error);
      }
    }, 10000); // actualiza cada 10 segundos

    return () => {
      clearInterval(intervalo);
      window.removeEventListener("click", permitirAudio);
    };
  }, [localSeleccionado, ultimoPedidoId]);

  const avanzarEstado = async (idPedido) => {
    try {
      await axios.patch(`/api/pedidos/${idPedido}/estado`, null, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      obtenerPedidos();
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    }
  };

  const estadosOrden = ["pagado", "en preparación", "listo"];

  const siguienteEstado = (estadoActual) => {
    const index = estadosOrden.indexOf(estadoActual);
    return estadosOrden[index + 1] || estadoActual;
  };

  return (
    <div className="fondo">
      <div className="panel">
        <div className="caja-blanca">
          <h1 className="titulo">Panel de Pedidos del Local</h1>

          <div className="selector-local">
            <label>Seleccionar local: </label>
            <select
              value={localSeleccionado}
              onChange={(e) => setLocalSeleccionado(e.target.value)}
            >
              <option value="HYATT">HYATT</option>
            </select>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(pedidos) &&
                  pedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td>
                      <td>{pedido.telefono || "-"}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        {pedido.detalle}
                      </td>
                      <td
                        className={
                          pedido.estado === "pagado"
                            ? "estado-pagado"
                            : pedido.estado === "en preparación"
                            ? "estado-preparacion"
                            : pedido.estado === "listo"
                            ? "estado-listo"
                            : ""
                        }
                      >
                        {pedido.estado}
                      </td>
                      <td>
                        {pedido.estado !== "listo" && (
                          <button
                            onClick={() => avanzarEstado(pedido.id)}
                            className="boton-accion"
                          >
                            Marcar como "{siguienteEstado(pedido.estado)}"
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
