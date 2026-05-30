import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useIsFetching } from "@tanstack/react-query";

export default function NetworkLogTicker() {
  const isFetching = useIsFetching();
  const [logs, setLogs] = useState([{ id: Date.now(), text: "> standing by for socket updates..." }]);
  const logIdRef = useRef(0);

  useEffect(() => {
    if (isFetching) {
      setLogs((prev) => {
        const newLogs = [...prev, { id: ++logIdRef.current, text: "> pinging wdis-server..." }].slice(-3);
        return newLogs;
      });
    } else {
        const timer = setTimeout(() => {
             setLogs((prev) => {
                 return [...prev, { id: ++logIdRef.current, text: "> synced." }].slice(-3);
             })
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isFetching]);

  useEffect(() => {
      const interval = setInterval(() => {
          if(!isFetching && Math.random() > 0.7) {
              setLogs(prev => [...prev, { id: ++logIdRef.current, text: "> awaiting connections..." }].slice(-3));
          }
      }, 5000);
      return () => clearInterval(interval);
  }, [isFetching]);

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none flex flex-col items-end gap-1 font-mono text-[10px] text-gray-500">
      <AnimatePresence>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {log.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}