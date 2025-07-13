import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./PanelPedidosLocal.css";

const API_BASE_URL = "https://realbarlacteo-1.onrender.com";
const estadosOrden = ["pagado", "en preparación", "listo", "entregado"];

export default function PanelPedidosLocal() {
  const [localSeleccionado, setLocalSeleccionado] = useState("HYATT");
  const [pedidos, setPedidos] = useState([]);
  const [ultimoPedidoId, setUltimoPedidoId] = useState(null);
  const sonidoRef = useRef(new Audio("/sounds/notificacion.mp3"));

  const obtenerPedidos = async () => {
    if (!localSeleccionado) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/pedidos?local=${encodeURIComponent(localSeleccionado)}`
      );
      const nuevosPedidos = Array.isArray(response.data)
        ? response.data
        : response.data.pedidos || [];

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

    const intervalo = setInterval(obtenerPedidos, 10000);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("click", permitirAudio);
    };
  }, [localSeleccionado, ultimoPedidoId]);

  const siguienteEstado = (estadoActual) => {
    const index = estadosOrden.indexOf(estadoActual);
    return estadosOrden[index + 1] || estadoActual;
  };

  const estadoAnterior = (estadoActual) => {
    const index = estadosOrden.indexOf(estadoActual);
    return estadosOrden[index - 1] || estadoActual;
  };

  const avanzarEstado = async (idPedido) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/pedidos/${idPedido}/estado`);
      obtenerPedidos();
    } catch (error) {
      console.error("Error al avanzar estado:", error);
    }
  };

  const retrocederEstado = async (idPedido) => {
    const pedido = pedidos.find((p) => p.id === idPedido);
    if (!pedido) return;

    const nuevoEstado = estadoAnterior(pedido.estado);
    if (nuevoEstado === pedido.estado) return;

    try {
      await axios.put(
        `${API_BASE_URL}/api/pedidos/${idPedido}/estado-manual`,
        { estado: nuevoEstado },
        { headers: { "Content-Type": "application/json" } }
      );
      obtenerPedidos();
    } catch (error) {
      console.error("Error al retroceder estado:", error);
    }
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
                      <td style={{ whiteSpace: "pre-wrap" }}>{pedido.detalle}</td>
                      <td
                        className={
                          pedido.estado === "pagado"
                            ? "estado-pagado"
                            : pedido.estado === "en preparación"
                            ? "estado-preparacion"
                            : pedido.estado === "listo"
                            ? "estado-listo"
                            : pedido.estado === "entregado"
                            ? "estado-entregado"
                            : ""
                        }
                      >
                        {pedido.estado}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {pedido.estado !== "entregado" && (
                            <button
                              onClick={() => avanzarEstado(pedido.id)}
                              className="boton-accion"
                            >
                              Marcar como "{siguienteEstado(pedido.estado)}"
                            </button>
                          )}
                          {pedido.estado !== "pagado" && (
                            <button
                              onClick={() => retrocederEstado(pedido.id)}
                              className="boton-accion boton-retroceder"
                            >
                              ← Volver a "{estadoAnterior(pedido.estado)}"
                            </button>
                          )}
                        </div>
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
