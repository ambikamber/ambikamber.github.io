document.addEventListener('DOMContentLoaded', () => {
    // Initialize the website once products are loaded
    document.addEventListener('products-loaded', async () => {
        await loadCategories();
        await loadProducts();
        setupEventListeners();
    });
});

// Load categories into filter buttons
async function loadCategories() {
    const filterContainer = document.querySelector('.product-filters');
    if (!filterContainer) return;
    
    try {
        // Get all categories
        const categories = await productManager.getAllCategories();
        
        // Clear existing filter buttons except "All"
        const allButton = filterContainer.querySelector('[data-filter="all"]');
        filterContainer.innerHTML = '';
        
        if (allButton) {
            filterContainer.appendChild(allButton);
        } else {
            // Create "All" button if it doesn't exist
            const allBtn = document.createElement('button');
            allBtn.className = 'filter-btn active';
            allBtn.setAttribute('data-filter', 'all');
            allBtn.textContent = 'All';
            filterContainer.appendChild(allBtn);
        }
        
        // Add a button for each category
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.setAttribute('data-filter', category);
            
            // Capitalize first letter
            const displayName = category.charAt(0).toUpperCase() + category.slice(1);
            button.textContent = displayName;
            
            filterContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load products into the product grid
async function loadProducts(category = 'all') {
    const productGrid = document.getElementById('product-grid');
    
    // Show loading indicator
    productGrid.innerHTML = '<div class="loading-products">Loading products...</div>';
    
    try {
        // Get products from database
        const allProducts = await productManager.getAllProducts();
        
        // Filter products based on category
        const filteredProducts = category === 'all' 
            ? allProducts 
            : allProducts.filter(product => product.category === category);
        
        // Clear loading indicator
        productGrid.innerHTML = '';
        
        // Show message if no products
        if (filteredProducts.length === 0) {
            productGrid.innerHTML = `
                <div class="no-products-message">
                    ${category === 'all' 
                        ? 'No products found. Please check back later!' 
                        : `No products found in the "${category}" category.`}
                </div>
            `;
            return;
        }

        // Create product cards
        filteredProducts.forEach(product => {
            const productCard = createProductCard(product);
            productGrid.appendChild(productCard);
        });

        // Add animation to product cards
        animateProductCards();
    } catch (error) {
        console.error('Error loading products:', error);
        productGrid.innerHTML = '<div class="error-message">Error loading products. Please try again later.</div>';
    }
}

// Create a product card element
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

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get filter category and load products
            const category = button.getAttribute('data-filter');
            await loadProducts(category);
        });
    });

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

    // Close mobile menu when clicking on a link
    const navLinkItems = document.querySelectorAll('.nav-links a');
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                
                // Reset icon
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

   
}


// Animate product cards with a staggered effect
function animateProductCards() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

// Handle smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Adjust for header height
                behavior: 'smooth'
            });
        }
    });
}); 

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contact-form");

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission

        let formData = new FormData(form);

        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Message sent successfully!"); // Show success message
                form.reset(); // Reset form fields
            } else {
                alert("Error sending message. Please try again.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong. Please try again later.");
        });
    });
});
