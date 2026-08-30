"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Settings, X } from "lucide-react";

interface MediaSettingsProps {
  mode: "image" | "video";
  onSettingsChange: (settings: any) => void;
  onGenerate: (settings: any) => void;
  isLoading: boolean;
}

export function MediaSettings({ mode, onSettingsChange, onGenerate, isLoading }: MediaSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const [imageSettings, setImageSettings] = useState({
    size: "2K",
    ratio: "16:9",
    quality: "standard",
    negative_prompt: "",
    steps: 20,
    n: 1,
  });

  const [videoSettings, setVideoSettings] = useState({
    duration: "5",
    size: "720P",
    aspect_ratio: "16:9",
    mode: "text",
    seed: "",
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

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl overflow-hidden backdrop-blur-sm">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          <span className="text-xs sm:text-sm text-white/60 font-mono">
            {mode === "image" ? "🖼️ Image Settings" : "🎬 Video Settings"}
          </span>
          {isLoading && (
            <span className="text-[10px] sm:text-xs text-cyan-400/40 animate-pulse">(generating...)</span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
            disabled={isLoading}
            className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-cyan-400 transition disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 sm:p-3 pt-0 border-t border-white/5 space-y-2 sm:space-y-3">
          {mode === "image" && (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Size</label>
                <select
                  value={imageSettings.size}
                  onChange={(e) => handleImageChange("size", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="3K">3K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Ratio</label>
                <select
                  value={imageSettings.ratio}
                  onChange={(e) => handleImageChange("ratio", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                >
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                  <option value="21:9">21:9</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Quality</label>
                <select
                  value={imageSettings.quality}
                  onChange={(e) => handleImageChange("quality", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="hd">HD</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Steps</label>
                <input
                  type="number"
                  value={imageSettings.steps}
                  onChange={(e) => handleImageChange("steps", parseInt(e.target.value) || 20)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                  min="1"
                  max="100"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] sm:text-xs text-white/40">Negative Prompt</label>
                <input
                  type="text"
                  value={imageSettings.negative_prompt}
                  onChange={(e) => handleImageChange("negative_prompt", e.target.value)}
                  placeholder="Avoid..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                />
              </div>
            </div>
          )}

          {mode === "video" && (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Duration</label>
                <select
                  value={videoSettings.duration}
                  onChange={(e) => handleVideoChange("duration", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                >
                  <option value="4">4s</option>
                  <option value="5">5s</option>
                  <option value="6">6s</option>
                  <option value="7">7s</option>
                  <option value="8">8s</option>
                  <option value="9">9s</option>
                  <option value="10">10s</option>
                  <option value="11">11s</option>
                  <option value="12">12s</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Resolution</label>
                <select
                  value={videoSettings.size}
                  onChange={(e) => handleVideoChange("size", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                >
                  <option value="720P">720P</option>
                  <option value="960P">960P</option>
                  <option value="2K">2K</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Aspect Ratio</label>
                <select
                  value={videoSettings.aspect_ratio}
                  onChange={(e) => handleVideoChange("aspect_ratio", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                  <option value="21:9">21:9</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-white/40">Mode</label>
                <select
                  value={videoSettings.mode}
                  onChange={(e) => handleVideoChange("mode", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                >
                  <option value="text">Text</option>
                  <option value="keyframe">Keyframe</option>
                  <option value="reference">Reference</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] sm:text-xs text-white/40">Seed (optional)</label>
                <input
                  type="text"
                  value={videoSettings.seed}
                  onChange={(e) => handleVideoChange("seed", e.target.value)}
                  placeholder="Random seed..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-1 sm:p-1.5 text-white text-[10px] sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
