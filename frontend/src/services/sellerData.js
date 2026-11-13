export const normalizeSellerProduct = (product) => {
    const variants = (product.variants || []).map((variant) => {
        const urls = Array.isArray(variant.image_urls) ? variant.image_urls.filter(Boolean) : [];
        return {
            ...variant,
            price: variant.price_override ?? product.base_price,
            low_stock_threshold: variant.low_stock_threshold ?? 5,
            image_urls: urls,
            imagePreviews: [...urls],
            imageFiles: [],
        };
    });

    const allImages = [
        ...(Array.isArray(product.images) ? product.images : []),
        ...(product.main_image ? [product.main_image] : []),
        ...variants.flatMap((variant) => variant.image_urls || [])
    ].filter(Boolean);

    const uniqueImages = [...new Set(allImages)];

    return {
        ...product,
        price: product.base_price,
        images: uniqueImages.length > 0 ? uniqueImages : (product.main_image ? [product.main_image] : []),
        variants,
        variant_count: variants.length,
        total_stock: variants.reduce((total, variant) => total + Number(variant.stock_quantity || 0), 0),
    };
};

export const buildProductPayload = (formData, categories) => {
    const category = categories.find((item) => String(item.id) === String(formData.category_id));

    return {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        category_name: category?.name || 'Shirts & Tops',
        base_price: Number(formData.price),
        gender: formData.gender || 'Unisex',
        variants: JSON.stringify(formData.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            size: variant.size || 'M',
            color: variant.color || 'Standard',
            stock_quantity: Number(variant.stock_quantity || 10),
            low_stock_threshold: Number(variant.low_stock_threshold ?? 5),
            price_override: (variant.price !== '' && variant.price !== null && variant.price !== undefined) 
                ? Number(variant.price) 
                : Number(formData.price),
            image_urls: variant.image_urls || [],
        }))),
    };
};

export const getSellerErrorMessage = (error, fallback) =>
    error.response?.data?.error || error.message || fallback;
