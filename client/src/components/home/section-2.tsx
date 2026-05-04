import { Link } from "react-router-dom";

const PRICE_TIERS = [
  {
    title: "Elegant Finds",
    label: "Under ₹1000",
    href: "/collections?maxPrice=1000",
    image: "/assets/elegantfinds.png",
    alt: "Elegant finds — gifts under one thousand rupees",
  },
  {
    title: "Premium Selections",
    label: "₹1000-₹2500",
    href: "/collections?minPrice=1000&maxPrice=2500",
    image: "/assets/premium.png",
    alt: "Premium selections — gifts between one and two thousand five hundred rupees",
  },
  {
    title: "Exquisite Indulgence",
    label: "₹2500-₹5000",
    href: "/collections?minPrice=2500&maxPrice=5000",
    image: "/assets/exquisite.png",
    alt: "Exquisite indulgence — gifts between two thousand five hundred and five thousand rupees",
  },
  {
    title: "Bespoke Luxury",
    label: "Above ₹5000",
    href: "/collections?minPrice=5000",
    image: "/assets/luxury.png",
    alt: "Bespoke luxury — gifts above five thousand rupees",
  },
] as const;

export default function section2() {
  return (
    <div className="bg-[#fff] ">
      <div className="max-width">
        <div className="py-10">
          <div className="flex flex-col justify-center">
            <h2 className="text-center text-[#E5CBB3] font-regular md:text-[46px] text-[31px] leading-[38px] [font-family:var(--secondary-font)]">
              Opulence at Every Tier
            </h2>
          </div>
          <div className="py-8 grid md:grid-cols-4 grid-cols-2 md:gap-[32px] gap-[16px] ">
            {PRICE_TIERS.map((tier) => (
              <Link
                key={tier.href}
                to={tier.href}
                className="relative flex justify-center outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#832729]"
              >
                <div className="absolute bg-[rgba(243,229,216,0.71)] rounded-[4px] md:top-[50px] top-[25px] z-[1] pointer-events-none">
                  <p className="md:px-6 px-3 py-0 md:text-[20px] text-[15px] font-[500] [font-family:var(--primary-font)]">
                    {tier.title}
                  </p>
                </div>
                <img src={tier.image} alt={tier.alt} className="block w-full max-w-full" />
                <div className="absolute bg-[#000] rounded-[4px] md:bottom-[18px] bottom-[11px] z-[1] pointer-events-none">
                  <p className="ms:px-6 px-4 py-[2px] md:text-[19px] text-[14px] font-[500] [font-family:var(--primary-font)] text-[#F3E5D8]">
                    {tier.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
