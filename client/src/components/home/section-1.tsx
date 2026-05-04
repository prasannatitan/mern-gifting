export default function Section1() {
  return (
    <>
      <div className="bg-[#F5F5F5] ">
        <div className="max-width">
          <div className="py-10">
            <div className="flex flex-col justify-center">
              <h2 className="text-center text-[#E5CBB3] font-regular md:text-[46px] text-[35px] [font-family:var(--secondary-font)]">
                Perfect Picks
              </h2>
              <span className="text-center [font-family:var(--primary-font)] md:text-[24px] text-[17px] max-md:max-w-[280px] max-md:mx-auto max-md:leading-[23px] font-[400] text-[rgba(0,0,0,0.76)]">
                Curated Top Picks : Elevate Your Gifting with Timeless Elegance
              </span>
            </div>
            <div className="py-10 max-md:pb-2 flex items-center gap-4 max-md:gap-y-7  max-md:flex-wrap max-md:justify-center">
            <a href="/collections/festival" className="max-md:max-w-[38%]">
                <img src="/assets/Door (4).png" />
                <p className="font-[500] w-full py-[3px] border border-t-0 [font-family:var(--primary-font)] text-[17px] bg-[#F3E5D8] text-center">
                  Festival Gifts
                </p>
              </a>
              <img
                src="/assets/ta-icon.png"
                alt="tanishq icon"
                className="h-7"
              />
               <a href="/collections/anniversary" className="max-md:max-w-[38%]">
                <img src="/assets/Door (1).png" />
                <p className="font-[500] w-full py-[3px] border border-t-0 [font-family:var(--primary-font)] md:text-[17px] text-[14px] bg-[#F3E5D8] text-center">
                  Anniversary Gifts
                </p>
              </a>
              <img
                src="/assets/ta-icon.png"
                alt="tanishq icon"
                className="h-7 max-md:hidden"
              />
              <a href="/collections/personalised" className="max-md:max-w-[38%]">
                <img src="/assets/Door (2).png" />
                <p className="font-[500] w-full py-[3px] border border-t-0 [font-family:var(--primary-font)] md:text-[17px] text-[14px] bg-[#F3E5D8] text-center">
                Personalised Gifts
                </p>
              </a>
              <img
                src="/assets/ta-icon.png"
                alt="tanishq icon"
                className="h-7 max-md:hidden"
              />
              <a href="/collections/birthday" className="max-md:max-w-[38%]">
                <img src="/assets/Door.png" />
                <p className="font-[500] w-full py-[3px] border border-t-0 [font-family:var(--primary-font)] md:text-[17px] text-[14px] bg-[#F3E5D8] text-center">
                  Birthday Gifts
                </p>
              </a>
             
             
             
              
              <img
                src="/assets/ta-icon.png"
                alt="tanishq icon"
                className="h-7"
              />
              <a href="/" className="max-md:max-w-[38%]">
                <img src="/assets/Door (3).png" />
                <p className="font-[500] w-full py-[3px] border border-t-0 [font-family:var(--primary-font)] md:text-[17px] text-[14px] bg-[#F3E5D8] text-center">
                New Arrivals
                </p>
              </a>
             
             
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
