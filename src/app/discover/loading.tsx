import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-12 w-56" />
      <div className="mt-10 flex justify-center">
        <Skeleton className="h-[580px] w-full max-w-[420px] rounded-[24px]" />
      </div>
    </div>
  );
}
