import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered, Quote,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Undo, Redo, Sparkles, FileDown, FileText
} from 'lucide-react';
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

const FONTS = ['Courier Prime', 'Courier New', 'Times New Roman', 'Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Garamond', 'Comic Sans MS', 'Impact'];
const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];

export interface RichTextEditorRef {
    exportToWord: () => void;
    exportToPdf: () => void;
}

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    onBlur?: () => void;
    editable?: boolean;
    onAiEditRequest?: () => void;
    titleElement?: React.ReactNode;
}

const MenuBar = ({ editor, onAiEditRequest }: { editor: any, onAiEditRequest?: () => void }) => {
    if (!editor) {
        return null;
    }

    const ToolbarButton = ({
        onClick, disabled, isActive, children, title
    }: {
        onClick: () => void, disabled?: boolean, isActive?: boolean, children: React.ReactNode, title?: string
    }) => (
        <button
            onClick={(e) => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            title={title}
            className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg transition-colors flex items-center justify-center
        ${isActive ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px h-4 sm:h-6 bg-neutral-200 mx-0.5 sm:mx-1" />;

    return (
        <div className="sticky top-0 z-40 w-full flex flex-wrap items-center gap-0.5 sm:gap-1 bg-white border border-neutral-200 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg mb-4 sm:mb-6 backdrop-blur-xl bg-white/90">

            {/* Font Controls */}
            <select
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                className="p-1 px-1.5 sm:px-2 rounded-md border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white min-w-[80px] sm:min-w-[120px] font-medium"
                value={editor.getAttributes('textStyle').fontFamily || ''}
            >
                <option value="" disabled>Default Font</option>
                {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
            </select>

            <select
                onChange={(e) => (editor.chain().focus() as any).setFontSize(e.target.value).run()}
                className="p-1 px-1.5 sm:px-2 rounded-md border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white min-w-[55px] sm:min-w-[70px] font-medium"
                value={editor.getAttributes('textStyle').fontSize || ''}
            >
                <option value="" disabled>Size</option>
                {FONT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
            </select>

            <div className="relative flex items-center justify-center rounded-md border border-neutral-300 bg-white overflow-hidden w-6 h-6 sm:w-8 sm:h-8 focus-within:ring-1 focus-within:ring-indigo-500 shrink-0 mx-0.5 sm:mx-1">
                <input
                    type="color"
                    onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    className="absolute min-w-[150%] min-h-[150%] cursor-pointer left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    title="Text Color"
                />
            </div>

            <Divider />

            {/* Undo / Redo */}
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                <Undo size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                <Redo size={14} />
            </ToolbarButton>

            <Divider />

            {/* Headings */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
                <Heading1 size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
                <Heading2 size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
                <Heading3 size={14} />
            </ToolbarButton>

            <Divider />

            {/* Basic Formatting */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
                <Bold size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
                <Italic size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
                <UnderlineIcon size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                <Strikethrough size={14} />
            </ToolbarButton>

            <Divider />

            {/* Alignment */}
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
                <AlignLeft size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
                <AlignCenter size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
                <AlignRight size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
                <AlignJustify size={14} />
            </ToolbarButton>

            <Divider />

            {/* Lists */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
                <List size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
                <ListOrdered size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
                <Quote size={14} />
            </ToolbarButton>

            <Divider />

            {/* AI Edit Button (Optional external hook) */}
            {onAiEditRequest && (
                <>
                    <div className="flex-1" /> {/* Spacer */}
                    <button
                        onClick={(e) => { e.preventDefault(); onAiEditRequest(); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-1.5 px-4 rounded-lg shadow-lg shadow-purple-500/30 transition-all hover:scale-105 ml-2 text-sm"
                    >
                        <Sparkles size={16} />
                        AI Write
                    </button>
                </>
            )}
        </div>
    );
};

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ content, onChange, onBlur, editable = true, onAiEditRequest, titleElement }, ref) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: 'Start writing your script here or ask the AI Director...',
            }),
            TextStyle,
            FontFamily,
            Color,
            FontSize,
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            // Return HTML for raw saving
            onChange(editor.getHTML());
        },
        onBlur: () => {
            if (onBlur) onBlur();
        },
        editorProps: {
            attributes: {
                class: 'prose prose-neutral max-w-none focus:outline-none min-h-[800px]',
            },
        },
    });

    const exportToWord = () => {
        if (!editor) return;
        const html = editor.getHTML();
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + html + footer;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `Script_${Date.now()}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const exportToPdf = async () => {
        if (!editor) return;
        // Dynamically import to avoid Next.js SSR issues
        const html2pdf = (await import('html2pdf.js')).default;

        const element = document.createElement('div');
        element.innerHTML = editor.getHTML();
        // Add basic styling for the PDF render
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.fontSize = '12pt';
        element.style.lineHeight = '1.6';

        const opt = {
            margin: 1,
            filename: `Script_${Date.now()}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(element).save();
    };

    useImperativeHandle(ref, () => ({
        exportToWord,
        exportToPdf
    }), [editor]);

    // Keep editor content in sync if 'content' prop changes externally (e.g., from DB fetch or AI override)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // We only update if the content actually differs to avoid cursor jumping
            const currentHtml = editor.getHTML();
            if (currentHtml === '<p></p>' && content === '') return; // TipTap empty state

            // Update content without firing the 'onUpdate' event again to prevent loop
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    return (
        <div className="w-full relative editor-wrapper">
            <MenuBar editor={editor} onAiEditRequest={onAiEditRequest} />
            {titleElement}
            <EditorContent editor={editor} />

            {/* Required CSS overrides for Prose layout to match the clean Docs look */}
            <style jsx global>{`
        .ProseMirror p { margin-top: 0.5rem; margin-bottom: 0.5rem; font-size: 1.125rem; line-height: 1.75; color: #111; }
        .ProseMirror h1 { font-size: 2.25rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 1rem; color: #000; }
        .ProseMirror h2 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111; }
        .ProseMirror h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #222; }
        .ProseMirror blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; font-style: italic; color: #4b5563; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; color: #111; font-size: 1.125rem; }
        .ProseMirror ul p, .ProseMirror ol p { margin: 0; }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
        </div>
    );
});

export default RichTextEditor;
