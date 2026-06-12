package com.example.demo.product;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")

public class ProductController {

    @Autowired
    private ProductService productService;

    // CREATE PRODUCT
    @PostMapping
    public Product createProduct(
            @RequestBody Product product
    ) {

        return productService.saveProduct(product);
    }

    // GET ALL PRODUCTS
    @GetMapping
    public List<Product> getAllProducts() {

        return productService.getAllProducts();
    }

    // GET PRODUCT BY ID
    @GetMapping("/{id}")
    public Product getProductById(
            @PathVariable Long id
    ) {

        return productService.getProductById(id);
    }

    // UPDATE PRODUCT
    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable Long id,
            @RequestBody Product product
    ) {

        return productService.updateProduct(id, product);
    }

    // DELETE PRODUCT
    @DeleteMapping("/{id}")
    public String deleteProduct(
            @PathVariable Long id
    ) {

        return productService.deleteProduct(id);
    }

    // SEARCH PRODUCT BY NAME
    @GetMapping("/search/{name}")
    public List<Product> searchByName(
            @PathVariable String name
    ) {

        return productService.searchByName(name);
    }

    // FILTER PRODUCT BY CATEGORY
    @GetMapping("/category/{category}")
    public List<Product> filterByCategory(
            @PathVariable String category
    ) {

        return productService.filterByCategory(category);
    }
}