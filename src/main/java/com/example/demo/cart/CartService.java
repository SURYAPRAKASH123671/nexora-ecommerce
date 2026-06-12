package com.example.demo.cart;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    // ADD ITEM TO CART
    public Cart addToCart(Cart cart) {

        return cartRepository.save(cart);
    }

    // GET ALL CART ITEMS
    public List<Cart> getCartItems() {

        return cartRepository.findAll();
    }

    // REMOVE CART ITEM
    public String removeCartItem(Long id) {

        cartRepository.deleteById(id);

        return "Item removed from cart";
    }
}