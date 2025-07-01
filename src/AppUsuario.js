// src/AppUsuario.js
import React, { useEffect, useState } from "react";
import Catalogo from "./Catalogo"; // 👈 asegúrate que el path sea correcto

export default function AppUsuario() {
  const [cliente, setCliente] = useState(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [local, setLocal] = useState("");

  useEffect(() => {
    const clienteGuardado = localStorage.getItem("cliente");
    if (clienteGuardado) {
      setCliente(JSON.parse(clienteGuardado));
    }
  }, []);

  const registrar = () => {
    if (!nombre || !telefono) return;
    const nuevoCliente = { nombre, telefono };
    localStorage.setItem("cliente", JSON.stringify(nuevoCliente));
    setCliente(nuevoCliente);
  };

  if (!cliente) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Bienvenido a Bar Lácteo</h1>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 block mb-2 w-full"
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="border p-2 block mb-4 w-full"
        />
        <button
          onClick={registrar}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Ingresar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Hola, {cliente.nombre} 👋</h1>
      <p className="mb-2">Selecciona tu local para ver el catálogo:</p>
      <select
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="border p-2 block mb-4"
      >
        <option value="">-- Selecciona un local --</option>
        <option value="HYATT">HYATT</option>
        <option value="ALDEA">ALDEA</option>
      </select>

      {local && <Catalogo />}
    </div>
  );
}
