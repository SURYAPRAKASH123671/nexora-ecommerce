package com.example.demo.order;

import com.example.demo.product.Product;
import com.example.demo.product.ProductRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    // PLACE ORDER
    public OrderEntity placeOrder(
            OrderEntity order
    ) {

        // FIND PRODUCT
        Product product =
                productRepository
                        .findAll()
                        .stream()
                        .filter(p ->
                                p.getName().equals(
                                        order.getProductName()
                                )
                        )
                        .findFirst()
                        .orElse(null);

        // CHECK PRODUCT EXISTS
        if (product == null) {

            return null;
        }

        // CHECK STOCK
        if (product.getStock()
                < order.getQuantity()) {

            return null;
        }

        // REDUCE STOCK
        product.setStock(
                product.getStock()
                        - order.getQuantity()
        );

        // SAVE UPDATED PRODUCT
        productRepository.save(product);

        // SAVE ORDER
        return orderRepository.save(order);
    }

    // GET ALL ORDERS
    public List<OrderEntity> getAllOrders() {

        return orderRepository.findAll();
    }
}