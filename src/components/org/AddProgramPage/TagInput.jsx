import { useState } from "react";
import { INPUT_CLS } from "./constants";
import { IcoPlus, IcoX } from "./icons";

// ── tag input ─────────────────────────────────────────────────────────────────
export default function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {tags.map(tag => (
          <span key={tag}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "#EBF7FF", color: "#024677" }}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)}
              className="hover:text-red-400 transition">
              <IcoX />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="أضف كلمة مفتاحية ثم اضغط Enter"
          className={INPUT_CLS}
        />
        <button type="button" onClick={addTag}
          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-400 hover:text-teal-500 hover:border-teal-400 transition">
          <IcoPlus />
        </button>
      </div>
    </div>
  );
}
