import { useRouter } from "next/router";
import { Sparkles, Settings } from "lucide-react";

import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";

export default function ProcessStepPage() {
  const router = useRouter();

  return (
    <AdminLayout
      title="Placement Administrator Hub"
      description="Select how you'd like to work with placement processes. Launch a guided creation workflow, or modify details of existing ones."
      isCreating={false}
      hideNavigation={true}
      hideActiveProcess={true}
    >
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <article 
          className="panel flex flex-col justify-between h-full hover:border-black transition duration-200 cursor-pointer" 
          onClick={() => router.push("/create")}
        >
          <div>
            <div className="mb-3 text-accent">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">Create New Process</h2>
            <p className="text-xs text-neutral-500 leading-relaxed mb-6">
              Start a step-by-step guided setup wizard. Great for creating a fresh placement drive where you will upload candidate excel lists, specify rounds, and start evaluating candidates sequentially.
            </p>
          </div>
          <Button variant="primary" onClick={(e) => { e.stopPropagation(); router.push("/create"); }}>
            Start Guided Setup &rarr;
          </Button>
        </article>

        <article 
          className="panel flex flex-col justify-between h-full hover:border-black transition duration-200 cursor-pointer" 
          onClick={() => router.push("/update")}
        >
          <div>
            <div className="mb-3 text-neutral-600">
              <Settings size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">Work with Existing Process</h2>
            <p className="text-xs text-neutral-500 leading-relaxed mb-6">
              Directly manage details of an ongoing process. Update metadata information, upload additional candidates, delete individual candidate profiles, check active cohorts, or configure evaluate stages.
            </p>
          </div>
          <Button variant="secondary" onClick={(e) => { e.stopPropagation(); router.push("/update"); }}>
            Open Control Dashboard &rarr;
          </Button>
        </article>
      </section>
    </AdminLayout>
  );
}
