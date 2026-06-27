import React from 'react';
import { categoryAccent } from '@/lib/blog';
import { cn } from '@/lib/utils';

// A post's cover image, or — when none is set — a tasteful category-tinted
// gradient with the GM/OS wordmark, so every card still looks intentional.
export default function CoverArt({ post, className }) {
  const accent = categoryAccent(post?.category);
  if (post?.cover_image) {
    return (
      <img
        src={post.cover_image}
        alt=""
        loading="lazy"
        className={cn('w-full h-full object-cover', className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'w-full h-full flex items-center justify-center bg-gradient-to-br',
        accent.from, accent.to, 'bg-zinc-50 dark:bg-zinc-900',
        className,
      )}
    >
      <span className="text-2xl font-bold tracking-wide text-zinc-400/80 dark:text-zinc-600/80 select-none">
        GM<span className={accent.text}>/OS</span>
      </span>
    </div>
  );
}
