"use client";
import Image from "next/image";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Star,
  Trash2,
} from "lucide-react";
import { MediaUpload } from "./ui";
import type { MediaItem } from "@/lib/mari/types";

type Props = {
  images: MediaItem[];
  setImages: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  onUploaded: (image: MediaItem) => void;
  onRemove: (image: MediaItem) => void | Promise<void>;
};

function SortablePhoto({
  image,
  index,
  count,
  setImages,
  onRemove,
}: {
  image: MediaItem;
  index: number;
  count: number;
  setImages: Props["setImages"];
  onRemove: Props["onRemove"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });
  const move = (step: number) =>
    setImages((items) => arrayMove(items, index, index + step));
  return (
    <div
      ref={setNodeRef}
      className={`image-editor-item ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className="image-drag-handle"
        aria-label={`Arrastar foto ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <Image
        src={`/media/${image.key}`}
        unoptimized
        alt={image.alt}
        width={260}
        height={180}
      />
      <div>
        {index === 0 ? (
          <span className="cover-label">
            <Star size={13} /> CAPA
          </span>
        ) : (
          <button
            className="text-button"
            type="button"
            onClick={() =>
              setImages((items) => [
                image,
                ...items.filter((item) => item.id !== image.id),
              ])
            }
          >
            Definir como capa
          </button>
        )}
        <button
          className="icon-button"
          type="button"
          aria-label={`Mover foto ${index + 1} para esquerda`}
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={`Mover foto ${index + 1} para direita`}
          disabled={index === count - 1}
          onClick={() => move(1)}
        >
          <ArrowRight size={16} />
        </button>
        <button
          className="icon-button danger-text"
          type="button"
          aria-label={`Remover foto ${index + 1}`}
          onClick={() => onRemove(image)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export function SortableMediaGallery({
  images,
  setImages,
  onUploaded,
  onRemove,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function dragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    setImages((items) => {
      const from = items.findIndex((item) => item.id === event.active.id);
      const to = items.findIndex((item) => item.id === event.over?.id);
      return from < 0 || to < 0 ? items : arrayMove(items, from, to);
    });
  }
  return (
    <div className="sortable-gallery">
      <div className="gallery-editor-heading">
        <p>Arraste as fotos para reorganizar. A primeira imagem será a capa.</p>
        <strong aria-live="polite">
          {images.length}{" "}
          {images.length === 1 ? "imagem selecionada" : "imagens selecionadas"}
        </strong>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={dragEnd}
      >
        <SortableContext
          items={images.map((image) => image.id)}
          strategy={rectSortingStrategy}
        >
          <div className="image-editor-grid">
            {images.map((image, index) => (
              <SortablePhoto
                key={image.id}
                image={image}
                index={index}
                count={images.length}
                setImages={setImages}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <MediaUpload multiple onUploaded={onUploaded} />
    </div>
  );
}
