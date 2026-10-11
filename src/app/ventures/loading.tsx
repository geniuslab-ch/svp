import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-12 w-64" />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 lg:pl-[290px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface overflow-hidden">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
