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
import { colors, spacing, radius } from '@/theme';

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
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, sans-serif;
            font-size: 15px;
            line-height: 1.7;
            color: ${colors.textPrimary};
            padding: 24px;
            max-width: 720px;
            margin: 0 auto;
          }
          h1 {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin: 24px 0 12px;
            color: ${colors.textPrimary};
          }
          h2 {
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.3px;
            margin: 20px 0 8px;
            color: ${colors.textPrimary};
          }
          h3 {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.2px;
            margin: 16px 0 6px;
            color: ${colors.textPrimary};
          }
          p {
            margin: 0 0 12px;
          }
          code {
            background: ${colors.background};
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
            font-size: 13px;
            color: ${colors.accent};
          }
          pre {
            background: ${colors.background};
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid ${colors.borderLight};
          }
          pre code {
            background: none;
            padding: 0;
            color: ${colors.textPrimary};
          }
          blockquote {
            border-left: 3px solid ${colors.accent};
            padding-left: 16px;
            margin-left: 0;
            color: ${colors.textSecondary};
            font-style: italic;
          }
          ul, ol {
            padding-left: 24px;
          }
          li {
            margin-bottom: 4px;
          }
          hr {
            border: none;
            border-top: 1px solid ${colors.borderLight};
            margin: 24px 0;
          }
          a {
            color: ${colors.accent};
            text-decoration: none;
          }
          .placeholder {
            color: ${colors.textTertiary};
          }
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
    backgroundColor: colors.surface,
  },
  toolbarContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
});
