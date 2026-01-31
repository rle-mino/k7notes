import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useLiveQuery, getNote, updateNote, deleteNote } from '../../../db';
import { NoteEditor, NoteEditorRef } from '@/components/editor';
import { MoveNoteModal } from '@/components/notes';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: note, loading } = useLiveQuery(() => getNote(id), [id]);
  const editorRef = useRef<NoteEditorRef>(null);

  const [title, setTitle] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Initialize title when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [note?.id]); // Only update when note ID changes, not on every render

  const handleSave = useCallback(async () => {
    if (!editorRef.current || saving) return;

    setSaving(true);
    try {
      const content = await editorRef.current.getMarkdown();
      await updateNote(id, { title: title || 'Untitled', content });
      setHasChanges(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setSaving(false);
    }
  }, [id, title, saving]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(id);
            router.back();
          },
        },
      ]
    );
  };

  const handleContentChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasChanges(true);
  };

  if (loading || !note) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View style={styles.headerButtons}>
              {hasChanges && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.moveButton} onPress={() => setShowMoveModal(true)}>
                <Text style={styles.moveButtonText}>Move</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={handleTitleChange}
          placeholder="Note title"
          placeholderTextColor="#999"
        />
        <View style={styles.editorContainer}>
          <NoteEditor
            ref={editorRef}
            initialContent={note.content}
            onContentChange={handleContentChange}
          />
        </View>
      </View>
      <MoveNoteModal
        visible={showMoveModal}
        noteId={id}
        currentFolderId={note?.folderId ?? null}
        onClose={() => setShowMoveModal(false)}
        onMoved={() => {
          setHasChanges(false); // Reset changes since we're navigating away
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  moveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  moveButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#1a1a1a',
  },
  editorContainer: {
    flex: 1,
  },
});
