'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  command: string;
  value?: string;
  title: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
  { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
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

  const handleInsertLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) execCommand('createLink', url);
  }, [execCommand]);

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    isInternalChange.current = true;
    onChange(html === '<br>' ? '' : html);
    setTimeout(() => {
      isInternalChange.current = false;
    }, 0);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
          title="Insert Link"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertLink();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
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

      {/* Editable area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
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
