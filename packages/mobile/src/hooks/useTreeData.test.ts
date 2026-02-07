import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Note, Folder } from "@/lib/orpc";

// Mock the orpc module
const mockGetContents = vi.fn();

vi.mock("@/lib/orpc", () => ({
  orpc: {
    folders: {
      getContents: (...args: unknown[]) => mockGetContents(...args),
    },
  },
}));

import { useTreeData } from "./useTreeData";

// Helper factories for mock data
function createFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: "folder-1",
    userId: "user-1",
    name: "Test Folder",
    parentId: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    userId: "user-1",
    title: "Test Note",
    content: "<p>content</p>",
    kind: "REGULAR",
    date: null,
    folderId: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  } as Note;
}

describe("useTreeData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchRootData", () => {
    it("calls orpc.folders.getContents with null folderId", async () => {
      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(mockGetContents).toHaveBeenCalledWith({ folderId: null });
    });

    it("sets root folders and notes from response", async () => {
      const folder = createFolder({ id: "f1", name: "My Folder" });
      const note = createNote({ id: "n1", title: "My Note" });
      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [note],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.treeData).toHaveLength(2);
      expect(result.current.treeData[0]).toMatchObject({
        id: "f1",
        type: "folder",
        name: "My Folder",
      });
      expect(result.current.treeData[1]).toMatchObject({
        id: "n1",
        type: "note",
        name: "My Note",
      });
    });

    it("sets loading to false after fetch completes", async () => {
      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      const { result } = renderHook(() => useTreeData());

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("buildFlatTree", () => {
    it("returns empty array when no data is loaded", () => {
      const { result } = renderHook(() => useTreeData());
      expect(result.current.treeData).toEqual([]);
    });

    it("places folders before notes at the same level", async () => {
      const folder = createFolder({ id: "f1", name: "Folder" });
      const note = createNote({ id: "n1", title: "Note" });
      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [note],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.treeData[0]!.type).toBe("folder");
      expect(result.current.treeData[1]!.type).toBe("note");
    });

    it("sets depth 0 for root items", async () => {
      const folder = createFolder({ id: "f1" });
      const note = createNote({ id: "n1" });
      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [note],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.treeData[0]!.depth).toBe(0);
      expect(result.current.treeData[1]!.depth).toBe(0);
    });

    it("sets correct depth for nested items when folder is expanded", async () => {
      const parentFolder = createFolder({ id: "parent", name: "Parent" });
      const childFolder = createFolder({
        id: "child",
        name: "Child Folder",
        parentId: "parent",
      });
      const childNote = createNote({
        id: "child-note",
        title: "Child Note",
        folderId: "parent",
      });

      // Root fetch
      mockGetContents.mockResolvedValueOnce({
        folders: [parentFolder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand parent folder
      mockGetContents.mockResolvedValueOnce({
        folders: [childFolder],
        notes: [childNote],
      });

      await act(async () => {
        await result.current.toggleExpand("parent");
      });

      const tree = result.current.treeData;
      const parent = tree.find((n) => n.id === "parent");
      const child = tree.find((n) => n.id === "child");
      const childNoteNode = tree.find((n) => n.id === "child-note");

      expect(parent!.depth).toBe(0);
      expect(child!.depth).toBe(1);
      expect(childNoteNode!.depth).toBe(1);
    });

    it("sets parentFolderId to null for root items", async () => {
      const folder = createFolder({ id: "f1" });
      const note = createNote({ id: "n1" });
      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [note],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.treeData[0]!.parentFolderId).toBeNull();
      expect(result.current.treeData[1]!.parentFolderId).toBeNull();
    });

    it("sets parentFolderId to folder id for children", async () => {
      const folder = createFolder({ id: "f1" });
      const childNote = createNote({
        id: "cn1",
        title: "Child",
        folderId: "f1",
      });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [childNote],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      const childNoteNode = result.current.treeData.find(
        (n) => n.id === "cn1"
      );
      expect(childNoteNode!.parentFolderId).toBe("f1");
    });

    it("uses 'Untitled' for notes with empty title", async () => {
      const note = createNote({ id: "n1", title: "" });
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [note],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.treeData[0]!.name).toBe("Untitled");
    });

    it("assumes folders have children until expanded", async () => {
      const folder = createFolder({ id: "f1" });
      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Before expanding, hasChildren is true (assumed)
      expect(result.current.treeData[0]!.hasChildren).toBe(true);

      // Expand reveals empty folder
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      // After expanding with no children, hasChildren is false
      expect(result.current.treeData[0]!.hasChildren).toBe(false);
    });
  });

  describe("toggleExpand", () => {
    it("expands a folder and fetches its contents", async () => {
      const folder = createFolder({ id: "f1", name: "Folder" });
      const childNote = createNote({
        id: "cn1",
        title: "Child Note",
        folderId: "f1",
      });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand folder
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [childNote],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      expect(mockGetContents).toHaveBeenCalledWith({ folderId: "f1" });

      const folderNode = result.current.treeData.find((n) => n.id === "f1");
      expect(folderNode!.isExpanded).toBe(true);

      const childNoteNode = result.current.treeData.find(
        (n) => n.id === "cn1"
      );
      expect(childNoteNode).toBeDefined();
      expect(childNoteNode!.depth).toBe(1);
    });

    it("collapses an expanded folder and hides children", async () => {
      const folder = createFolder({ id: "f1", name: "Folder" });
      const childNote = createNote({
        id: "cn1",
        title: "Child Note",
        folderId: "f1",
      });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [childNote],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      // Collapse
      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      const folderNode = result.current.treeData.find((n) => n.id === "f1");
      expect(folderNode!.isExpanded).toBe(false);

      // Child should not be visible when collapsed
      const childNoteNode = result.current.treeData.find(
        (n) => n.id === "cn1"
      );
      expect(childNoteNode).toBeUndefined();
    });

    it("does not re-fetch when re-expanding a previously loaded folder", async () => {
      const folder = createFolder({ id: "f1" });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand - fetches contents
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      // Collapse
      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      // Re-expand - should NOT fetch again (data is cached)
      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      // getContents called twice total: once for root, once for first expand
      expect(mockGetContents).toHaveBeenCalledTimes(2);
    });
  });

  describe("refresh", () => {
    it("clears expanded state and re-fetches root data", async () => {
      const folder = createFolder({ id: "f1" });
      const childNote = createNote({ id: "cn1", folderId: "f1" });

      // Initial root fetch
      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand folder
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [childNote],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      expect(
        result.current.treeData.find((n) => n.id === "f1")!.isExpanded
      ).toBe(true);

      // Refresh
      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      await act(async () => {
        await result.current.refresh();
      });

      // After refresh, folder should no longer be expanded
      const folderNode = result.current.treeData.find((n) => n.id === "f1");
      expect(folderNode!.isExpanded).toBe(false);

      // Children should not appear
      const childNoteNode = result.current.treeData.find(
        (n) => n.id === "cn1"
      );
      expect(childNoteNode).toBeUndefined();
    });

    it("calls getContents with null folderId on refresh", async () => {
      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      await act(async () => {
        await result.current.refresh();
      });

      // Both calls should use folderId: null
      expect(mockGetContents).toHaveBeenNthCalledWith(1, { folderId: null });
      expect(mockGetContents).toHaveBeenNthCalledWith(2, { folderId: null });
    });

    it("sets refreshing to false after refresh completes", async () => {
      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.refreshing).toBe(false);
    });
  });

  describe("loading and error states", () => {
    it("starts with loading true and no error", () => {
      const { result } = renderHook(() => useTreeData());
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("sets loading to false after successful fetch", async () => {
      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets error message on fetch failure", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetContents.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Network error");

      consoleSpy.mockRestore();
    });

    it("sets generic error for non-Error exceptions", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetContents.mockRejectedValueOnce("string error");

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.error).toBe("Failed to load notes");

      consoleSpy.mockRestore();
    });

    it("clears error on successful re-fetch", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // First call fails
      mockGetContents.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.error).toBe("Network error");

      // Second call succeeds
      mockGetContents.mockResolvedValueOnce({ folders: [], notes: [] });

      await act(async () => {
        await result.current.fetchRootData();
      });

      expect(result.current.error).toBeNull();

      consoleSpy.mockRestore();
    });

    it("shows loading while initial fetch is in progress", async () => {
      let resolveGetContents!: (
        value: { folders: Folder[]; notes: Note[] }
      ) => void;
      mockGetContents.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveGetContents = resolve;
          })
      );

      const { result } = renderHook(() => useTreeData());

      // Start fetch without awaiting
      let fetchPromise: Promise<void>;
      await act(async () => {
        fetchPromise = result.current.fetchRootData();
      });

      // Loading should still be true while promise is pending
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveGetContents({ folders: [], notes: [] });
        await fetchPromise!;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("add-item nodes", () => {
    it("adds an add-item node at the end of expanded folder children", async () => {
      const folder = createFolder({ id: "f1", name: "Folder" });
      const childNote = createNote({
        id: "cn1",
        title: "Child Note",
        folderId: "f1",
      });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand folder
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [childNote],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      const addItem = result.current.treeData.find(
        (n) => n.type === "add-item"
      );
      expect(addItem).toBeDefined();
      expect(addItem!.id).toBe("add-f1");
      expect(addItem!.depth).toBe(1);
      expect(addItem!.parentFolderId).toBe("f1");
      expect(addItem!.data).toBeNull();
      expect(addItem!.hasChildren).toBe(false);
    });

    it("places add-item after all children of the expanded folder", async () => {
      const folder = createFolder({ id: "f1" });
      const childFolder = createFolder({
        id: "cf1",
        name: "Child Folder",
        parentId: "f1",
      });
      const childNote = createNote({
        id: "cn1",
        title: "Child Note",
        folderId: "f1",
      });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      mockGetContents.mockResolvedValueOnce({
        folders: [childFolder],
        notes: [childNote],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      const tree = result.current.treeData;
      // Expected order: f1, cf1, cn1, add-f1
      expect(tree[0]!.id).toBe("f1");
      expect(tree[1]!.id).toBe("cf1");
      expect(tree[2]!.id).toBe("cn1");
      expect(tree[3]!.id).toBe("add-f1");
      expect(tree[3]!.type).toBe("add-item");
    });

    it("adds add-item even when folder has no children", async () => {
      const folder = createFolder({ id: "f1" });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand empty folder
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      const tree = result.current.treeData;
      // folder + add-item
      expect(tree).toHaveLength(2);
      expect(tree[1]!.type).toBe("add-item");
      expect(tree[1]!.parentFolderId).toBe("f1");
    });

    it("does not show add-item when folder is collapsed", async () => {
      const folder = createFolder({ id: "f1" });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Folder is not expanded, so no add-item nodes
      const addItems = result.current.treeData.filter(
        (n) => n.type === "add-item"
      );
      expect(addItems).toHaveLength(0);
    });

    it("removes add-item when folder is collapsed after expanding", async () => {
      const folder = createFolder({ id: "f1" });

      mockGetContents.mockResolvedValueOnce({
        folders: [folder],
        notes: [],
      });

      const { result } = renderHook(() => useTreeData());

      await act(async () => {
        await result.current.fetchRootData();
      });

      // Expand
      mockGetContents.mockResolvedValueOnce({
        folders: [],
        notes: [],
      });

      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      expect(
        result.current.treeData.filter((n) => n.type === "add-item")
      ).toHaveLength(1);

      // Collapse
      await act(async () => {
        await result.current.toggleExpand("f1");
      });

      expect(
        result.current.treeData.filter((n) => n.type === "add-item")
      ).toHaveLength(0);
    });
  });
});
