const ProductGallery = ({
  images = [],
  activeImageIndex = 0,
  setActiveImageIndex,
  brandName,
  productName
}) => {
  const activeImage = images[activeImageIndex] || images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="space-y-4">
      <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 relative group shadow-sm">
        <img
          src={activeImage}
          alt={productName || 'Garment preview'}
          className="w-full h-full object-cover object-top"
        />
        {brandName && (
          <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 shadow-md backdrop-blur-md">
            {brandName}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                activeImageIndex === idx
                  ? 'border-blue-600 ring-2 ring-blue-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
