import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

/**
 * Note editor screen - placeholder for online-first implementation.
 *
 * TODO: Connect to server API for:
 * - GET /api/notes/:id (get note)
 * - PUT /api/notes/:id (update note)
 * - DELETE /api/notes/:id (delete note)
 */
export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: 'Note' }} />
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.title}>Note Editor</Text>
          <Text style={styles.noteId}>ID: {id}</Text>
          <Text style={styles.message}>
            Online-first implementation pending.
          </Text>
          <Text style={styles.hint}>
            Connect to server API to edit notes.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  noteId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#999',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
