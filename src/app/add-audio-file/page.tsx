"use client";
import { useRouter } from "next/navigation";
import AudioDropzone from "../components/AudioDropzone";
import { ArrowLeft } from "lucide-react";

export default function AddFilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 text-center">
      <AudioDropzone />
      <button
        onClick={() => router.push("/")}
        className="flex items-center text-green-400 hover:text-green-300 cursor-pointer mx-auto"
      >
        <ArrowLeft className="w-5 h-5 mr-2 sm:hidden md:visible" />
        Click here to go back to Your Audio Library
      </button>
    </div>
  );
}
