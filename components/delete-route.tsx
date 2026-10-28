"use client";

import { useState } from "react";
import { deleteRoute } from "@/app/routes/actions";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/preferences";

const copy = {
  de: { ask: "Löschen", question: "Diese Route löschen?", confirm: "Wirklich löschen", keep: "Behalten" },
  en: { ask: "Delete", question: "Delete this route?", confirm: "Really delete", keep: "Keep" },
} as const;

export function DeleteRoute({ id, language }: { id: string; language: Language }) {
  const [confirming, setConfirming] = useState(false);
  const text = copy[language];

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        {text.ask}
      </Button>
    );
  }

  return (
    <form action={deleteRoute} className="flex flex-wrap items-center justify-end gap-2">
      <p className="text-sm">{text.question}</p>
      <input type="hidden" name="id" value={id} />
      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        {text.keep}
      </Button>
      <Button type="submit" size="sm" variant="destructive">
        {text.confirm}
      </Button>
    </form>
  );
}
