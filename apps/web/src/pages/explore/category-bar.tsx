interface CategoryBarProps {
  readonly categories: readonly string[];
  readonly selected: string | null;
  readonly onSelect: (category: string | null) => void;
}

export default function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div
      className="cgraph-segmented scrollbar-hide max-w-full overflow-x-auto"
      role="group"
      aria-label="Community categories"
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="cgraph-segmented-item shrink-0 px-3 text-sm font-medium"
        aria-pressed={selected === null}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat === selected ? null : cat)}
          className="cgraph-segmented-item shrink-0 px-3 text-sm font-medium capitalize"
          aria-pressed={selected === cat}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
