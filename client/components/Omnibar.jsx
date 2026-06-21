import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { normalizeProcessInput } from "@/utils/api";

import { Search } from "lucide-react";

export default function Omnibar({ options, recentProcesses, setProcessName }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const displayOptions = inputValue ? filteredOptions : recentProcesses;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = async (value) => {
    const normalized = normalizeProcessInput(value);
    if (!normalized) return;
    setProcessName(normalized);
    setIsOpen(false);
    await router.push(`/dashboard/${encodeURIComponent(normalized)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % displayOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + displayOptions.length) % displayOptions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (displayOptions[selectedIndex]) {
        handleNavigate(displayOptions[selectedIndex]);
      } else if (inputValue) {
        handleNavigate(inputValue);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="text-foreground font-medium">
          {part}
        </span>
      ) : (
        <span key={i} className="text-muted-foreground">
          {part}
        </span>
      )
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
 
      <div className="relative z-50 w-full max-w-lg mx-auto font-sans" ref={containerRef}>
        <div className="relative flex items-center group">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-card border border-border rounded-[6px] py-2.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all shadow-sm"
            placeholder="Search company or process..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setSelectedIndex(0);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-muted border border-border rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && displayOptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-12 left-0 right-0 bg-card border border-border rounded-[6px] shadow-lg overflow-hidden z-50"
            >
              <div className="p-1 max-h-[240px] overflow-y-auto">
                <div className="px-2 py-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider select-none">
                  {inputValue ? "Matching Processes" : "Recent Process Connections"}
                </div>
                {displayOptions.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => handleNavigate(option)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-[4px] text-xs transition-colors flex items-center justify-between ${
                      selectedIndex === index ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{highlightMatch(option, inputValue)}</span>
                    {selectedIndex === index && <span className="text-[10px] font-mono text-muted-foreground">↵</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </>
  );
}