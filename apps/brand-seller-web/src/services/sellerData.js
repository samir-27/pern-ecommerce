export const normalizeSellerProduct = (product) => {
    const variants = (product.variants || []).map((variant) => ({
        ...variant,
        price: variant.price_override ?? product.base_price,
        low_stock_threshold: variant.low_stock_threshold ?? 5,
    }));

    return {
        ...product,
        price: product.base_price,
        images: product.main_image
            ? [product.main_image]
            : variants.flatMap((variant) => variant.image_urls || []).slice(0, 1),
        variants,
        variant_count: variants.length,
        total_stock: variants.reduce((total, variant) => total + Number(variant.stock_quantity || 0), 0),
    };
};

export const buildProductPayload = (formData, categories) => {
    const category = categories.find((item) => String(item.id) === String(formData.category_id));

    return {
        name: formData.name.trim(),
        description: formData.description,
        category_name: category?.name || 'General',
        base_price: Number(formData.price),
        gender: 'Unisex',
        clothing_type: formData.clothing_type,
        fabric_material: formData.fabric_material,
        fit: formData.fit,
        pattern: formData.pattern,
        season: formData.season,
        care_instructions: formData.care_instructions,
        variants: JSON.stringify(formData.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock_quantity: Number(variant.stock_quantity),
            low_stock_threshold: Number(variant.low_stock_threshold ?? 5),
            price_override: (variant.price !== '' && variant.price !== null && variant.price !== undefined) 
                ? Number(variant.price) 
                : Number(formData.price),
        }))),
    };
};

export const getSellerErrorMessage = (error, fallback) =>
    error.response?.data?.error || error.message || fallback;
