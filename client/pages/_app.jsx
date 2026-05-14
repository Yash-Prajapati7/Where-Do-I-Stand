import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
            staleTime: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-canvas text-textPrimary">
        <Component {...pageProps} />
      </div>
    </QueryClientProvider>
  );
}
