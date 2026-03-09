import { useCallback, useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Heading2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

export function RichTextEditor({ content, onChange, readOnly = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitRef.current) {
      editorRef.current.innerHTML = content;
      isInitRef.current = true;
    }
  }, [content]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 rounded-t-lg flex-wrap">
          {[
            { icon: Heading2, cmd: () => execCommand("formatBlock", "H2"), label: "Heading" },
            { icon: Bold, cmd: () => execCommand("bold"), label: "Bold" },
            { icon: Italic, cmd: () => execCommand("italic"), label: "Italic" },
            { icon: Underline, cmd: () => execCommand("underline"), label: "Underline" },
            { icon: List, cmd: () => execCommand("insertUnorderedList"), label: "Bullet list" },
            { icon: ListOrdered, cmd: () => execCommand("insertOrderedList"), label: "Numbered list" },
          ].map(({ icon: Icon, cmd, label }) => (
            <Button
              key={label}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={cmd}
              title={label}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        className="flex-1 p-4 focus:outline-none overflow-y-auto prose prose-invert prose-sm max-w-none
          [&_h2]:text-xl [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-3
          [&_p]:text-secondary-foreground [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
          [&_li]:text-secondary-foreground [&_li]:mb-1
          min-h-[300px]"
        suppressContentEditableWarning
      />
    </div>
  );
}
