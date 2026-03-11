// app/components/HeroSwiper.tsx
'use client';

import {Swiper, SwiperSlide} from 'swiper/react';
import {Autoplay} from 'swiper/modules';
import Section1 from '../components/home/section-1'
import Section2 from '../components/home/section-2'
import Section3 from '../components/home/section-3'
import Section4 from '../components/home/section-4'
import 'swiper/css';

type HeroSlide = {
  id: string;
  image: string;
  alt?: string;
};

const slides: HeroSlide[] = [
  {
    id: '1',
    image: '/assets/slide-1.webp',
    alt: 'Hero banner',
  },
  {
    id: '2',
    image: '/assets/slide-2.webp',
    alt: 'Hero banner',
  },
  {
    id: '3',
    image: '/assets/slide-3.webp',
    alt: 'Hero banner',
  },
];

export default function Home() {
  return (
    <section className="w-full">
      <Swiper
         modules={[Autoplay]}
  slidesPerView={1}
  autoplay={{
    delay: 4000,              // ⏱ time banner stays (4s)
    disableOnInteraction: false,
  }}
        speed={800}   
        loop={true}
      
        allowTouchMove={true}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full "
              loading="eager"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <TextMarquee/>
      <Section1/>
      <Section2/>
      <Section3/>
      <Section4/>
    </section>
  );
}



const marqueeTexts = [
  "FREE SHIPPING ON ORDERS ABOVE ₹999",
  "NEW YEAR SALE UP TO 50% OFF",
  "EXTRA 10% OFF ON PREPAID ORDERS",
   "FREE SHIPPING ON ORDERS ABOVE ₹999",
  "NEW YEAR SALE UP TO 50% OFF",
  "EXTRA 10% OFF ON PREPAID ORDERS",
];

export  function TextMarquee() {
  return (
    <div className="w-full overflow-hidden bg-[#D18E3D] text-white md:py-2 py-1">
      <Swiper
        modules={[Autoplay]}
        loop={true}
        slidesPerView="auto"
        spaceBetween={80}
        speed={8000}              
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
        }}
        allowTouchMove={false}
      >
        {[...marqueeTexts, ...marqueeTexts].map((text, index) => (
          <SwiperSlide
            key={index}
            style={{ width: "auto" }}
            className="flex items-center"
          >
            <span className="whitespace-nowrap text-sm font-[300] tracking-wide inter">
              {text}
            </span>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}