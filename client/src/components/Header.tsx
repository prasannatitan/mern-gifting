import { Link } from "react-router-dom";
import React from "react";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useCart } from "@/contexts/CartContext.tsx";
import { NavLink} from 'react-router';
import logo from '/assets/tanishq-gifting.png';
import Search from '/icon/search.svg';
import Cart from '/icon/cart.svg'
import UserIcon from '/icon/user.svg'

interface HeaderProps {
  onOpenCart: () => void;
}

export function Header({ onOpenCart }: HeaderProps) {
  const { user } = useAuth();
  const { totalItems } = useCart();


const menu = [
  {
    label: 'NEW YEAR GIFTS',
    href: '/',
  },
  {
    label: 'AKSHAYA TRITYA GIFTS',
    href: '/',
  },
  {
    label: 'ALL GIFTS',
    href: '/collections',
  },
  {
    label: 'MAKE YOUR OWN HAMPER',
    href: '/',
  },
  {
    label: 'NEW ARRIVALS',
    href: '/',
  },
]
  return (
    <>
    <header className="p-3 pb-2 top-0 sticky z-[2] bg-[#F3E5D8]">
   <div className='flex justify-between w-full items-center'>
       <NavLink prefetch="intent" to="/" end>
        <img src={logo} alt="logo" className="w-[100px]" />
      </NavLink>

      <div className="max-w-[316px] w-full rounded-[8px] bg-[rgba(255,255,255,0.51)] border-neutral-400 border flex items-center gap-2 p-2">
       <img src={Search} alt="search icon" />
        <input
          type="text"
          placeholder="Search for gifts"
          className="[font-family:var(--primary-font)] border-none outline-none font-[400] text-[13.50px] text-[rgba(0,0,0,0.52)]"
        />
      </div>
     
      <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCart}
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-primary"
            aria-label="Open cart"
          >
            <img src={Cart} alt="CART ICON" className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2 p-2 rounded-lg  hover:bg-gray-100">
              
             
              <span className="hidden text-sm text-gray-600 sm:inline">
                <Link to="/profile">
                <img src={UserIcon} alt="USER ICON" className="h-5 " />
                </Link>
              </span>
            </div>
          ) : (
            <Link
              to="/login"
              className="[font-family:var(--secondary-font)] border border-1 border-black flex items-center gap-1 rounded-lg bg-primary px-3 py-0.5 text-sm font-medium text-black hover:bg-primary/90"
            >
             Login
            </Link>
          )}
        </div>
   </div>
   <div className='pt-3 flex justify-center header-menu-desktop'>
     {menu.map((itm, key)=>{
      return (
        <React.Fragment key={key}>
        <Link className="cursor-pointer [font-family:var(--secondary-font)] text-[16px] font-[400]" to={itm.href} key={key}>
          {itm.label}
        </Link>
        <hr className="bg-black h-[-webkit-fill-available] w-[1px]" />
        </React.Fragment>
      )
     })}
   </div>
    </header>


    {/* <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
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

       
      </div>
    </header> */}
    </>
  );
}
