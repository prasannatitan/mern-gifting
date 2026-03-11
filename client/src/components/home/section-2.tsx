import {Link} from 'react-router-dom';
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
            <div className="relative flex justify-center">
              <div className="absolute bg-[rgba(243,229,216,0.71)] rounded-[4px] md:top-[50px] top-[25px]">
                <p className="md:px-6 px-3 py-0 md:text-[20px] text-[15px] font-[500] [font-family:var(--primary-font)]">
                  Elegant Finds
                </p>
              </div>
              <Link to="#">
                <img src="/assets/elegantfinds.png" alt="elegantfinds" />
              </Link>
              <div className="absolute bg-[#000] rounded-[4px] md:bottom-[18px] bottom-[11px]">
                <p className="ms:px-6 px-4 py-[2px] md:text-[19px] text-[14px] font-[500] [font-family:var(--primary-font)] text-[#F3E5D8]">
                  Under ₹1000
                </p>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute bg-[rgba(243,229,216,0.71)] rounded-[4px] md:top-[50px] top-[25px]">
                <p className="md:px-6 px-3 py-0 md:text-[20px] text-[15px] font-[500] [font-family:var(--primary-font)]">
                  Premium Selections
                </p>
              </div>
              <Link to="#">
                <img src="/assets/premium.png" alt="premium" />
              </Link>
              <div className="absolute bg-[#000] rounded-[4px] md:bottom-[18px] bottom-[11px]">
                <p className="ms:px-6 px-4 py-[2px] md:text-[19px] text-[14px] font-[500] [font-family:var(--primary-font)] text-[#F3E5D8]">
                  ₹1000-₹2500
                </p>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute bg-[rgba(243,229,216,0.71)] rounded-[4px] md:top-[50px] top-[25px]">
                <p className="md:px-6 px-3 py-0 md:text-[20px] text-[15px] font-[500] [font-family:var(--primary-font)]">
                  Exquisite Indulgence
                </p>
              </div>
              <Link to="#">
                <img src="/assets/exquisite.png" alt="exquisite" />
              </Link>
              <div className="absolute bg-[#000] rounded-[4px] md:bottom-[18px] bottom-[11px]">
                <p className="ms:px-6 px-4 py-[2px] md:text-[19px] text-[14px] font-[500] [font-family:var(--primary-font)] text-[#F3E5D8]">
                  ₹2500-₹5000
                </p>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute bg-[rgba(243,229,216,0.71)] rounded-[4px] md:top-[50px] top-[25px]">
                <p className="md:px-6 px-3 py-0 md:text-[20px] text-[15px] font-[500] [font-family:var(--primary-font)]">
                  Bespoke Luxury
                </p>
              </div>
              <Link to="#">
                <img src="/assets/luxury.png" alt="luxury" />
              </Link>
              <div className="absolute bg-[#000] rounded-[4px] md:bottom-[18px] bottom-[11px]">
                <p className="ms:px-6 px-4 py-[2px] md:text-[19px] text-[14px] font-[500] [font-family:var(--primary-font)] text-[#F3E5D8]">
                  Above ₹5000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
