import React from 'react';
import { cn } from '@/lib/utils';
import { getEntityColors } from '@/lib/entityColors';

const IMAGE_SIZE = { xs: 'w-4 h-4', sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10' };
const ICON_SIZE  = { xs: 'w-3 h-3', sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
const BOX_PAD    = { xs: 'p-1',     sm: 'p-1.5',   md: 'p-2',     lg: 'p-2.5' };
const BOX_ROUND  = { xs: 'rounded', sm: 'rounded-md', md: 'rounded-lg', lg: 'rounded-lg' };

// entity: any object with { entity_type, image_url?, name? }
// size: 'xs' | 'sm' | 'md' | 'lg'
// boxed: when true renders the icon inside a colored bordered box (matches the common card style)
export default function EntityAvatar({ entity, size = 'md', boxed = false, className }) {
  const colors = getEntityColors(entity.entity_type);
  const Icon = colors.Icon;

  if (entity.image_url) {
    return (
      <img
        src={entity.image_url}
        alt={entity.name || entity.entity_type}
        className={cn(
          IMAGE_SIZE[size] || IMAGE_SIZE.md,
          boxed ? BOX_ROUND[size] : 'rounded-md',
          'object-cover flex-shrink-0 border dark:border-zinc-700 border-zinc-200',
          className,
        )}
      />
    );
  }

  if (boxed) {
    return (
      <div className={cn(BOX_PAD[size], BOX_ROUND[size], 'border flex-shrink-0', colors.badge, className)}>
        <Icon className={ICON_SIZE[size] || ICON_SIZE.md} />
      </div>
    );
  }

  return (
    <Icon className={cn(ICON_SIZE[size] || ICON_SIZE.md, 'flex-shrink-0', colors.text, className)} />
  );
}
