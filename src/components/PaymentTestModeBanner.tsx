import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs text-orange-800 dark:bg-orange-950/40 dark:border-orange-900 dark:text-orange-200">
      Bu önizlemedeki ödemeler test modundadır — gerçek tahsilat yapılmaz.
    </div>
  );
}
