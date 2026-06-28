import KanbanColumn from "@/components/KanbanColumn";
import { ensureBoardShape } from "@/utils/sheetDataTransformer";

export default function KanbanBoard({ board, showDepartment = false, statusColors, statusNames }) {
  const columns = ensureBoardShape(board);

  if (columns.length === 0) {
    return (
      <section className="glass-panel rounded-lg p-5">
        <p className="text-sm text-muted-foreground">No round configuration exists for this process yet.</p>
      </section>
    );
  }

  return (
    /* On mobile: vertical stack, each column is h-[380px].
       On lg+: horizontal row, overflow-x-auto, each column is lg:h-full.
       The parent flex-1 min-h-0 in the page ensures lg desktop columns fill the available height. */
    <div className="flex flex-col gap-4 h-full lg:flex-row lg:items-stretch lg:overflow-x-auto lg:overflow-y-hidden lg:pb-2">
      {columns.map((column) => (
        <KanbanColumn
          key={column.roundId}
          column={column}
          showDepartment={showDepartment}
          statusColors={statusColors}
          statusNames={statusNames}
        />
      ))}
    </div>
  );
}
