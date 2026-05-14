import KanbanColumn from "@/components/KanbanColumn";
import { ensureBoardShape } from "@/utils/sheetDataTransformer";

export default function KanbanBoard({ board }) {
  const columns = ensureBoardShape(board);

  if (columns.length === 0) {
    return (
      <section className="glass-panel rounded-[1.25rem] p-5">
        <p className="text-sm text-textMuted">No round configuration exists for this process yet.</p>
      </section>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:overflow-x-auto lg:overflow-y-hidden lg:pb-2">
      {columns.map((column) => (
        <KanbanColumn
          key={column.roundId}
          column={column}
        />
      ))}
    </div>
  );
}
