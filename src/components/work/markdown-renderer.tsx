'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Components } from 'react-markdown';

// GitHub-style sanitize schema doesn't know media tags — extend it so admins
// can embed <video>/<audio>/<source> in project details. Raw HTML passes
// through rehype-raw first, then gets sanitized with this schema. Lives here so
// the whole Markdown parsing stack (react-markdown + remark + rehype + parse5 +
// micromark) can be lazily code-split out of the /work first-load bundle.
const detailsSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'video', 'audio', 'source', 'a'],
  attributes: {
    ...defaultSchema.attributes,
    video: [...(defaultSchema.attributes?.video || []), 'src', 'controls', 'autoplay', 'loop', 'muted', 'playsinline', 'poster', 'preload', 'width', 'height', 'title', 'data-*'],
    audio: ['src', 'controls', 'loop', 'muted', 'preload'],
    source: ['src', 'type'],
    a: [...(defaultSchema.attributes?.a || []), 'href', 'download', 'target', 'rel', 'title', 'data-*'],
  },
};

/**
 * Renders project-details Markdown. Extracted into its own component so that the
 * heavy Markdown parsing stack only loads when a project's details dialog is
 * actually opened, instead of shipping in the /work first-load bundle.
 *
 * Import via `dynamic(..., { ssr: false })` from WorkPageClient, which passes
 * an already-memoized `components` map (video players / fullscreen / download
 * links live there, in the parent bundle).
 */
export default function MarkdownRenderer({
  details,
  components,
}: {
  details: string;
  components: Components;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { breaks: true }]]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, detailsSanitizeSchema]]}
      components={components}
    >
      {details}
    </ReactMarkdown>
  );
}
