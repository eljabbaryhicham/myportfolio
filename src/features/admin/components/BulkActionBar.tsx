
'use client';

import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onToggleVisibility?: () => void;
  allSelectedVisible?: boolean;
  className?: string;
}

export default function BulkActionBar({ selectedCount, onClearSelection, onDelete, onToggleVisibility, allSelectedVisible, className }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
      "flex items-center gap-3 px-5 py-3 rounded-xl",
      "bg-background/95 backdrop-blur-md border border-white/10 shadow-2xl",
      "animate-in fade-in slide-in-from-bottom-4 duration-200",
      className
    )}>
      <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
        {selectedCount} selected
      </span>

      <div className="w-px h-5 bg-white/10" />

      {onToggleVisibility && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          className="gap-2"
        >
          <FontAwesomeIcon icon={allSelectedVisible ? faEyeSlash : faEye} className="h-4 w-4" />
          {allSelectedVisible ? 'Hide' : 'Show'}
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="gap-2 text-destructive hover:text-destructive"
      >
        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
        Delete
      </Button>

      <div className="w-px h-5 bg-white/10" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onClearSelection}
      >
        <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
      </Button>
    </div>
  );
}
