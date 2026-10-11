import {
  DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableRow = ({ id, label, children }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      className={`sortable-row${isDragging ? " dragging" : ""}`}
      style={{
        "--drag-transform": CSS.Translate.toString(transform) ?? "none",
        "--drag-transition": transition ?? "none",
      }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="drag-handle"
        aria-label={`Reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      {children}
    </li>
  );
};

// The one reorderable list (Up next, playlists). Only the handle starts a drag,
// so clicking a row still plays it and swiping elsewhere still scrolls.
export const SortableList = ({ items, getId, getLabel, renderItem, onMove }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  const labelOf = (id) => getLabel(items[ids.indexOf(id)]);
  const position = (id) => ids.indexOf(id) + 1;

  const announcements = {
    onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}.`,
    // dnd-kit reports the item over itself right after pickup; don't overwrite "Picked up".
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id ? `Moved to position ${position(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${labelOf(active.id)} at position ${position(over.id)}.` : "Dropped.",
    onDragCancel: ({ active }) => `Cancelled. ${labelOf(active.id)} returned to its place.`,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements }}
      onDragEnd={({ active, over }) => over && onMove(active.id, ids.indexOf(over.id))}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="song-list">
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)} label={getLabel(item)}>
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};
