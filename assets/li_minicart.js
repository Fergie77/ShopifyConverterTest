document.addEventListener('alpine:init', () => {

    Alpine.data('handleMinicart', () => ({
        init() {
            console.log('handleMinicart init')
            console.log('Initial cart state:', this.cart)
            // Load cart on init
            this.getCart()
        },
        cart: {
            note: null,
            attributes: {},
            items: [],
            currency: window.Shopify.currency.active,
            cart_level_discount_applications: [],
            response: {
                result : {},
                show : false,
                timeout : 5000,
            },
            item_count: 0,
            total_price:0,
            total_weight: 0,
            total_discount: 0,
            original_total_price: 0,
            items_subtotal_price: 0
        },
        _abortController : null,
        initAbortController() {
            if(this._abortController) {
                this._abortController.abort('abort previous request');
            }
            this._abortController = new AbortController()
        },
        getAbortControllerSignal() {
            return this._abortController.signal
        },
        resetAbortController() {
            this._abortController = null;
        },
        toggleMiniCart() {
            console.log('(minicart.js) toggleMiniCart called');

            LiquifyHelper.handleTriggerClick();

            this.getCart();
        },

        /**
         * Get the cart data.
         */
        async getCart() {
            console.log('🛒 getCart() called')
            this.initAbortController()
            await fetch(window.Shopify.routes.root + 'cart.js', {
                method: 'GET',
                signal: this.getAbortControllerSignal(),
                headers: {'Content-Type': 'application/json'},
            })
                .then(response => {
                    console.log('📦 Cart response status:', response.status)
                    return response.json()
                })
                .then(data => {
                    console.log('📦 Cart data received:', data)
                    this.resetAbortController();

                    this.cart.item_count = data.item_count;

                    this.cart.items = data.items.map((item) => {
                        item.title = this.htmlspecialchars_decode(item.title)
                        return item
                    })

                    console.log('📦 Cart items processed:', this.cart.items)
                    console.log('📦 Cart item count:', this.cart.item_count)

                    this.cart.total_price = data.total_price;
                    this.cart.total_weight = data.total_weight;
                    this.cart.total_discount = data.total_discount;
                    this.cart.original_total_price = data.original_total_price || data.total_price;

                    console.log('📦 Cart totals - price:', this.cart.total_price, 'original:', this.cart.original_total_price)

                    this.$dispatch('carttotalitems', data.item_count);
                })
                .catch((error) => {
                    console.error('❌ Error fetching cart:', error);
                    console.error('❌ Error details:', error.message, error.stack);
                });
        },

        /**
         * @param key
         * @param quantity
         */
        increaseCartItemQuantity(key, quantity) {
            this.updateCartItemQuantity(key, parseInt(quantity) + 1);
        },

        /**
         * @param key
         * @param quantity
         */
        decreaseCartItemQuantity(key, quantity) {
            this.updateCartItemQuantity(key, parseInt(quantity) - 1);
        },

        /**
         * Update the cart item.
         *
         * @param key
         * @param quantity
         */
        updateCartItemQuantity(key, quantity) {
            this.initAbortController();
            console.log('🔄 updateCartItemQuantity(): key:', key, 'quantity:', quantity);
            this.cart.items.filter((product)  => {
                if(product.key === key) {
                    product.quantity = quantity
                }
            })
            let updates = {};
            updates[key] = quantity;
            console.log('🔄 Sending update request:', updates);
            fetch(window.Shopify.routes.root + 'cart/update.js', {
                method: 'POST',
                signal: this.getAbortControllerSignal(),
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ updates }),
            })
                .then(response => {
                    console.log('✅ Update response status:', response.status);
                    return response.json();
                })
                .then(data => {
                    this.resetAbortController();
                    console.log('✅ updateCartItemQuantity() response:', data);

                    this.$dispatch('cartupdated');
                    this.$dispatch('showcartmessage', { status: data.status, message: data.message, description: data.description });
                })
                .catch((error) => {
                    console.error('❌ Error updating cart:', error);
                    console.error('❌ Error details:', error.message, error.stack);
                    this.$dispatch('showcartmessage', { status: error?.status, message: error, description: error });
                });
        },

        /**
         * Format monetary values.
         */
        moneyFormat(value, minor = true) {
            return LiquifyHelper.moneyFormat(value, minor)
        },

        htmlspecialchars_decode(string) {
            return LiquifyHelper.htmlspecialchars_decode(string)
        },

        /**
         * Shows the minicart api message
         * @param event
         */
        showCartMessage(event) {
            //console.log("dispatched showCartMessage", event)
            if(event?.detail?.status) {
                this.cart.response.result = event.detail ?? {}
                this.cart.response.show = true
                setTimeout(() => {
                    this.cart.response.result = {};
                    this.cart.response.show = false
                }, this.cart.response.timeout ?? 5000)
            }
        },

        async returnCartItems() {
            await this.getCart();

            this.$dispatch('currentcartitems', this.cart.items);
        },

        /**
         * @deprecated
         */
        set open(open) { // deprecated use  LiquifyHelper instead
            //console.warn('Deprecated "set open" in mini_cart')
        },
        /**
         * @deprecated
         */
        get open() { // deprecated use  LiquifyHelper instead
            //console.warn('Deprecated "get open" in mini_cart')
            return false;
        },
        /**
         * @deprecated
         */
        set note(note) { // deprecated
            //console.warn('Deprecated "set note" in mini_cart')
            this.cart.note = note;
        },
        /**
         * @deprecated
         */
        get note() { // deprecated
            //console.warn('Deprecated "get note" in mini_cart')
            return this.cart.note;
        },
        /**
         * @deprecated
         */
        set attributes(attributes) { // deprecated
            //console.warn('Deprecated "set attributes" in mini_cart')
            this.cart.attributes = attributes;
        },
        /**
         * @deprecated
         */
        get attributes() { // deprecated
            //console.warn('Deprecated "get attributes" in mini_cart')
            return this.cart.attributes;
        },
        /**
         * @deprecated
         */
        set original_total_price(original_total_price) { //deprecated
            //console.warn('Deprecated "set original_total_price" in mini_cart')
            this.cart.original_total_price = original_total_price;
        },
        /**
         * @deprecated
         */
        get original_total_price() { //deprecated
            //console.warn('Deprecated "get original_total_price" in mini_cart')
            return this.cart.original_total_price;
        },
        /**
         * @deprecated
         */
        set total_price(total_price) { //deprecated
            //console.warn('Deprecated "set total_price" in mini_cart')
            this.cart.total_price = total_price;
        },
        /**
         * @deprecated
         */
        get total_price() { //deprecated
            //console.warn('Deprecated "get total_price" in mini_cart')
            return this.cart.total_price;
        },
        /**
         * @deprecated
         */
        set total_discount(total_discount) { //deprecated
            //console.warn('Deprecated "set total_discount" in mini_cart')
            this.cart.total_discount = total_discount;
        },
        /**
         * @deprecated
         */
        get total_discount() { //deprecated
            //console.warn('Deprecated "get total_discount" in mini_cart')
            return this.cart.total_discount;
        },
        /**
         * @deprecated
         */
        set total_weight(total_weight) { //deprecated
            //console.warn('Deprecated "set total_weight" in mini_cart')
            this.cart.total_discount = total_weight;
        },
        /**
         * @deprecated
         */
        get total_weight() { //deprecated
            //console.warn('Deprecated "get total_weight" in mini_cart')
            return this.cart.total_weight;
        },
        /**
         * @deprecated
         */
        set item_count(item_count) { //deprecated
            //console.warn('Deprecated "set item_count" in mini_cart')
            this.cart.total_discount = item_count;
        },
        /**
         * @deprecated
         */
        get item_count() { //deprecated
            //console.warn('Deprecated "get item_count" in mini_cart')
            return this.cart.item_count;
        },
        /**
         * @deprecated
         */
        set items_subtotal_price(items_subtotal_price) { //deprecated
            //console.warn('Deprecated "set items_subtotal_price" in mini_cart')
            this.cart.items_subtotal_price = items_subtotal_price;
        },
        /**
         * @deprecated
         */
        get items_subtotal_price() { //deprecated
            //console.warn('Deprecated "get items_subtotal_price" in mini_cart')
            return this.cart.items_subtotal_price;
        },
        /**
         * @deprecated
         */
        set products(products) {
            //console.warn('Deprecated "set products" in mini_cart')
            this.cart.items = products;
        },
        /**
         * @deprecated
         */
        get products() {
            //console.warn('Deprecated "get products" in mini_cart')
            return this.cart.items;
        },
        /**
         * @deprecated
         */
        set requires_shipping(requires_shipping) {
            //console.warn('Deprecated "set requires_shipping" in mini_cart')
        },
        /**
         * @deprecated
         */
        get requires_shipping() {
            //console.warn('Deprecated "get requires_shipping" in mini_cart')
            return false;
        },
        /**
         * @deprecated
         */
        set currency(currency) { //deprecated
            //console.warn('Deprecated "set currency" in mini_cart')
            this.cart.currency = currency;
        },
        /**
         * @deprecated
         */
        get currency() { //deprecated
            //console.warn('Deprecated "get currency" in mini_cart')
            return this.cart.currency;
        },
        /**
         * @deprecated
         */
        set cart_level_discount_applications(cart_level_discount_applications) { //deprecated
            //console.warn('Deprecated "set cart_level_discount_applications" in mini_cart')
            this.cart.cart_level_discount_applications = cart_level_discount_applications;
        },
        /**
         * @deprecated
         */
        get cart_level_discount_applications() { //deprecated
            //console.warn('Deprecated "get cart_level_discount_applications" in mini_cart')
            return this.cart.cart_level_discount_applications;
        },
        /**
         * @deprecated
         */
        set cartApiResponse(cartApiResponse) { //deprecated
            //console.warn('Deprecated "set cartApiResponse" in mini_cart')
            this.cart.cartApiResponse = cartApiResponse;
        },
        /**
         * @deprecated
         */
        get cartApiResponse() { //deprecated
            //console.warn('Deprecated "get cartApiResponse" in mini_cart')
            return this.cart.response;
        },
        /**
         * @deprecated
         */
        set total(total) { //deprecated
            //console.warn('Deprecated "set total" in mini_cart')
            this.cart.item_count = total.items;
            this.cart.total_price = total.price;
            this.cart.total_weight = total.weight;
            this.cart.total_discount = total.discount;
        },
        /**
         * @deprecated
         */
        get total() { //deprecated
            //console.warn('Deprecated "get total" in mini_cart')
            return {
                items: this.cart.item_count,
                price: this.cart.total_price,
                weight: this.cart.total_weight,
                discount: this.cart.total_discount,
            };
        }
    }))


});
