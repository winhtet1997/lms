'use client'
import { useState, useEffect } from "react";

export default function TagInput({ maxTags = 10, onChange, initialTags = [], error: externalError }) {
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");


  const serializedInitialTags = JSON.stringify(initialTags);
  useEffect(() => {
    setTags(JSON.parse(serializedInitialTags));
  }, [serializedInitialTags]);

  const addTag = (val) => {
    const newTag = val.trim();
    if (!newTag) return;

    if (tags.length >= maxTags) {
      setError(`You can only add up to ${maxTags} tags.`);
      return;
    }

    if (!tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      onChange?.(updatedTags);
    }
    setInputValue("");
    setError("");
  };

  const handleKeyDown = (e) => {
    // Commit on Enter OR Comma
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim() !== "") {
      e.preventDefault();
      addTag(inputValue.replace(",", "")); // remove comma if that was the trigger
    }

    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    // If user clicks away and there is text, save it as a tag automatically
    if (inputValue.trim() !== "") {
      addTag(inputValue);
    }
  };

  const removeTag = (index) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
    onChange?.(updatedTags);
    setError("");
  };

  return (
    <div className="w-full">
      <div className={`flex flex-wrap items-center gap-2 border rounded-lg p-2 bg-gray-50 focus-within:bg-white focus-within:ring-2 transition-all ${externalError ? 'border-red-400 focus-within:ring-red-200' : 'border-gray-200 focus-within:ring-info/20'}`}>
        {tags.map((tag, index) => (
          <div key={index} className="badge badge-soft badge-info gap-2 px-3 py-3 border-none ">
            {tag}
            <button type="button" onClick={() => removeTag(index)} className="hover:text-black">
              ✕
            </button>
          </div>
        ))}

        <input
          type="text"
          placeholder={tags.length < maxTags ? "Add tag..." : ""}
          className="flex-1 min-w-[120px] focus:outline-none bg-transparent text-sm py-1"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur} // <--- FIX: Captures tag when user clicks away
        />
      </div>
      {(error || externalError) && <p className="mt-2 text-xs text-error font-medium">{error || externalError}</p>}
    </div>
  );
}