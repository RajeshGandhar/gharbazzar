import Link from "next/link";
import { Home, Search, MapPinOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center gap-4">
      <div className="rounded-2xl bg-muted p-6">
        <MapPinOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants()}>
          <Home className="mr-2 h-4 w-4" />
          Back to home
        </Link>
        <Link href="/search" className={buttonVariants({ variant: "outline" })}>
          <Search className="mr-2 h-4 w-4" />
          Search properties
        </Link>
      </div>
    </div>
  );
}
