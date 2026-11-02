"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BetweenHorizontalEnd, BetweenVerticalEnd, Bold, Heading2, Heading3, ImageIcon, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Table, TableColumnsSplit, TableRowsSplit, Trash2, Undo2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MediaPicker } from "./MediaPicker";

function Tool({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} aria-pressed={active} className={`flex h-8 w-8 items-center justify-center ${active ? "bg-burgundy-700 text-white" : "text-ink hover:bg-burgundy-100"}`}>
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage, onLink }: { editor: Editor; onImage: () => void; onLink: () => void }) {
  const icon = "h-4 w-4";
  return (
    <div className="flex flex-wrap gap-0.5 border-b border-line bg-burgundy-50 p-1">
      <Tool label="Жирный" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className={icon} /></Tool>
      <Tool label="Курсив" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className={icon} /></Tool>
      <Tool label="Заголовок" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className={icon} /></Tool>
      <Tool label="Подзаголовок" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className={icon} /></Tool>
      <Tool label="Маркированный список" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className={icon} /></Tool>
      <Tool label="Нумерованный список" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className={icon} /></Tool>
      <Tool label="Цитата" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className={icon} /></Tool>
      <Tool label="Разделитель" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className={icon} /></Tool>
      <Tool
        label="Ссылка"
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          onLink();
        }}
      >
        <Link2 className={icon} />
      </Tool>
      <Tool label="Изображение" onClick={onImage}><ImageIcon className={icon} /></Tool>
      <Tool label="Вставить таблицу" active={editor.isActive("table")} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table className={icon} /></Tool>
      {editor.isActive("table") && (
        <>
          <Tool label="Добавить строку" onClick={() => editor.chain().focus().addRowAfter().run()}><BetweenHorizontalEnd className={icon} /></Tool>
          <Tool label="Добавить столбец" onClick={() => editor.chain().focus().addColumnAfter().run()}><BetweenVerticalEnd className={icon} /></Tool>
          <Tool label="Удалить строку" onClick={() => editor.chain().focus().deleteRow().run()}><TableRowsSplit className={icon} /></Tool>
          <Tool label="Удалить столбец" onClick={() => editor.chain().focus().deleteColumn().run()}><TableColumnsSplit className={icon} /></Tool>
          <Tool label="Удалить таблицу" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 className={icon} /></Tool>
        </>
      )}
      <span className="mx-1 w-px bg-line" />
      <Tool label="Отменить" onClick={() => editor.chain().focus().undo().run()}><Undo2 className={icon} /></Tool>
      <Tool label="Повторить" onClick={() => editor.chain().focus().redo().run()}><Redo2 className={icon} /></Tool>
    </div>
  );
}

export function RichEditor({ name, defaultValue, label }: { name: string; defaultValue: string; label: string }) {
  const [html, setHtml] = useState(defaultValue);
  const [picking, setPicking] = useState(false);
  const [linkEditor, setLinkEditor] = useState(false);
  const [href, setHref] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: false, heading: { levels: [2, 3, 4] } }), Link.configure({ openOnClick: false }), Image, TableKit.configure({ table: { resizable: false } })],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: "prose prose-site max-w-none min-h-48 px-4 py-3 focus:outline-none prose-headings:font-serif prose-a:text-burgundy-700",
        "aria-label": label,
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="border border-[#d9cdd1] bg-white focus-within:border-burgundy-700">
      <input type="hidden" name={name} value={html} />
      {editor && <Toolbar editor={editor} onImage={() => setPicking(true)} onLink={() => setLinkEditor(true)} />}
      {linkEditor && (
        <div className="flex gap-2 border-b border-line bg-white p-2">
          <input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://… или /ru/news"
            aria-label="Адрес ссылки"
            className="field !py-1.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          />
          <button
            type="button"
            className="btn btn-primary !px-3 !py-1.5 text-sm"
            onClick={() => {
              if (href.trim()) editor?.chain().focus().setLink({ href: href.trim() }).run();
              setHref("");
              setLinkEditor(false);
            }}
          >
            Вставить
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(file) => {
          editor?.chain().focus().setImage({ src: `/files/${file.id}`, alt: file.name }).run();
          setPicking(false);
        }}
      />
    </div>
  );
}
