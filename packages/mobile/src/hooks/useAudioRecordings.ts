import { useCallback, useEffect, useState } from "react";
import { listRecordings, type SavedRecording } from "@/lib/audioStorage";
import { orpc } from "@/lib/orpc";

/** Unified audio recording with optional transcription data */
export interface AudioRecording {
  /** Local file URI for playback */
  fileUri: string;
  /** Local file name (e.g., "rec_1700000000000.m4a") */
  fileName: string;
  /** Display title (from transcription or generated default) */
  title: string;
  /** Transcription data if available */
  transcription?: {
    id: string;
    text: string;
    language: string | null;
  };
  /** Duration in seconds (from transcription) */
  durationSeconds?: number;
  /** When the recording was created */
  createdAt: Date;
}

export function useAudioRecordings() {
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    try {
      setError(null);

      // Fetch local files and transcription metadata in parallel
      const [localFiles, transcriptions] = await Promise.all([
        listRecordings(),
        orpc.transcriptions.list({}).catch((err: unknown) => {
          console.warn("Failed to fetch transcriptions:", err);
          return [] as Awaited<ReturnType<typeof orpc.transcriptions.list>>;
        }),
      ]);

      // Index transcriptions by localFileName for fast lookup
      const transcriptionsByFileName = new Map<
        string,
        (typeof transcriptions)[number]
      >();
      for (const t of transcriptions) {
        if (t.localFileName) {
          transcriptionsByFileName.set(t.localFileName, t);
        }
      }

      // Merge local files with transcription data
      const merged: AudioRecording[] = localFiles.map(
        (file: SavedRecording) => {
          const transcription = transcriptionsByFileName.get(file.fileName);

          const title =
            transcription?.title ??
            formatDefaultTitle(file.createdAt);

          const result: AudioRecording = {
            fileUri: file.fileUri,
            fileName: file.fileName,
            title,
            createdAt: file.createdAt,
          };

          if (transcription) {
            result.transcription = {
              id: transcription.id,
              text: transcription.text,
              language: transcription.language,
            };
            result.durationSeconds = transcription.durationSeconds;
          }

          return result;
        }
      );

      setRecordings(merged);
    } catch (err) {
      console.error("Failed to load audio recordings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load recordings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  return {
    recordings,
    loading,
    error,
    refresh: fetchRecordings,
  };
}

/** Generate a default title from a date: "Recording YYYY-MM-DD HH:MM" */
function formatDefaultTitle(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `Recording ${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
