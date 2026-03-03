// pricing.js FINAL
const bannerPricing = {
    "blockout-fabric": {
        "material": 6.75, 
        "velcro": { "none": 0.00, "1": 1.50, "2": 2.50 },
        "turnaround": { "3": 0.00, "2": 2.00 }
    },
    "wrinkle-free": {
        "material": 3.00,
        "hem": { "3.00": 0.00, "3.50": 0.50 },
        "pocket": { "0": 0.00, "1.00": 1.00 },
        "velcro": { "0": 0.00, "1.50": 1.50, "3.00": 3.00 },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "hd-banner-18oz": {
        "material": 3.00,
        "pocket": { "0": 0.00, "1.00": 1.00 },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "pole-banners": {
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "mesh-banner": {
        "material": 2.00,
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "super-smooth": {
        "material": 1.25,
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "standard-banner": {
        "material": 0, 
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "tension-fabric": {
        "material": 6.00, 
        "pocket": { "0": 0.00, "1.00": 1.00 },
        "velcro": { "none": 0.00, "1.50": 1.50, "3.00": 3.00 },
        "turnaround": { "0": 0.00, "50": 50.00 }
    }
};

function getListProductPrice(productID, baseValueWholesale, turnVal, qty) {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    try {
        const product = bannerPricing[productID];
        const basePrice = parseFloat(baseValueWholesale);
        const rushFee = parseFloat(turnVal) || 0; 
        const multiplier = isWholesale ? 1 : 2;
        return (basePrice * multiplier * qty) + rushFee;
    } catch (e) {
        return 0;
    }
}

function getBannerTotalUnit(productID, velcroType, turnType, hemType = null, pocketType = null) {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    try {
        const product = bannerPricing[productID];
        if (!product) return { pricePerSqFt: 0, fixedFee: 0 };

        let totalSqFtWholesale = product.material;

        if (product.velcro && product.velcro[velcroType]) totalSqFtWholesale += product.velcro[velcroType];
        if (hemType && product.hem && product.hem[hemType]) totalSqFtWholesale += product.hem[hemType];
        if (pocketType && product.pocket && product.pocket[pocketType]) totalSqFtWholesale += product.pocket[pocketType];

        let fixedFee = 0;
        // AGREGAMOS "tension-fabric" a esta lista para que el Rush sea de $50 fijos
        const fixedFeeProducts = ["wrinkle-free", "hd-banner-18oz", "mesh-banner", "super-smooth", "tension-fabric", "standard-banner"];
        
        if (fixedFeeProducts.includes(productID)) {
            fixedFee = parseFloat(turnType) || 0;
        } else {
            totalSqFtWholesale += (product.turnaround ? (product.turnaround[turnType] || 0) : 0);
        }

        const multiplier = isWholesale ? 1 : 2;

        return {
            pricePerSqFt: totalSqFtWholesale * multiplier,
            fixedFee: fixedFee 
        };
    } catch (e) {
        return { pricePerSqFt: 0, fixedFee: 0 };
    }
}