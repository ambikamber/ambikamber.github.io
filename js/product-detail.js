document.addEventListener('DOMContentLoaded', () => {
    // Initialize the product detail page once products are loaded
    document.addEventListener('products-loaded', async () => {
        await loadProductDetail();
        setupEventListeners();
    });
});

// Get product ID from URL parameter
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load product detail
async function loadProductDetail() {
    const productId = getProductIdFromUrl();
    const productDetailContent = document.getElementById('product-detail-content');
    const productTitleBreadcrumb = document.getElementById('product-title-breadcrumb');
    
    if (!productId) {
        // No product ID provided, show error
        productDetailContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Product not found. Please go back to the <a href="index.html#products">products page</a>.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Get product details
        const product = await productManager.getProductById(productId);
        
        if (!product) {
            // Product not found, show error
            productDetailContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Product not found. Please go back to the <a href="index.html#products">products page</a>.</p>
                </div>
            `;
            return;
        }
        
        // Update page title and breadcrumb
        document.title = `${product.title} - Ambikamber`;
        if (productTitleBreadcrumb) {
            productTitleBreadcrumb.textContent = product.title;
        }
        
        // Render product detail
        productDetailContent.innerHTML = `
            <div class="product-image-container">
                <div class="product-image-main">
                    ${product.createdAt && (new Date().getTime() - new Date(product.createdAt.toDate()).getTime()) < 7 * 24 * 60 * 60 * 1000 ? 
                    '<span class="product-badge">New</span>' : ''}
                    <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'" onload="this.parentElement.style.height = 'auto'">
                </div>
            </div>
            <div class="product-info-container">
                <div class="product-category">${product.category}</div>
                <h1 class="product-title">${product.title}</h1>
                <div class="product-price">${product.price.toFixed(2)}</div>
                
                <div class="product-description-container">
                    <h3 class="description-title">Product Description</h3>
                    <div class="product-description">${product.description}</div>
                </div>
                
                <div class="product-actions">
                    <a href="https://wa.me/917080480777?text=${encodeURIComponent(`I'm interested in your ${product.title} for ₹${product.price.toFixed(2)}\n\nView product: https://ambikamber.shop/product-detail.html?id=${product.id}`)}" class="whatsapp-btn" target="_blank" data-product-id="${product.id}">
                        <i class="fab fa-whatsapp"></i> Buy on WhatsApp
                    </a>
                </div>
            </div>
        `;
        
        // Track page view
        trackInteraction('view', product.id);
        
        // Add event listener for WhatsApp button
        const whatsappBtn = productDetailContent.querySelector('.whatsapp-btn');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', function() {
                trackInteraction('whatsapp', this.dataset.productId);
            });
        }
        
        // Load related products
        await loadRelatedProducts(product.category, product.id);
        
    } catch (error) {
        console.error('Error loading product detail:', error);
        productDetailContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading product details. Please try again later.</p>
            </div>
        `;
    }
}

// Load related products
async function loadRelatedProducts(category, currentProductId) {
    const relatedProductsGrid = document.getElementById('related-products-grid');
    
    if (!relatedProductsGrid) return;
    
    try {
        // Get related products using the ProductManager method
        const relatedProducts = await productManager.getRelatedProducts(currentProductId, 4);
        
        // Clear grid
        relatedProductsGrid.innerHTML = '';
        
        // Show message if no related products
        if (relatedProducts.length === 0) {
            relatedProductsGrid.innerHTML = `
                <div class="no-products-message">
                    No related products found.
                </div>
            `;
            return;
        }
        
        // Create product cards for related products
        relatedProducts.forEach(product => {
            const productCard = createProductCard(product);
            relatedProductsGrid.appendChild(productCard);
        });
        
    } catch (error) {
        console.error('Error loading related products:', error);
        relatedProductsGrid.innerHTML = `
            <div class="error-message">
                Error loading related products.
            </div>
        `;
    }
}

// Create a product card element (similar to main.js)
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Check if product is new (less than 7 days old)
    const isNewProduct = product.createdAt && 
        (new Date().getTime() - new Date(product.createdAt.toDate()).getTime()) < 7 * 24 * 60 * 60 * 1000;
    
    card.innerHTML = `
        <div class="product-image">
            ${isNewProduct ? '<span class="product-badge">New</span>' : ''}
            <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/300x250?text=No+Image'">
        </div>
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">${product.price.toFixed(2)}</div>
            <div class="product-actions">
                <a href="product-detail.html?id=${product.id}" class="btn view-details-btn" data-product-id="${product.id}">View Details</a>
                <a href="https://wa.me/917080480777?text=${encodeURIComponent(`I'm interested in your ${product.title} for ₹${product.price.toFixed(2)}\n\nView product: https://ambikamber.shop/product-detail.html?id=${product.id}`)}" class="whatsapp-btn" target="_blank" data-product-id="${product.id}">
                    <i class="fab fa-whatsapp"></i> Buy
                </a>
            </div>
        </div>
    `;
    
    // Add event listeners for tracking
    setTimeout(() => {
        const viewDetailsBtn = card.querySelector('.view-details-btn');
        const whatsappBtn = card.querySelector('.whatsapp-btn');
        
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', function(e) {
                trackInteraction('view', this.dataset.productId);
            });
        }
        
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', function(e) {
                trackInteraction('whatsapp', this.dataset.productId);
            });
        }
    }, 100);
    
    return card;
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Toggle icon between bars and times
            const icon = mobileMenuBtn.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Add event listeners for product images if needed
    const productImage = document.querySelector('.product-image-main img');
    if (productImage) {
        productImage.addEventListener('load', function() {
            // Adjust container size to match the image
            const container = this.parentElement;
            container.style.width = 'auto';
            container.style.height = 'auto';
        });
    }
}

// Track interaction with product
function trackInteraction(type, productId) {
    try {
        // Check if Firebase is initialized and productId is valid
        if (!firebase || !firebase.firestore) {
            console.error('Firebase is not initialized');
            return;
        }
        
        if (!productId) {
            console.error('Invalid product ID for tracking:', productId);
            return;
        }
        
        const db = firebase.firestore();
        
        // Add interaction to Firestore
        db.collection('interactions').add({
            type: type,
            productId: productId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            page: window.location.pathname,
            sessionId: getSessionId()
        })
        .then(() => {
            console.log(`Tracked ${type} interaction for product ${productId}`);
        })
        .catch(error => {
            console.error('Error tracking interaction:', error);
        });
    } catch (error) {
        console.error('Error in trackInteraction function:', error);
    }
}

// Generate or retrieve session ID
function getSessionId() {
    let sessionId = sessionStorage.getItem('ambikamber_session_id');
    
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('ambikamber_session_id', sessionId);
    }
    
    return sessionId;
} 