import React, { useEffect, useState } from 'react';
import { Newspaper, Pencil, Trash2, ExternalLink, ImagePlus, Loader2 } from 'lucide-react';
import { callAdmin, INPUT, CARD, ROW } from '@/lib/adminApi';
import { UploadFile } from '@/api/entities';
import { cn } from '@/lib/utils';

const emptyPost = { title: '', slug: '', category: 'GM Tips', author: 'GM/OS', cover_image: '', excerpt: '', body: '', published: false };

// Blog authoring: create/edit/publish/delete posts and upload cover images.
// Self-contained — loads its own posts and owns its draft state.
export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [postDraft, setPostDraft] = useState(emptyPost);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    callAdmin({ action: 'blog-list' }).then((b) => setPosts(b.posts || [])).catch(() => {});
  }, []);

  const savePost = async () => {
    if (!postDraft.title.trim()) return;
    const { post } = await callAdmin({ action: 'blog-save', post: postDraft });
    setPosts((prev) => (prev.some((x) => x.id === post.id)
      ? prev.map((x) => (x.id === post.id ? post : x))
      : [post, ...prev]));
    setPostDraft(emptyPost);
  };

  const uploadCover = async (file) => {
    if (!file) return;
    setCoverUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setPostDraft((d) => ({ ...d, cover_image: file_url }));
    } catch (e) {
      window.alert(`Upload failed: ${e.message || e}`);
    } finally {
      setCoverUploading(false);
    }
  };

  const editPost = (p) => setPostDraft({
    id: p.id, title: p.title, slug: p.slug, category: p.category || 'GM Tips',
    author: p.author || 'GM/OS', cover_image: p.cover_image || '',
    excerpt: p.excerpt || '', body: p.body || '', published: p.published, published_at: p.published_at,
  });

  const togglePubPost = async (p) => {
    const { post } = await callAdmin({ action: 'blog-save', post: { ...p, published: !p.published } });
    setPosts((prev) => prev.map((x) => (x.id === post.id ? post : x)));
  };

  const delPost = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    await callAdmin({ action: 'blog-delete', id: p.id });
  };

  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
        <Newspaper className="w-3.5 h-3.5 text-amber-500" /> Blog
      </h2>
      <div className={cn(CARD, 'p-3 space-y-2 mb-3')}>
        <input value={postDraft.title} onChange={(e) => setPostDraft({ ...postDraft, title: e.target.value })}
          placeholder="Post title" className={cn('w-full text-sm px-2.5 py-1.5', INPUT)} />
        <div className="flex gap-2">
          <input value={postDraft.slug} onChange={(e) => setPostDraft({ ...postDraft, slug: e.target.value })}
            placeholder="slug (auto from title if blank)" className={cn('flex-1 text-sm px-2.5 py-1.5 font-mono', INPUT)} />
          <input value={postDraft.category} onChange={(e) => setPostDraft({ ...postDraft, category: e.target.value })}
            placeholder="Category" className={cn('w-44 text-sm px-2.5 py-1.5', INPUT)} />
        </div>
        <div className="flex gap-2">
          <input value={postDraft.cover_image} onChange={(e) => setPostDraft({ ...postDraft, cover_image: e.target.value })}
            placeholder="Cover image URL (optional — drives social preview)" className={cn('flex-1 text-sm px-2.5 py-1.5', INPUT)} />
          <label className={cn('flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0', coverUploading && 'opacity-60 pointer-events-none')}>
            {coverUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadCover(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <input value={postDraft.author} onChange={(e) => setPostDraft({ ...postDraft, author: e.target.value })}
            placeholder="Author" className={cn('w-44 text-sm px-2.5 py-1.5', INPUT)} />
        </div>
        {postDraft.cover_image && (
          <div className="flex items-center gap-2">
            <img src={postDraft.cover_image} alt="Cover preview" className="h-16 w-28 object-cover rounded-md border border-zinc-200 dark:border-zinc-800" />
            <button onClick={() => setPostDraft({ ...postDraft, cover_image: '' })} className="text-xs text-zinc-500 hover:text-red-500 dark:hover:text-red-400">Remove cover</button>
          </div>
        )}
        <textarea value={postDraft.excerpt} onChange={(e) => setPostDraft({ ...postDraft, excerpt: e.target.value })}
          placeholder="Excerpt — shown on the blog index" rows={2} className={cn('w-full text-sm px-2.5 py-1.5 resize-none', INPUT)} />
        <textarea value={postDraft.body} onChange={(e) => setPostDraft({ ...postDraft, body: e.target.value })}
          placeholder={'Body — Markdown supported:\n## Heading\n**bold**, *italic*\n- bullet\n[link](https://…)'}
          rows={10} className={cn('w-full text-sm px-2.5 py-1.5 resize-y font-mono', INPUT)} />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={postDraft.published} onChange={(e) => setPostDraft({ ...postDraft, published: e.target.checked })} /> Published
          </label>
          {postDraft.id && <button onClick={() => setPostDraft(emptyPost)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>}
          <button onClick={savePost} disabled={!postDraft.title.trim()}
            className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
            {postDraft.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {posts.length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-3">No posts yet.</p>}
        {posts.map((p) => (
          <div key={p.id} className={cn('flex items-center gap-2 px-3 py-2', ROW)}>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">{p.category}</span>
            <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">{p.title}</span>
            <span className={cn('text-[10px] font-medium shrink-0', p.published ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')}>{p.published ? 'Published' : 'Draft'}</span>
            {p.published && <a href={`${import.meta.env.BASE_URL}blog/${p.slug}`} target="_blank" rel="noopener noreferrer" title="View post" className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"><ExternalLink className="w-3.5 h-3.5" /></a>}
            <button onClick={() => togglePubPost(p)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">{p.published ? 'Unpublish' : 'Publish'}</button>
            <button onClick={() => editPost(p)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => delPost(p)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
