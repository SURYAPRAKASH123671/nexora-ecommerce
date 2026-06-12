package com.example.demo.order;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")

public class OrderController {

    @Autowired
    private OrderService orderService;

    // PLACE ORDER
    @PostMapping
    public OrderEntity placeOrder(
            @RequestBody OrderEntity order
    ) {

        return orderService.placeOrder(order);
    }

    // GET ALL ORDERS
    @GetMapping
    public List<OrderEntity> getAllOrders() {

        return orderService.getAllOrders();
    }
}