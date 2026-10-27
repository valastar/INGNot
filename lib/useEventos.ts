"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Tipo = "examen" | "entrega" | "pendiente";
export type Evento = { id: string; titulo: string; fecha: string; tipo: Tipo; hecho: boolean };

export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.from("eventos").select("id,titulo,fecha,tipo,hecho").order("fecha").then(({ data }) => {
      setEventos((data as Evento[]) ?? []);
      setReady(true);
    });
  }, []);

  const agregar = async (titulo: string, fecha: string, tipo: Tipo) => {
    const { data } = await supabase.from("eventos").insert({ titulo, fecha, tipo }).select("id,titulo,fecha,tipo,hecho").single();
    if (data) setEventos((l) => [...l, data as Evento].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  };

  const alternar = async (e: Evento) => {
    await supabase.from("eventos").update({ hecho: !e.hecho }).eq("id", e.id);
    setEventos((l) => l.map((x) => (x.id === e.id ? { ...x, hecho: !x.hecho } : x)));
  };

  const borrar = async (id: string) => {
    await supabase.from("eventos").delete().eq("id", id);
    setEventos((l) => l.filter((x) => x.id !== id));
  };

  return { eventos, ready, agregar, alternar, borrar };
}
