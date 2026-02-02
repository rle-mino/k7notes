import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  TenTapStartKit,
  CoreBridge,
} from '@10play/tentap-editor';
import { markdownToHtml, htmlToMarkdown } from '@/utils/markdown';

export interface NoteEditorRef {
  getMarkdown: () => Promise<string>;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
}

export interface NoteEditorProps {
  initialContent?: string; // Markdown content
  onContentChange?: (markdown: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export const NoteEditor = forwardRef<NoteEditorRef, NoteEditorProps>(
  ({ initialContent = '', onContentChange, editable = true }, ref) => {
    const isReadyRef = useRef(false);

    const editor = useEditorBridge({
      autofocus: false,
      avoidIosKeyboard: true,
      initialContent: markdownToHtml(initialContent),
      bridgeExtensions: [
        ...TenTapStartKit,
        CoreBridge.configureCSS(`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 16px;
          }
          h1 { font-size: 28px; margin: 16px 0 8px; }
          h2 { font-size: 24px; margin: 14px 0 6px; }
          h3 { font-size: 20px; margin: 12px 0 4px; }
          code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Menlo, monospace;
          }
          pre {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
          }
          blockquote {
            border-left: 3px solid #ddd;
            padding-left: 12px;
            margin-left: 0;
            color: #666;
          }
          ul, ol { padding-left: 24px; }
          .placeholder { color: #999; }
        `),
      ],
    });

    // Track editor ready state
    useEffect(() => {
      const unsubscribe = editor._subscribeToEditorStateUpdate((state) => {
        isReadyRef.current = state.isReady;
      });
      return () => unsubscribe();
    }, [editor]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: async () => {
        const html = await editor.getHTML();
        return htmlToMarkdown(html);
      },
      setMarkdown: (markdown: string) => {
        editor.setContent(markdownToHtml(markdown));
      },
      focus: () => {
        editor.focus();
      },
    }));

    // Track content changes using content update subscription
    useEffect(() => {
      if (!onContentChange) return;

      const unsubscribe = editor._subscribeToContentUpdate(async () => {
        if (!isReadyRef.current) return;

        try {
          const html = await editor.getHTML();
          const markdown = htmlToMarkdown(html);
          onContentChange(markdown);
        } catch (e) {
          console.error('[NoteEditor] Failed to get content:', e);
        }
      });

      return () => {
        unsubscribe();
      };
    }, [editor, onContentChange]);

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.editorContainer}>
          <RichText editor={editor} />
        </View>
        {editable && (
          <View style={styles.toolbarContainer}>
            <Toolbar editor={editor} />
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
  },
  toolbarContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
});
