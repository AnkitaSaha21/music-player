"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { openDB } from "idb";
import { useRouter } from "next/navigation";

export default function AudioDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const router = useRouter();

  const initDB = async () => {
    return openDB("audioDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("audios")) {
          db.createObjectStore("audios", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedAudioFile = acceptedFiles[0];
    if (uploadedAudioFile) {
      setFile(uploadedAudioFile);
      setFileName(uploadedAudioFile.name.replace(/\.[^/.]+$/, ""));
    } else {
      alert("Please drop a valid audio file.");
    }
  }, []);

  const saveFile = async () => {
    if (!file) 
        return;
    const db = await initDB();
    const fileData = {
      name: fileName,
      type: file.type,
      data: await file.arrayBuffer(),
      createdAt: new Date(),
    };
    await db.add("audios", fileData);
    setFile(null);
    setFileName("")
    alert("Audio saved successfully to your audio library!");
    router.push("/")
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [] },
    maxFiles: 1,
  });

  return (
    <>
      <div className="max-w-5xl mx-auto p-6">
        <div className="p-6 border border-green-500 rounded-lg bg-black shadow-lg max-w-5xl mx-auto text-green-400">
          <h1 className="text-2xl font-bold mb-6 text-green-400">
            Upload Audio Files
          </h1>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-6 text-center cursor-pointer rounded-lg transition-colors ${
              isDragActive
                ? "border-green-500 bg-green-900/20"
                : "border-green-500 bg-black hover:bg-green-900/10"
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-green-300">Drop the audio file here...</p>
            ) : (
              <p className="text-green-400">
                Drag and drop an audio file, or click to select
              </p>
            )}
          </div>

          {file && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-green-300">
                Edit Audio Name:
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="border border-green-500 bg-black text-green-400 rounded p-2 w-full mt-1 focus:outline-none focus:border-green-400"
              />
              <button
                onClick={saveFile}
                className="mt-3 bg-green-600 text-black font-semibold px-4 py-2 rounded hover:bg-green-500 transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
