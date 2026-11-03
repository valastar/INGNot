"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { PALETA } from "./tema";

export type Clase = { id: string; nombre: string; color: string };

const COLORES = PALETA.slice(0, 6);
const AVISO = "clases:cambio";
const avisar = () => window.dispatchEvent(new Event(AVISO));

export function useClases() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cargar = () =>
      supabase.from("clases").select("id,nombre,color").order("created_at").then(({ data }) => {
        setClases(data ?? []);
        setReady(true);
      });
    cargar();
    window.addEventListener(AVISO, cargar);
    return () => window.removeEventListener(AVISO, cargar);
  }, []);

  const agregar = async (nombre: string) => {
    const color = COLORES[clases.length % COLORES.length];
    const { data } = await supabase.from("clases").insert({ nombre: nombre.trim(), color }).select("id,nombre,color").single();
    if (data) { setClases((c) => [...c, data]); avisar(); }
  };

  const borrar = async (id: string) => {
    await supabase.from("clases").delete().eq("id", id);
    setClases((c) => c.filter((x) => x.id !== id));
    avisar();
  };

  return { clases, ready, agregar, borrar };
}