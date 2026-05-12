"use client";

import { useState } from "react";
import { ArchitectureForm } from "./architecture-form";

type Labels = {
  heading: string;
  edit: string;
  add: string;
  save: string;
  saving: string;
  cancel: string;
  editor_hint: string;
};

export function ArchitectureSection({
  projectId,
  canEdit,
  children,
  rawSource,
  labels,
}: {
  projectId: string;
  canEdit: boolean;
  children: React.ReactNode;
  rawSource: string;
  labels: Labels;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-semibold">{labels.heading}</h2>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-accent hover:underline"
          >
            {rawSource ? labels.edit : labels.add}
          </button>
        )}
      </div>
      {editing ? (
        <ArchitectureForm
          projectId={projectId}
          initialValue={rawSource}
          onClose={() => setEditing(false)}
          labels={{
            save: labels.save,
            saving: labels.saving,
            cancel: labels.cancel,
            hint: labels.editor_hint,
          }}
        />
      ) : (
        children
      )}
    </section>
  );
}
