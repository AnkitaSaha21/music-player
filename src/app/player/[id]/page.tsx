"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { openDB } from "idb";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";

interface StoredAudioFromDB {
  id: number;
  name: string;
  type: string;
  data: ArrayBuffer;
  createdAt: string;
}

interface StoredAudioUI {
  id: number;
  name: string;
  url: string;
  duration?: number;
}

export default function PlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [audios, setAudios] = useState<StoredAudioUI[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const db = await openDB("audioDB", 1);
      const allFiles = (await db.getAll("audios")) as StoredAudioFromDB[];

      const filesWithUrls = await Promise.all(
        allFiles.map(async (file) => {
          const blob = new Blob([file.data], {
            type: file.type || "audio/mpeg",
          });
          const url = URL.createObjectURL(blob);

          const duration = await new Promise<number>((resolve) => {
            const audio = document.createElement("audio");
            audio.src = url;
            audio.addEventListener("loadedmetadata", () => {
              resolve(audio.duration);
            });
          });

          return { id: file.id, name: file.name, url, duration };
        })
      );

      setAudios(filesWithUrls);
      const startIndex = filesWithUrls.findIndex((a) => a.id === Number(id));
      setCurrentIndex(startIndex >= 0 ? startIndex : 0);
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current
        .play()
        .catch((err) => console.warn("Playback interrupted:", err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  useEffect(() => {
    if (audioRef.current && audios.length > 0) {
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Autoplay was prevented:", err);
          setIsPlaying(false);
        });
    }
  }, [currentIndex, audios]);

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentIndex((prev) => (prev + 1) % audios.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentIndex((prev) => (prev - 1 + audios.length) % audios.length);
    setIsPlaying(true);
  };

  const handleSongSelect = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";
    const m = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col md:flex-row">
      {audios.length > 0 && (
        <>
          {/* Left: Player */}
          <div className="flex flex-col md:flex-1 py-4">
            <div className="px-4 mb-2">
              <button
                onClick={() => router.push("/")}
                className="flex items-center text-green-400 hover:text-green-300 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Library
              </button>
            </div>
            <div className="flex justify-center p-4 sm:p-6">
              <Image
                src="/default-audio-cover-2.jpg"
                alt="Cover"
                width={300}
                height={300}
                className="rounded-lg w-48 h-48 sm:w-72 sm:h-72 object-cover"
              />
            </div>

            <div className="flex flex-col items-center px-4">
              <h2 className="text-lg sm:text-2xl font-bold mb-2 text-center">
                {audios[currentIndex]?.name}
              </h2>
              <audio
                ref={audioRef}
                src={audios[currentIndex]?.url}
                onTimeUpdate={(e) =>
                  setProgress((e.target as HTMLAudioElement).currentTime)
                }
                onEnded={handleNext}
                onLoadedMetadata={() => setProgress(0)}
              />
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-xs sm:text-sm">{formatTime(progress)}</span>
                <input
                  type="range"
                  min="0"
                  max={audioRef.current?.duration || 0}
                  value={progress}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    if (audioRef.current) {
                      audioRef.current.currentTime = newTime;
                    }
                    setProgress(newTime);
                  }}
                  className="flex-1"
                />
                <span className="text-xs sm:text-sm">
                  {formatTime(audioRef.current?.duration || 0)}
                </span>
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={handlePrev}>
                  <SkipBack size={24} className="sm:w-8 sm:h-8" />
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? (
                    <Pause size={24} className="sm:w-8 sm:h-8" />
                  ) : (
                    <Play size={24} className="sm:w-8 sm:h-8" />
                  )}
                </button>
                <button onClick={handleNext}>
                  <SkipForward size={24} className="sm:w-8 sm:h-8" />
                </button>
              </div>
            </div>
          </div>

         
          <div className="w-full md:flex-1 pt-4 md:w-1/3 px-2 border-t md:border-t-0 md:border-l border-green-800 overflow-y-auto max-h-60 md:max-h-none">
            {audios.map((a, i) => (
              <div
                key={a.id}
                onClick={() => handleSongSelect(i)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition
                  ${
                    i === currentIndex
                      ? "bg-green-700 text-black"
                      : "hover:bg-green-900"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Music className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs sm:text-sm">
                      {a.name}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDuration(a.duration)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
