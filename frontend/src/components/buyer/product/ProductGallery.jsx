const ProductGallery = ({
  images = [],
  activeImageIndex = 0,
  setActiveImageIndex,
  brandName,
  productName
}) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80';
  const activeImage = images[activeImageIndex] || images[0] || fallbackImage;

  return (
    <div className="space-y-3 font-ui">
      {/* Primary 3:4 High-Fashion Canvas */}
      <div className="aspect-[3/4] overflow-hidden bg-[#F4F4F2] border border-[#E8E8E4] relative group">
        <img
          src={activeImage}
          alt={productName || 'Garment presentation'}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
        {brandName && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-medium uppercase tracking-fashion bg-[#FBFBFA]/95 text-[#121212] border border-[#E8E8E4] shadow-xs">
            {brandName}
          </span>
        )}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 text-[9px] font-tabular tracking-wider bg-black/60 text-white backdrop-blur-xs">
          {activeImageIndex + 1} / {images.length || 1}
        </div>
      </div>

      {/* Architectural Thumbnails Track */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`w-16 sm:w-20 aspect-[3/4] overflow-hidden border shrink-0 transition-all cursor-pointer ${
                activeImageIndex === idx
                  ? 'border-[#121212] opacity-100 ring-1 ring-[#121212]'
                  : 'border-[#E8E8E4] opacity-60 hover:opacity-100 hover:border-[#71717A]'
              }`}
            >
              <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
