import React from 'react';
import { FaArrowRight } from "react-icons/fa";

const Hero = () => {
  return (
    <div>
      <div className="mt-10 text-2xl font-bold">

        <h1>MEN</h1>
        <h1>WOMEN</h1>
        <h1>KIDS</h1>
      </div>
      <form>
        <input type="text" placeholder="Search for products..." className="border border-gray-300 px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-accent" />
      </form>
      <div className="grid grid-cols-3 gap-4 mt-16 h-10">
        <div className="flex flex-col justify-between h-full">
          <div>
            <h1 className="text-5xl font-bold">NEW</h1>
            <h1 className="text-5xl font-bold">COLLECTION</h1>
          </div>

          <button className="mt-4 px-6 py-4 bg-accent text-white font-semibold rounded hover:bg-accent-dark transition-colors flex items-center gap-2 ">
            SHOP NOW <FaArrowRight />
          </button>
        </div>
        <div className="h-96 overflow-hidden">
          <img className="w-full h-full object-cover" src="https://i.etsystatic.com/40206181/r/il/26a49b/6333605293/il_570xN.6333605293_mwt3.jpg" alt="" />
        </div>
        <div className="h-96 overflow-hidden">
          <img className="w-full h-full object-contain" src="https://cdn.shopaccino.com/ajoobaa/products/mens-crochet-sweater-granny-square--7-184720696771300_l.jpg?v=730" alt="" />

        </div>
      </div>
    </div>

  );
};

export default Hero;  