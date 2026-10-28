"use client";

import { useState } from "react";
import { deleteRoute } from "@/app/routes/actions";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/preferences";

const copy = {
  de: { ask: "Löschen", question: "Diese Route löschen?", confirm: "Wirklich löschen" },
  en: { ask: "Delete", question: "Delete this route?", confirm: "Really delete" },
} as const;

export function DeleteRoute({ id, language }: { id: string; language: Language }) {
  const [confirming, setConfirming] = useState(false);
  const text = copy[language];

  if (!confirming) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)}>
        {text.ask}
      </Button>
    );
  }

  return (
    <form action={deleteRoute} className="flex flex-col items-start gap-2">
      <p>{text.question}</p>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="destructive">
        {text.confirm}
      </Button>
    </form>
  );
}
