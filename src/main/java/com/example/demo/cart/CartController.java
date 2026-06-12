package com.example.demo.cart;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
@CrossOrigin(origins = "*")

public class CartController {

    @Autowired
    private CartService cartService;

    // ADD ITEM TO CART
    @PostMapping
    public Cart addToCart(
            @RequestBody Cart cart
    ) {

        return cartService.addToCart(cart);
    }

    // GET ALL CART ITEMS
    @GetMapping
    public List<Cart> getCartItems() {

        return cartService.getCartItems();
    }

    // REMOVE ITEM FROM CART
    @DeleteMapping("/{id}")
    public String removeCartItem(
            @PathVariable Long id
    ) {

        return cartService.removeCartItem(id);
    }
}