import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '@/services/Axios';
import { useCart } from '@/context/CartContext';
import GarmentCard from '@/components/buyer/GarmentCard';
import ProductGallery from '@/components/buyer/product/ProductGallery';
import ProductVariantSelector from '@/components/buyer/product/ProductVariantSelector';
import ProductReviewsSection from '@/components/buyer/product/ProductReviewsSection';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [prodRes, reviewsRes, relatedRes, userRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/reviews`).catch(() => ({ data: [] })),
          api.get(`/products?limit=5`).catch(() => ({ data: { products: [] } })),
          api.get('/auth/profile').catch(() => ({ data: null }))
        ]);

        const prod = prodRes.data;
        setProduct(prod);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
        if (userRes?.data?.id) {
          setCurrentUser(userRes.data);
        }

        const related = (relatedRes.data?.products || relatedRes.data || []).filter(p => Number(p.id) !== Number(prod.id));
        setRelatedProducts(related.slice(0, 4));

        if (prod.variants && prod.variants.length > 0) {
          const first = prod.variants[0];
          setSelectedVariant(first);
          setSelectedSize(first.size || '');
          setSelectedColor(first.color || '');
        } else if (prod.sizes && prod.sizes.length > 0) {
          setSelectedSize(Array.isArray(prod.sizes) ? prod.sizes[0] : prod.sizes);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedVariant?.id, selectedColor]);

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    if (product?.variants && product.variants.length > 0) {
      const match = product.variants.find(v => v.size === size && (!selectedColor || v.color === selectedColor))
        || product.variants.find(v => v.size === size);
      if (match) {
        setSelectedVariant(match);
        if (match.color) setSelectedColor(match.color);
      }
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    if (product?.variants && product.variants.length > 0) {
      const match = product.variants.find(v => v.color === color && (!selectedSize || v.size === selectedSize))
        || product.variants.find(v => v.color === color);
      if (match) {
        setSelectedVariant(match);
        if (match.size) setSelectedSize(match.size);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const variantToAdd = selectedVariant 
      ? { 
          ...selectedVariant, 
          image_urls: (selectedVariant.image_urls && selectedVariant.image_urls.length > 0) 
            ? selectedVariant.image_urls 
            : (variantImages || images)
        }
      : { size: selectedSize, color: selectedColor, image_urls: images };

    addToCart(product, variantToAdd, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    setReviewSubmitting(true);
    try {
      const res = await api.post(`/products/${id}/reviews`, {
        rating,
        content: comment,
        comment
      });
      setReviews(prev => [res.data, ...prev]);
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(msg || 'Unable to submit review. Please try again.');
      return false;
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-24">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-[#121212] border-t-transparent animate-spin mx-auto" />
          <p className="text-[11px] uppercase tracking-fashion text-[#71717A]">
            Opening Atelier Archive...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-24 font-ui">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <h2 className="font-editorial text-3xl font-light text-[#121212]">Garment Not Found</h2>
          <p className="text-xs text-[#71717A] leading-relaxed">
            The archive piece you requested may have been discontinued or belongs to a private capsule.
          </p>
          <div className="pt-2">
            <Link 
              to="/products" 
              className="px-6 py-3 bg-[#121212] text-white text-[11px] font-medium uppercase tracking-fashion inline-block"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const variantImages = (selectedVariant?.image_urls && selectedVariant.image_urls.length > 0)
    ? selectedVariant.image_urls
    : null;

  const images = variantImages
    || (product.images && product.images.length > 0 ? product.images : null)
    || [product.main_image || product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'];

  const price = selectedVariant?.price_override 
    ? parseFloat(selectedVariant.price_override) 
    : parseFloat(product.base_price || product.price || 0);

  const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const currentStock = selectedVariant?.stock_quantity ?? product.stock_quantity ?? 10;

  const availableSizes = product.variants && product.variants.length > 0
    ? [...new Set(product.variants.map(v => v.size).filter(Boolean))]
    : (Array.isArray(product.sizes) ? product.sizes : ['Standard']);

  const availableColors = product.variants && product.variants.length > 0
    ? [...new Set(product.variants.map(v => v.color).filter(Boolean))]
    : (Array.isArray(product.colors) ? product.colors : []);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 sm:space-y-16">
        
        {/* Editorial Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] text-[#71717A] uppercase tracking-wider">
          <Link to="/" className="hover:text-[#121212] transition-colors">Home</Link>
          <ChevronRight size={11} className="text-[#A1A1AA]" />
          <Link to="/products" className="hover:text-[#121212] transition-colors">Catalog</Link>
          <ChevronRight size={11} className="text-[#A1A1AA]" />
          <span className="text-[#121212] font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Two-Column Atelier Product Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left: Gallery (7 columns on large) */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={images}
              activeImageIndex={activeImageIndex}
              setActiveImageIndex={setActiveImageIndex}
              brandName={product.brand_name}
              productName={product.name}
            />
          </div>

          {/* Right: Garment Details & Actions (5 columns) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828]">
                <span>{product.brand_name || 'MINIMAL ATELIER'}</span>
                <span>·</span>
                <span className="text-[#71717A]">{product.gender || 'UNISEX'}</span>
                <span>·</span>
                <span className="text-[#71717A]">{product.category_name || product.category || 'APPAREL'}</span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl font-light text-[#121212] leading-[1.1]">
                {product.name}
              </h1>
            </div>

            <p className="text-xs sm:text-[13px] text-[#71717A] leading-relaxed">
              {product.description || "Expertly tailored from select textiles with meticulous attention to drape, proportions, and finishing details. Crafted for considered wardrobes."}
            </p>

            <ProductVariantSelector
              price={price}
              comparePrice={comparePrice}
              currentStock={currentStock}
              availableSizes={availableSizes}
              selectedSize={selectedSize}
              onSelectSize={handleSizeChange}
              availableColors={availableColors}
              selectedColor={selectedColor}
              onSelectColor={handleColorChange}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              addedNotice={addedNotice}
            />

            <ProductReviewsSection
              reviews={reviews}
              currentUser={currentUser}
              onSubmitReview={handleReviewSubmit}
              reviewSubmitting={reviewSubmitting}
            />
          </div>

        </div>

        {/* Complete the Look Section */}
        {relatedProducts.length > 0 && (
          <section className="pt-12 sm:pt-16 border-t border-[#E8E8E4]">
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#E8E8E4]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block mb-1">
                  Atelier Curation
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-light text-[#121212]">
                  Complete the Ensemble
                </h2>
              </div>
              <Link
                to="/products"
                className="text-[11px] font-medium uppercase tracking-fashion text-[#121212] hover:text-[#843828] transition-colors"
              >
                View Full Catalog →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <GarmentCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;
