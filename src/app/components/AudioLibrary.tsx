"use client";

import React, { useEffect, useState } from "react";
import { openDB } from "idb";
import { List, Grid, Clock, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface StoredAudioFromDBType {
  id: number;
  name: string;
  type: string;
  data: ArrayBuffer;
  createdAt: string;
}

interface StoredAudioUIType {
  id: number;
  name: string;
  createdAt: string;
  url: string;
  duration?: number;
}

export default function AudioLibrary() {
  const [audios, setAudios] = useState<StoredAudioUIType[]>([])
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    const fetchAudioFiles = async () => {
      const db = await openDB("audioDB", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("audios")) {
            db.createObjectStore("audios", {
              keyPath: "id",
              autoIncrement: true,
            });
          }
        },
      });
      const allFiles = (await db.getAll("audios")) as StoredAudioFromDBType[];
      const filesWithUrls = allFiles.map((file) => {
        const blob = new Blob([file.data], { type: file.type || "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        return {
          id: file.id,
          name: file.name,
          createdAt: file.createdAt,
          url,
        };
      });

      const withDurations = await Promise.all(
        filesWithUrls.map(
          (audio) =>
            new Promise<StoredAudioUIType>((resolve) => {
              const audioElement = new Audio(audio.url);

              const setAudioDuration = () => {
                resolve({
                  ...audio,
                  duration: audioElement.duration,
                });
              };

              if (!isNaN(audioElement.duration) && audioElement.duration > 0) {
                setAudioDuration();
              } else {
                audioElement.addEventListener(
                  "loadedmetadata",
                  setAudioDuration
                );
              }
            })
        )
      );

      setAudios(withDurations);
    };

    fetchAudioFiles();

    return () => {
      audios.forEach((audio) => {
        URL.revokeObjectURL(audio.url);
    });
    };
  }, []);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="p-10 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Audio Library</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/add-audio-file")}
            variant="outline"
            className="text-black border-green-400 hover:bg-green-500 hover:text-black cursor-pointer"
            title="Add Audio File"
          >
            <Plus /> 
          </Button>
          <Button
            onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
            variant="outline"
            className="text-black border-green-400 hover:bg-green-500 hover:text-black cursor-pointer"
            title="Toggle View Mode"
          >
            {viewMode === "table" ? (
              <Grid className="w-5 h-5" />
            ) : (
              <List className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
      {audios.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          No audio added to your library.{" "}
          <span
            className="text-green-400 cursor-pointer"
            onClick={() => router.push("/add-audio-file")}
          >
            Add some audio
          </span>
          .
        </div>
      ) : (
        <>
          {viewMode === "table" && (
            <div className="overflow-x-auto rounded-lg bg-black/50 shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-green-800 text-green-400 uppercase text-sm tracking-wider">
                    <th className="p-4 font-medium">#</th>
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">
                      <Clock />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {audios.map((audio, index) => (
                    <tr
                      onClick={() => router.push(`/player/${audio.id}`)}
                      key={audio.id}
                      className="hover:bg-green-900/20 transition-colors border-b border-green-900/40 cursor-pointer"
                    >
                      <td className="p-4 text-green-500">{index + 1}</td>
                      <td className="p-4 text-white font-medium">
                        {audio.name}
                      </td>
                      <td className="p-4 text-gray-400">
                        {formatDuration(audio.duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {audios.map((audio) => (
                <div
                  onClick={() => router.push(`/player/${audio.id}`)}
                  key={audio.id}
                  className="bg-black hover:bg-green-900 transition rounded-lg p-3 w-full aspect-square flex flex-col cursor-pointer"
                >
                  <img
                    src="/default-audio-cover-2.jpg"
                    alt="Audio Cover"
                    className="w-full h-full object-cover rounded-md"
                  />

                  <div className="mt-2">
                    <p className="text-white font-semibold truncate">
                      {audio.name}
                    </p>
                    <div className="flex text-gray-400 text-sm items-center gap-1">
                      <Clock size={14} /> {formatDuration(audio.duration)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
