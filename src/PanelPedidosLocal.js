// src/PanelPedidosLocal.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import "./PanelPedidosLocal.css";

const API_BASE_URL = "https://realbarlacteo-1.onrender.com";
const estadosOrden = ["pagado", "en preparación", "listo", "entregado"];

export default function PanelPedidosLocal() {
  const [localSeleccionado, setLocalSeleccionado] = useState("HYATT");
  const [pedidos, setPedidos] = useState([]);
  const [ultimoPedidoId, setUltimoPedidoId] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [soloHoy, setSoloHoy] = useState(true);
  const sonidoRef = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/notificacion.mp3") : null);

  const normalizarFecha = (p) => {
    const raw = p.fecha || p.createdAt || p.fechaHora;
    if (!raw) return null;
    try {
      return raw.length >= 10 ? raw.slice(0, 10) : null;
    } catch {
      return null;
    }
  };

  const obtenerPedidos = async () => {
    if (!localSeleccionado) return;
    try {
      const params = { local: localSeleccionado };
      // Si tu API soporta filtro por fecha en servidor, descomenta:
      // if (soloHoy && filtroFecha) params.fecha = filtroFecha;

      const { data } = await axios.get(`${API_BASE_URL}/api/pedidos`, { params });
      const nuevosPedidos = Array.isArray(data) ? data : data.pedidos || [];
      setPedidos(nuevosPedidos);

      const nuevo = nuevosPedidos.find(
        (p) => p.estado === "pagado" && p.id !== ultimoPedidoId
      );
      if (nuevo && sonidoRef.current) {
        sonidoRef.current.play().catch(() => {});
        setUltimoPedidoId(nuevo.id);
      }
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
    }
  };

  useEffect(() => {
    const sonido = typeof Audio !== "undefined" ? new Audio("/sounds/notificacion.mp3") : null;
    const permitirAudio = () => {
      if (sonido) sonido.play().catch(() => {});
      window.removeEventListener("click", permitirAudio);
    };
    window.addEventListener("click", permitirAudio);

    const intervalo = setInterval(obtenerPedidos, 10000);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("click", permitirAudio);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Eliminar pedido
  const eliminarPedido = async (idPedido) => {
    const ok = window.confirm(`¿Eliminar el pedido #${idPedido}? Esta acción es irreversible.`);
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/pedidos/${idPedido}`);
      setPedidos((prev) => prev.filter((p) => p.id !== idPedido));
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
    }
  };

  // Limpiar solo la vista
  const limpiarLista = () => {
    const ok = window.confirm("¿Vaciar la lista visible? No elimina datos del backend.");
    if (!ok) return;
    setPedidos([]);
  };

  const pedidosFiltrados = useMemo(() => {
    if (!soloHoy || !filtroFecha) return pedidos;
    return pedidos.filter((p) => normalizarFecha(p) === filtroFecha);
  }, [pedidos, soloHoy, filtroFecha]);

  return (
    <div className="fondo">
      <div className="panel">
        <div className="caja-blanca">
          <h1 className="titulo">Panel de Pedidos del Local</h1>

          <div className="selector-local" style={{ gap: 12, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <label>Seleccionar local: </label>
            <select
              value={localSeleccionado}
              onChange={(e) => setLocalSeleccionado(e.target.value)}
            >
              <option value="HYATT">HYATT</option>
            </select>

            <label style={{ marginLeft: 16 }}>
              <input
                type="checkbox"
                checked={soloHoy}
                onChange={(e) => setSoloHoy(e.target.checked)}
              />{" "}
              Filtrar por día
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              disabled={!soloHoy}
            />

            <button className="boton-accion" onClick={obtenerPedidos}>Actualizar</button>
            <button className="boton-accion boton-retroceder" onClick={limpiarLista} title="Vacía la tabla local">
              Limpiar lista
            </button>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(pedidosFiltrados) && pedidosFiltrados.length > 0 ? (
                  pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td>
                      <td>{pedido.telefono || "-"}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{pedido.detalle}</td>
                      <td>{normalizarFecha(pedido) || "-"}</td>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {pedido.estado !== "entregado" && (
                            <button onClick={() => avanzarEstado(pedido.id)} className="boton-accion">
                              Marcar como "{siguienteEstado(pedido.estado)}"
                            </button>
                          )}
                          {pedido.estado !== "pagado" && (
                            <button onClick={() => retrocederEstado(pedido.id)} className="boton-accion boton-retroceder">
                              ← Volver a "{estadoAnterior(pedido.estado)}"
                            </button>
                          )}
                          <button
                            onClick={() => eliminarPedido(pedido.id)}
                            className="boton-accion"
                            style={{ backgroundColor: "#e11d48" }}
                            title="Eliminar definitivamente este pedido"
                          >
                            Eliminar pedido
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", opacity: 0.7 }}>
                      Sin pedidos para el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
