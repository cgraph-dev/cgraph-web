import { Button } from '@/components/ui/button';
import type { CategoryButtonProps } from './types';

export function CategoryButton({ category, isActive, onClick }: CategoryButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      animated={false}
      leftIcon={category.icon}
      aria-pressed={isActive}
      className="min-h-9 whitespace-nowrap rounded-md border-transparent px-3 py-2 shadow-none"
    >
      {category.name}
    </Button>
  );
}
