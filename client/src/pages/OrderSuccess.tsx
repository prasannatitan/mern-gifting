import { Link, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export function OrderSuccess() {
  const location = useLocation();
  const message = (location.state as { message?: string })?.message ?? "Order placed successfully.";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Order placed</h1>
        <p className="mt-2 text-gray-600">{message}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
