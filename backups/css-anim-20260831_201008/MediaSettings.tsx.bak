"use client";

import { useState } from "react";

export function MediaSettings({ mode, onSettingsChange, onGenerate, isLoading }: any) {
  const [imageSettings, setImageSettings] = useState({
    size: "2K",
    ratio: "16:9",
    quality: "standard",
    steps: 20,
  });

  const [videoSettings, setVideoSettings] = useState({
    duration: "5",
    size: "720P",
    aspect_ratio: "16:9",
    mode: "text",
  });

  const handleImageChange = (key: string, value: any) => {
    const newSettings = { ...imageSettings, [key]: value };
    setImageSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleVideoChange = (key: string, value: any) => {
    const newSettings = { ...videoSettings, [key]: value };
    setVideoSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleGenerate = () => {
    if (mode === "image") onGenerate(imageSettings);
    else onGenerate(videoSettings);
  };

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-3 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60 font-mono">
          {mode === "image" ? "🖼️ Image Settings" : "🎬 Video Settings"}
        </span>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-4 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-cyan-400 text-sm transition disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>

      {mode === "image" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-white/40">Size</label>
            <select
              value={imageSettings.size}
              onChange={(e) => handleImageChange("size", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-sm"
            >
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="3K">3K</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40">Ratio</label>
            <select
              value={imageSettings.ratio}
              onChange={(e) => handleImageChange("ratio", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-sm"
            >
              <option value="1:1">1:1</option>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
            </select>
          </div>
        </div>
      )}

      {mode === "video" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-white/40">Duration</label>
            <select
              value={videoSettings.duration}
              onChange={(e) => handleVideoChange("duration", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-sm"
            >
              <option value="5">5s</option>
              <option value="10">10s</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40">Resolution</label>
            <select
              value={videoSettings.size}
              onChange={(e) => handleVideoChange("size", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-sm"
            >
              <option value="720P">720P</option>
              <option value="1080P">1080P</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
