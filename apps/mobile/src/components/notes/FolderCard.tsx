import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Folder } from '@/lib/orpc';

interface FolderCardProps {
  folder: Folder;
  onPress: () => void;
  onLongPress?: () => void;
}

export function FolderCard({ folder, onPress, onLongPress }: FolderCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>folder</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {folder.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
});
