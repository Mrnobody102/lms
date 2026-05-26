'use client';

import {
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentType,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Bold,
  Code2,
  Eraser,
  FileUp,
  Heading1,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PanelTop,
  Quote,
  Redo2,
  Table2,
  Undo2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarButton {
  icon: ComponentType<{ className?: string }>;
  command: string;
  value?: string;
  title: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
  { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
  { icon: Highlighter, command: 'hiliteColor', value: '#fef08a', title: 'Highlight' },
  { icon: Code2, command: 'formatBlock', value: 'pre', title: 'Code block' },
  { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Heading 1' },
  { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
  { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
  { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
  { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Blockquote' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '12rem',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value → DOM (only when value changes from outside)
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalChange.current) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const execCommand = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      // Fire onChange with updated HTML
      const html = editorRef.current?.innerHTML ?? '';
      isInternalChange.current = true;
      onChange(html === '<br>' ? '' : html);
      setTimeout(() => {
        isInternalChange.current = false;
      }, 0);
    },
    [onChange],
  );

  const syncFromDom = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    isInternalChange.current = true;
    onChange(html === '<br>' ? '' : html);
    setTimeout(() => {
      isInternalChange.current = false;
    }, 0);
  }, [onChange]);

  const insertHtml = useCallback(
    (html: string) => {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, html);
      syncFromDom();
    },
    [syncFromDom],
  );

  const handleInsertLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (!url) return;
    const safeUrl = sanitizeUrl(url);
    if (safeUrl) execCommand('createLink', safeUrl);
  }, [execCommand]);

  const handleInsertImage = useCallback(() => {
    const url = window.prompt('Image URL:');
    if (!url) return;
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return;

    insertHtml(
      `<figure><img src="${escapeAttribute(safeUrl)}" alt="" /><figcaption><br></figcaption></figure>`,
    );
  }, [insertHtml]);

  const handleInsertTable = useCallback(() => {
    const rows = parsePositiveInteger(window.prompt('Rows:', '3'), 3);
    const columns = parsePositiveInteger(window.prompt('Columns:', '3'), 3);
    const cells = Array.from({ length: columns }, () => '<td><br></td>').join('');
    const body = Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join('');

    insertHtml(`<table><tbody>${body}</tbody></table><p><br></p>`);
  }, [insertHtml]);

  const handleInsertCallout = useCallback(() => {
    insertHtml(
      '<aside data-callout="note"><p><strong><br></strong></p><p><br></p></aside><p><br></p>',
    );
  }, [insertHtml]);

  const handleInsertDiagram = useCallback(() => {
    insertHtml(
      '<div data-lesson-diagram="flow"><ol><li><br></li><li><br></li><li><br></li></ol></div><p><br></p>',
    );
  }, [insertHtml]);

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const text = await file.text();
      const lowerName = file.name.toLowerCase();
      const html =
        lowerName.endsWith('.md') || lowerName.endsWith('.markdown')
          ? markdownToHtml(text)
          : lowerName.endsWith('.html') || lowerName.endsWith('.htm')
            ? sanitizeImportedHtml(text)
            : plainTextToHtml(text);

      insertHtml(`${html}<p><br></p>`);
    },
    [insertHtml],
  );

  const handleInput = useCallback(() => {
    syncFromDom();
  }, [syncFromDom]);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const html = event.clipboardData.getData('text/html');
      const text = event.clipboardData.getData('text/plain');
      if (!html && !text) {
        return;
      }

      event.preventDefault();
      insertHtml(html ? sanitizeImportedHtml(html) : plainTextToHtml(text));
    },
    [insertHtml],
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Allow Tab to insert spaces instead of losing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  }, []);

  return (
    <div className="rounded-xl border border-input overflow-hidden bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 px-2 py-1.5">
        {TOOLBAR_BUTTONS.map(({ icon: Icon, command, value: val, title }) => (
          <button
            key={`${command}-${val ?? ''}`}
            type="button"
            title={title}
            onMouseDown={(e) => {
              e.preventDefault(); // keep focus in editor
              execCommand(command, val);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent/70"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          title="Insert table"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertTable();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Table2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Insert image"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertImage();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Insert Link"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertLink();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Callout"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertCallout();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelTop className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Diagram block"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertDiagram();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Code2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Horizontal rule"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('insertHorizontalRule');
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Import HTML, Markdown, or text"
          onMouseDown={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <FileUp className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          title="Clear formatting"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('removeFormat');
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Eraser className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('undo');
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('redo');
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.md,.markdown,.txt,text/html,text/markdown,text/plain"
        className="hidden"
        onChange={(event) => void handleImportFile(event)}
      />

      {/* Editable area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className={`
            w-full px-4 py-3 text-sm text-foreground outline-none
            prose prose-sm dark:prose-invert max-w-none
            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
            [&_li]:my-0.5
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
            [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
            [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2
            [&_figure]:my-3 [&_figure_img]:max-w-full [&_figure_img]:rounded-lg [&_figure_img]:border
            [&_figcaption]:mt-1 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground
            [&_aside]:my-3 [&_aside]:rounded-lg [&_aside]:border [&_aside]:bg-primary/5 [&_aside]:p-3
            [&_[data-lesson-diagram]]:my-3 [&_[data-lesson-diagram]]:rounded-lg [&_[data-lesson-diagram]]:border [&_[data-lesson-diagram]]:bg-muted/40 [&_[data-lesson-diagram]]:p-4
            [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer
            [&_strong]:font-bold [&_em]:italic
            empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none
          `}
          style={{ minHeight }}
          data-placeholder={placeholder ?? 'Write lesson content here...'}
          aria-label="Rich text editor"
          role="textbox"
          aria-multiline="true"
        />
      </div>
    </div>
  );
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 12) : fallback;
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeImportedHtml(value: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());
  doc.body.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const isUriAttribute = ['href', 'src', 'poster', 'xlink:href'].includes(name);
      if (
        name.startsWith('on') ||
        name === 'style' ||
        (isUriAttribute && !sanitizeUrl(attribute.value))
      ) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function markdownToHtml(value: string) {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const nextLine = lines[index + 1]?.trim() ?? '';
    if (isMarkdownTableRow(trimmed) && isMarkdownTableSeparator(nextLine)) {
      closeList();
      const headers = splitMarkdownTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && isMarkdownTableRow(lines[index].trim())) {
        rows.push(splitMarkdownTableRow(lines[index].trim()));
        index += 1;
      }
      index -= 1;

      html.push(
        `<table><thead><tr>${headers
          .map((header) => `<th>${formatInlineMarkdown(header)}</th>`)
          .join('')}</tr></thead><tbody>${rows
          .map(
            (row) =>
              `<tr>${headers
                .map(
                  (_header, cellIndex) => `<td>${formatInlineMarkdown(row[cellIndex] ?? '')}</td>`,
                )
                .join('')}</tr>`,
          )
          .join('')}</tbody></table>`,
      );
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closeList();
      html.push(
        `<h${heading[1].length}>${formatInlineMarkdown(heading[2])}</h${heading[1].length}>`,
      );
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${formatInlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${formatInlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return html.join('');
}

function isMarkdownTableRow(value: string) {
  return value.includes('|') && splitMarkdownTableRow(value).length > 1;
}

function isMarkdownTableSeparator(value: string) {
  if (!isMarkdownTableRow(value)) {
    return false;
  }

  return splitMarkdownTableRow(value).every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function splitMarkdownTableRow(value: string) {
  return value
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function plainTextToHtml(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function formatInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
