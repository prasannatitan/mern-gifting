import {Link} from "react-router-dom"
export default function section3(){
    return<>
     <div>
        <div className="">
          <div className="md:py-10">
            <div className="flex flex-col justify-center max-md:px-[10px]">
              <h2 className="text-center text-[#E5CBB3] font-regular md:text-[46px] text-[31px] leading-[38px] [font-family:var(--secondary-font)] pb-5">
                Make Your Own Hamper
              </h2>
              <span className="text-center [font-family:var(--primary-font)] md:text-[24px] text-[17px] max-md:max-w-[395px] max-md:mx-auto max-md:leading-[23px] font-[400] text-[rgba(0,0,0,0.76)]">
                Elevate the art of giving with a personal touch. Bespoke luxury, curated by you and wrapped by us.
              </span>
            </div>
            <div className="py-10 max-md:pb-2 flex items-center gap-4 max-md:gap-y-7  max-md:flex-wrap max-md:justify-center">
             <div className="flex max-md:flex-col gap-[10px] relative justify-center items-center w-full">
                <img className="md:w-[50%]" src="/assets/OwnHamper1.png"/>
                <img className="md:w-[50%]" src="/assets/OwnHamper2.png"/>

                <div className="flex justify-center items-center  absolute border-10 rounded-full md:h-[174px] md:w-[174px] w-[140px] h-[140px] bg-white border-[rgba(229,203,179,0.72)]">
                    <p className="text-center md:text-[19px] text-[16px] md:leading-[23px] leading-[19px] [font-family:var(--secondary-font)] max-w-[95px] font-[500]">Make Your Own Hamper</p>
                </div>
             </div>
            </div>
          </div>
        </div>

        <div className="max-width">
           <div className="flex py-10 max-md:flex-col md:items-center md:gap-6 gap-4">
             <div className="md:w-[50%]">
                <img src="/assets/gift.png" alt="gift" />
            </div>
            <div className="md:w-[50%]">
                <h3 className="[font-family:var(--secondary-font)] md:text-[28px] text-[23px] font-[500]">Not sure what to gift?</h3>
                <p className="[font-family:var(--secondary-font)] text-[#D18E3D] font-[400] md:text-[25px] text-[19px]">Answer a few questions and find the perfect match !</p>

               <div className="md:mt-[80px] mt-[30px] ">
                 <Link to="#" className="flex gap-2 flex-nowrap w-[fit-content] [font-family:var(--secondary-font)] bg-[#D18E3D] text-white rounded-[11px] md:text-[19px] text-[15px] py-2 px-4">
                Start a Quiz <img src="/icon/right-arrow.svg" alt="arrow" className="max-md:w-[20px]" />
                </Link>
               </div>
            </div>

           </div>
        </div>
      </div>
      </>
}