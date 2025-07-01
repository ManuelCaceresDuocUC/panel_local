import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PanelPedidosLocal() {
  const [localSeleccionado, setLocalSeleccionado] = useState("HYATT");
  const [pedidos, setPedidos] = useState([]);

  const obtenerPedidos = async () => {
    if (!localSeleccionado) return;
    try {
      const response = await axios.get(
        `/api/pedidos?local=${encodeURIComponent(localSeleccionado)}`
      );
      setPedidos(response.data);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
    }
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      obtenerPedidos();
    }, 10000); // actualiza cada 10 segundos
    return () => clearInterval(intervalo);
  }, [localSeleccionado]);

  const avanzarEstado = async (idPedido) => {
    try {
      await axios.patch(`/api/pedidos/${idPedido}/estado`, null, {
  headers: {
    "Content-Type": "application/json"
  }
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

  const estadoColor = (estado) => {
    switch (estado) {
      case "pagado":
        return "bg-yellow-100 text-yellow-800";
      case "en preparación":
        return "bg-blue-100 text-blue-800";
      case "listo":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold mb-6">Panel de Pedidos del Local</h1>

      <div className="mb-4">
        <label className="font-medium">Seleccionar local: </label>
        <select
          value={localSeleccionado}
          onChange={(e) => setLocalSeleccionado(e.target.value)}
          className="ml-2 p-1 border rounded"
        >
          <option value="HYATT">HYATT</option>
        </select>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Pedido</th>
            <th className="p-2 border">Cliente</th>
            <th className="p-2 border">Productos</th>
            <th className="p-2 border">Estado</th>
            <th className="p-2 border">Acción</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className="border-t hover:bg-gray-50">
              <td className="p-2 border font-mono">#{pedido.id}</td>
              <td className="p-2 border">{pedido.nombreCliente || "-"}</td>
              <td className="p-2 border whitespace-pre-wrap">{pedido.detalle}</td>
              <td className={`p-2 border font-semibold ${estadoColor(pedido.estado)}`}>{pedido.estado}</td>
              <td className="p-2 border">
                {pedido.estado !== "listo" && (
                  <button
                    onClick={() => avanzarEstado(pedido.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
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
  );
}
