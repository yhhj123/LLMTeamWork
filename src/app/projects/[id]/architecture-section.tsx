"use client";

import { useState } from "react";
import { ArchitectureForm } from "./architecture-form";

export function ArchitectureSection({
  projectId,
  canEdit,
  children,
  rawSource,
}: {
  projectId: string;
  canEdit: boolean;
  children: React.ReactNode;
  rawSource: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-semibold">Architecture</h2>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-accent hover:underline"
          >
            {rawSource ? "Edit" : "+ Add architecture"}
          </button>
        )}
      </div>
      {editing ? (
        <ArchitectureForm
          projectId={projectId}
          initialValue={rawSource}
          onClose={() => setEditing(false)}
        />
      ) : (
        children
      )}
    </section>
  );
}
