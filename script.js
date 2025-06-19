document.addEventListener('DOMContentLoaded', () => {
    // State
    let cart = [];
    const username = localStorage.getItem('username') || 'Guest';
    let orderHistory = JSON.parse(localStorage.getItem(`orderHistory_${username}`)) || [];
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    // DOM Elements
    const usernameDisplay = document.getElementById('usernameDisplay');
    const logoutBtn = document.querySelector('.logout-btn');
    const toggleBtn = document.querySelector('.toggle-btn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const menuSection = document.getElementById('menu');
    const cartItemsList = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const prepTime = document.getElementById('prepTime');
    const confirmOrderBtn = document.getElementById('confirmOrder');
    const orderModal = document.getElementById('orderModal');
    const modalUsername = document.getElementById('modalUsername');
    const modalPrepTime = document.getElementById('modalPrepTime');
    const closeModalBtn = document.getElementById('closeModal');
    const orderHistoryList = document.getElementById('orderHistory');

    // Apply Dark Mode
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = 'Toggle Light Mode';
    } else {
        toggleBtn.textContent = 'Toggle Dark Mode';
    }

    // Set Username
    if (usernameDisplay) {
        usernameDisplay.textContent = username;
    }

    // Map category display names to filter values
    const categoryMap = {
        'vegetarian delights': 'vegetarian',
        'non-vegetarian favorites': 'non-vegetarian',
        'pizzas': 'pizza',
        'beverages': 'beverage'
    };

    // Filter Menu Based on Category and Type
    function filterMenu() {
        const urlParams = new URLSearchParams(window.location.search);
        const menuType = urlParams.get('type') || 'all';
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            const categoryDisplayName = category.querySelector('h3').textContent.toLowerCase();
            const categoryValue = categoryMap[categoryDisplayName] || categoryDisplayName;
            const items = category.querySelectorAll('.item');
            if (selectedCategory === 'all' || selectedCategory === categoryValue) {
                category.style.display = 'block';
                items.forEach(item => {
                    const itemType = item.dataset.type;
                    if (menuType === 'all' || itemType === menuType) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            } else {
                category.style.display = 'none';
            }
        });
    }

    if (menuSection) {
        filterMenu();
    }

    // Category Filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterMenu);
    }

    // Update Price on Customization Change
    document.querySelectorAll('.customization').forEach(select => {
        select.addEventListener('change', (e) => {
            const itemElement = e.target.closest('.item');
            const priceElement = itemElement.querySelector('.price');
            const addToCartBtn = itemElement.querySelector('.add-to-cart');
            const selectedOption = e.target.options[e.target.selectedIndex];
            const newPrice = parseInt(selectedOption.dataset.price);
            priceElement.textContent = `Price: ₹${newPrice}`;
            addToCartBtn.dataset.price = newPrice;
        });
    });

    // Add to Cart
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const itemElement = e.target.closest('.item');
            const name = e.target.dataset.name;
            const price = parseInt(e.target.dataset.price);
            const customization = itemElement.querySelector('.customization').value;
            const cartItem = { name, price, quantity: 1, customization };
            const existingItem = cart.find(item => item.name === name && item.customization === customization);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(cartItem);
            }
            updateCart();
        }
    });

    // Update Cart UI
    function updateCart() {
        if (cartItemsList) {
            cartItemsList.innerHTML = '';
            let total = 0;
            let totalPrepTime = 0;
            cart.forEach(item => {
                total += item.price * item.quantity;
                totalPrepTime += 5 * item.quantity;
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    ${item.name} (${item.customization}) x${item.quantity} - ₹${item.price * item.quantity}
                    <div class="quantity">
                        <button class="decrease" data-name="${item.name}" data-customization="${item.customization}">-</button>
                        <button class="increase" data-name="${item.name}" data-customization="${item.customization}">+</button>
                    </div>
                `;
                cartItemsList.appendChild(li);
            });
            cartTotal.textContent = total;
            prepTime.textContent = totalPrepTime;
        }
    }

    // Adjust Quantity
    if (cartItemsList) {
        cartItemsList.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            const customization = e.target.dataset.customization;
            const item = cart.find(item => item.name === name && item.customization === customization);
            if (e.target.classList.contains('increase')) {
                item.quantity += 1;
            } else if (e.target.classList.contains('decrease') && item.quantity > 1) {
                item.quantity -= 1;
            } else if (e.target.classList.contains('decrease')) {
                cart = cart.filter(item => !(item.name === name && item.customization === customization));
            }
            updateCart();
        });
    }

    // Confirm Order
    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            modalUsername.textContent = username;
            modalPrepTime.textContent = prepTime.textContent;
            orderModal.style.display = 'flex';
            orderHistory.push({
                items: [...cart],
                total: parseInt(cartTotal.textContent),
                prepTime: parseInt(prepTime.textContent),
                date: new Date().toLocaleString()
            });
            localStorage.setItem(`orderHistory_${username}`, JSON.stringify(orderHistory));
            cart = [];
            updateCart();
            updateHistory();
        });
    }

    // Close Modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            orderModal.style.display = 'none';
        });
    }

    // Update Order History
    function updateHistory() {
        if (orderHistoryList) {
            orderHistoryList.innerHTML = '';
            orderHistory.forEach(order => {
                const li = document.createElement('li');
                const itemsList = order.items.map(item => `${item.name} (${item.customization}) x${item.quantity}`).join(', ');
                li.textContent = `Order on ${order.date}: ${itemsList} - ₹${order.total}, ${order.prepTime} mins`;
                orderHistoryList.appendChild(li);
            });
        }
    }
    updateHistory();

    // Search Menu
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const urlParams = new URLSearchParams(window.location.search);
            const menuType = urlParams.get('type') || 'all';
            const items = document.querySelectorAll('.item');
            let hasVisibleItems = false;

            items.forEach(item => {
                const name = item.querySelector('h3').textContent.toLowerCase();
                const itemType = item.dataset.type;
                if (name.includes(query) && (menuType === 'all' || itemType === menuType)) {
                    item.style.display = 'block';
                    hasVisibleItems = true;
                } else {
                    item.style.display = 'none';
                }
            });

            // Show categories with visible items
            document.querySelectorAll('.category').forEach(category => {
                const items = category.querySelectorAll('.item');
                const hasVisibleItems = Array.from(items).some(item => item.style.display === 'block');
                const categoryDisplayName = category.querySelector('h3').textContent.toLowerCase();
                const categoryValue = categoryMap[categoryDisplayName] || categoryDisplayName;
                const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
                if (hasVisibleItems || selectedCategory === 'all' || selectedCategory === categoryValue) {
                    category.style.display = 'block';
                } else {
                    category.style.display = 'none';
                }
            });

            // If no items match, show all categories if category filter is 'all'
            if (!hasVisibleItems && categoryFilter && categoryFilter.value === 'all') {
                document.querySelectorAll('.category').forEach(category => {
                    category.style.display = 'block';
                    category.querySelectorAll('.item').forEach(item => {
                        const itemType = item.dataset.type;
                        if (menuType === 'all' || itemType === menuType) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('username');
            window.location.href = 'login.html';
        });
    }

    // Toggle Dark Mode
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            toggleBtn.textContent = document.body.classList.contains('dark-mode') ? 'Toggle Light Mode' : 'Toggle Dark Mode';
        });
    }
});

// Login Handling
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.querySelector('.login-form');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        loginForm.appendChild(errorDiv);

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (username && password) {
                localStorage.setItem('username', username);
                window.location.href = 'menu-selection.html';
            } else {
                errorDiv.textContent = 'Please enter both username and password.';
            }
        });
    });
}