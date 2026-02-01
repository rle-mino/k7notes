import { useCallback, useState, useRef } from "react";
import { orpc } from "@/lib/orpc";
import type { Note, Folder } from "@/lib/orpc";

export type TreeItemType = "folder" | "note";

export interface TreeNode {
  id: string;
  type: TreeItemType;
  name: string;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
  hasChildren: boolean;
  data: Folder | Note;
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
      depth: number
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
          data: folder,
        });

        // If expanded and has loaded children, add them recursively
        if (isExpanded && childData) {
          addItems(childData.folders, childData.notes, depth + 1);
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
          data: note,
        });
      }
    };

    addItems(rootFolders, rootNotes, 0);
    return result;
  }, [rootFolders, rootNotes, expandedIds, loadingIds, expandedState]);

  const treeData = buildFlatTree();

  return {
    treeData,
    loading,
    refreshing,
    error,
    fetchRootData,
    toggleExpand,
    refresh: () => fetchRootData(true),
  };
}
