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
          api.get(`/products?limit=4`).catch(() => ({ data: { products: [] } })),
          api.get('/auth/profile').catch(() => ({ data: null }))
        ]);

        const prod = prodRes.data;
        setProduct(prod);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
        if (userRes?.data?.id) {
          setCurrentUser(userRes.data);
        }

        const related = (relatedRes.data?.products || relatedRes.data || []).filter(p => p.id !== prod.id);
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-96 max-w-xl mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-3xl mb-6"></div>
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 mx-auto rounded-lg"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Garment Not Found</h2>
        <p className="text-zinc-500 text-xs mt-2">The product you are looking for may have been archived.</p>
        <Link to="/products" className="mt-6 inline-block px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase">
          Back to Catalog
        </Link>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
        <Link to="/" className="hover:text-zinc-900 dark:hover:text-white">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-zinc-900 dark:hover:text-white">Shop</Link>
        <ChevronRight size={12} />
        <span className="text-zinc-900 dark:text-white font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Gallery */}
        <ProductGallery
          images={images}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
          brandName={product.brand_name}
          productName={product.name}
        />

        {/* Right: Garment Details & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {product.brand_name || 'MINIMAL Atelier'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {product.gender || 'Unisex'} / {product.category_name || product.category || 'Clothing'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              {product.name}
            </h1>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {product.description || "Expertly crafted from selected textiles with meticulous attention to drape, proportion, and finishing details. Designed for discerning wardrobes."}
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

      {/* Related Garments Carousel */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Complete the Atelier Look
            </h2>
            <Link to="/products" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Browse All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <GarmentCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
