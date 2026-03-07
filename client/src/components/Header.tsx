import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useCart } from "@/contexts/CartContext.tsx";

interface HeaderProps {
  onOpenCart: () => void;
}

export function Header({ onOpenCart }: HeaderProps) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
    
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Tanishq</span>
          <span className="text-sm text-gray-500 hidden sm:inline">Store</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-gray-700 hover:text-primary"
          >
            Home
          </Link>
          <Link
            to="/categories"
            className="text-sm font-medium text-gray-700 hover:text-primary"
          >
            Categories
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCart}
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-primary"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-gray-600 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <User className="h-4 w-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
