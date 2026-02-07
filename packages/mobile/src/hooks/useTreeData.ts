import { useCallback, useState, useRef, useMemo } from "react";
import { orpc } from "@/lib/orpc";
import type { Note, Folder } from "@/lib/orpc";
import {
  useAudioRecordings,
  type AudioRecording,
} from "./useAudioRecordings";

export const AUDIO_FOLDER_ID = "__audio__";

export type TreeItemType =
  | "folder"
  | "note"
  | "add-item"
  | "audio-folder"
  | "audio-item";

export interface TreeNode {
  id: string;
  type: TreeItemType;
  name: string;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
  hasChildren: boolean;
  parentFolderId: string | null;
  data: Folder | Note | AudioRecording | null;
}

interface ExpandedState {
  [folderId: string]: {
    folders: Folder[];
    notes: Note[];
  };
}

export function useTreeData() {
  const [rootFolders, setRootFolders] = useState<Folder[]>([]);
  const [rootNotes, setRootNotes] = useState<Note[]>([]);
  const [expandedState, setExpandedState] = useState<ExpandedState>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio recordings hook
  const {
    recordings: audioRecordings,
    refresh: refreshAudio,
  } = useAudioRecordings();

  // Track if we've done initial load
  const hasLoaded = useRef(false);

  const fetchRootData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoaded.current) {
        setLoading(true);
      }
      setError(null);

      const contents = await orpc.folders.getContents({ folderId: null });
      setRootFolders(contents.folders);
      setRootNotes(contents.notes);
      hasLoaded.current = true;

      // Clear expanded state on refresh to get fresh data
      if (isRefresh) {
        setExpandedState({});
        setExpandedIds(new Set());
      }
    } catch (err) {
      console.error("Failed to fetch root data:", err);
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchFolderContents = useCallback(async (folderId: string) => {
    setLoadingIds((prev) => new Set(prev).add(folderId));
    try {
      const contents = await orpc.folders.getContents({ folderId });
      setExpandedState((prev) => ({
        ...prev,
        [folderId]: {
          folders: contents.folders,
          notes: contents.notes,
        },
      }));
    } catch (err) {
      console.error(`Failed to fetch folder ${folderId}:`, err);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    }
  }, []);

  const toggleExpand = useCallback(
    async (folderId: string) => {
      const isCurrentlyExpanded = expandedIds.has(folderId);

      if (isCurrentlyExpanded) {
        // Collapse
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
      } else {
        // Expand
        setExpandedIds((prev) => new Set(prev).add(folderId));

        // Audio folder doesn't need a fetch — data comes from the hook
        if (folderId === AUDIO_FOLDER_ID) {
          return;
        }

        // Fetch contents if not already loaded
        if (!expandedState[folderId]) {
          await fetchFolderContents(folderId);
        }
      }
    },
    [expandedIds, expandedState, fetchFolderContents]
  );

  // Build flattened tree for FlatList
  const buildFlatTree = useCallback((): TreeNode[] => {
    const result: TreeNode[] = [];

    const addItems = (
      folders: Folder[],
      notes: Note[],
      depth: number,
      parentFolderId: string | null
    ) => {
      // Add folders first
      for (const folder of folders) {
        const isExpanded = expandedIds.has(folder.id);
        const isLoading = loadingIds.has(folder.id);
        const childData = expandedState[folder.id];
        const hasChildren =
          childData !== undefined
            ? childData.folders.length > 0 || childData.notes.length > 0
            : true; // Assume has children until proven otherwise

        result.push({
          id: folder.id,
          type: "folder",
          name: folder.name,
          depth,
          isExpanded,
          isLoading,
          hasChildren,
          parentFolderId,
          data: folder,
        });

        // If expanded and has loaded children, add them recursively
        if (isExpanded && childData) {
          addItems(childData.folders, childData.notes, depth + 1, folder.id);

          // Add "add item" row at the end of expanded folder's children
          result.push({
            id: `add-${folder.id}`,
            type: "add-item",
            name: "",
            depth: depth + 1,
            isExpanded: false,
            isLoading: false,
            hasChildren: false,
            parentFolderId: folder.id,
            data: null,
          });
        }
      }

      // Add notes after folders
      for (const note of notes) {
        result.push({
          id: note.id,
          type: "note",
          name: note.title || "Untitled",
          depth,
          isExpanded: false,
          isLoading: false,
          hasChildren: false,
          parentFolderId,
          data: note,
        });
      }
    };

    // Inject virtual Audio folder at the top of the tree
    const isAudioExpanded = expandedIds.has(AUDIO_FOLDER_ID);
    result.push({
      id: AUDIO_FOLDER_ID,
      type: "audio-folder",
      name: "Audio",
      depth: 0,
      isExpanded: isAudioExpanded,
      isLoading: false,
      hasChildren: audioRecordings.length > 0,
      parentFolderId: null,
      data: null,
    });

    if (isAudioExpanded) {
      for (const recording of audioRecordings) {
        result.push({
          id: `audio-${recording.fileName}`,
          type: "audio-item",
          name: recording.title,
          depth: 1,
          isExpanded: false,
          isLoading: false,
          hasChildren: false,
          parentFolderId: AUDIO_FOLDER_ID,
          data: recording,
        });
      }
    }

    addItems(rootFolders, rootNotes, 0, null);
    return result;
  }, [rootFolders, rootNotes, expandedIds, loadingIds, expandedState, audioRecordings]);

  const treeData = buildFlatTree();

  // Identify the root-level "Daily" folder for special add-note behavior
  const dailyFolderId = useMemo(() => {
    const dailyFolder = rootFolders.find(
      (f) => f.name === "Daily" && f.parentId === null
    );
    return dailyFolder?.id ?? null;
  }, [rootFolders]);

  const refresh = useCallback(() => {
    refreshAudio();
    return fetchRootData(true);
  }, [fetchRootData, refreshAudio]);

  return {
    treeData,
    dailyFolderId,
    loading,
    refreshing,
    error,
    fetchRootData,
    toggleExpand,
    refresh,
  };
}
