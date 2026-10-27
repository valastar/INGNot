"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Nota = {
  id: string;
  titulo: string;
  contenido: string;
  actualizada: string;
  etiquetas: string[];
  fijada: boolean;
};

const COLS = "id,titulo,contenido,actualizada,etiquetas,fijada";
type Cambios = Partial<Pick<Nota, "titulo" | "contenido" | "etiquetas" | "fijada">>;

export function useNotas(scope: string) {
  const claseId = scope === "rapidas" ? null : scope;
  const [notas, setNotas] = useState<Nota[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let q = supabase.from("notas").select(COLS);
    q = claseId ? q.eq("clase_id", claseId) : q.is("clase_id", null);
    q.order("actualizada", { ascending: false }).then(({ data, error }) => {
      if (error) console.error("notas:", error.message, "(¿ejecutaste supabase/notas-v2.sql?)");
      setNotas(((data as Nota[]) ?? []).map((n) => ({ ...n, etiquetas: n.etiquetas ?? [], fijada: !!n.fijada })));
      setReady(true);
    });
  }, [claseId]);

  const crear = async (): Promise<string | null> => {
    const { data } = await supabase.from("notas").insert({ clase_id: claseId }).select("id").single();
    return data?.id ?? null;
  };

  const actualizar = async (id: string, cambios: Cambios) => {
    const actualizada = new Date().toISOString();
    await supabase.from("notas").update({ ...cambios, actualizada }).eq("id", id);
    setNotas((lista) => lista.map((n) => (n.id === id ? { ...n, ...cambios, actualizada } : n)));
  };

  const borrar = async (id: string) => {
    await supabase.from("notas").delete().eq("id", id);
    setNotas((lista) => lista.filter((n) => n.id !== id));
  };

  return { notas, ready, crear, actualizar, borrar };
}
