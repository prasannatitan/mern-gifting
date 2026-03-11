import React, { useState } from 'react';
import mail from '/icon/mail.svg';
import logo from '/assets/tanishq-gifting.png';

export default function TanishqFooter() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: any) => {
    e.preventDefault();
    console.log('Subscribing email:', email);
    setEmail('');
  };

  return (
    <footer className="bg-[#F3E5D8]">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex max-md:flex-col pb-[50px] max-md:gap-10">
          {/* Brand Section */}
          <div className="flex flex-col gap-4 md:max-w-[40%] w-full">
            <div className="">
              <img src={logo} alt="logo" className='w-[98px] max-md:w-[85px]'/>
            </div>
            <p className="md:text-[19px] text-[16px] max-w-[450px] md:leading-[25px] leading-[23px] [font-family:var(--secondary-font)]">
              Curating extraordinary gifts for life's most memorable moments. Premium quality, thoughtful selection, unforgettable experiences.
            </p>
            <div className="flex gap-6">
              <a href="#" className="md:w-10 w-8 md:h-10 h-8 rounded-full bg-[#27272A] text-white flex items-center justify-center hover:bg-gray-700 transition">
                <img src="/icon/x.svg" alt="" />
              </a>
              <a href="#" className="md:w-10 w-8 md:h-10 h-8 rounded-full bg-[#27272A] text-white flex items-center justify-center hover:bg-gray-700 transition">
               <img src="/icon/instagram.svg" alt="" />
              </a>
              <a href="#" className="md:w-10 w-8 md:h-10 h-8 rounded-full bg-[#27272A] text-white flex items-center justify-center hover:bg-gray-700 transition">
                <img src="/icon/facebook.svg" alt="" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
        <div className='flex justify-between w-full max-w-[600px]'>
              <div>
            <h3 className="[font-family:var(--primary-font)] text-[19px] font-[600] text-black mb-4">Shop</h3>
            <ul className="flex flex-col gap-[5px] text-sm">
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">New Arrivals</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Best Sellers</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Gift Boxes</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Corporate Gifts</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Gift Cards</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="[font-family:var(--primary-font)] text-[19px] font-[600] text-black mb-4">Company</h3>
            <ul className="flex flex-col gap-[5px] text-sm">
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">About Us</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Our Story</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Sustainability</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Careers</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Press</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="[font-family:var(--primary-font)] text-[19px] font-[600] text-black mb-4">Support</h3>
            <ul className="flex flex-col gap-[5px] text-sm">
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Contact Us</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Shipping Info</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Returns</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">FAQs</a></li>
              <li><a href="#" className="hover:underline [font-family:var(--primary-font)] font-[400] text-[#666666]">Track Order</a></li>
            </ul>
          </div>
        </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-[#27272A] pt-8">
          <div className="max-w-xl">
            <h3 className="text-[20px] font-medium mb-2 [font-family:var(--primary-font)]">Join Our Newsletter</h3>
            <p className="[font-family:var(--primary-font)] font-[400] text-[16px] text-[#666666] mb-4">
              Get exclusive offers and gift inspiration delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 pt-2">
              <div className="relative flex items-center">
                <img src={mail} alt="mail icon" className='w-[20px] block absolute left-3' />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="rounded-[12px] w-full pl-10 pr-4 py-3 bg-[#27272A] text-[rgba(212,212,216,0.5)] rounded placeholder-[rgba(212,212,216,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-[12px] [font-family:var(--primary-font)] font-[500] px-8 py-3 bg-[#FE9A00] text-gray-900 hover:bg-amber-600 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="[font-family:var(--primary-font)] font-[400] text-[#666666]">
              © 2026 Tanishq. All rights reserved.
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="[font-family:var(--primary-font)] font-[400] text-[#666666]">Privacy Policy</a>
              <a href="#" className="[font-family:var(--primary-font)] font-[400] text-[#666666]">Terms of Service</a>
              <a href="#" className="[font-family:var(--primary-font)] font-[400] text-[#666666]">Cookie Policy</a>
            </div>

            <div className="flex items-center gap-2">
              <span className="[font-family:var(--primary-font)] font-[400] text-[#666666]">We Accept:</span>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-[#27272A] text-[#D4D4D8] text-xs font-medium rounded-[5px]">VISA</div>
                <div className="px-2 py-1 bg-[#27272A] text-[#D4D4D8] text-xs font-medium rounded-[5px]">MC</div>
                <div className="px-2 py-1 bg-[#27272A] text-[#D4D4D8] text-xs font-medium rounded-[5px]">AMEX</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}