package com.example.demo.product;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // CREATE PRODUCT
    public Product saveProduct(Product product) {

        return productRepository.save(product);
    }

    // GET ALL PRODUCTS
    public List<Product> getAllProducts() {

        return productRepository.findAll();
    }

    // GET PRODUCT BY ID
    public Product getProductById(Long id) {

        return productRepository.findById(id)
                .orElse(null);
    }

    // UPDATE PRODUCT
    public Product updateProduct(
            Long id,
            Product updatedProduct
    ) {

        Product existingProduct =
                productRepository.findById(id)
                        .orElse(null);

        if (existingProduct != null) {

            existingProduct.setName(
                    updatedProduct.getName()
            );

            existingProduct.setPrice(
                    updatedProduct.getPrice()
            );

            existingProduct.setStock(
                    updatedProduct.getStock()
            );

            existingProduct.setCategory(
                    updatedProduct.getCategory()
            );

            return productRepository.save(existingProduct);
        }

        return null;
    }

    // DELETE PRODUCT
    public String deleteProduct(Long id) {

        productRepository.deleteById(id);

        return "Product deleted successfully";
    }

    // SEARCH PRODUCT BY NAME
    public List<Product> searchByName(
            String name
    ) {

        return productRepository.findByName(name);
    }

    // FILTER PRODUCT BY CATEGORY
    public List<Product> filterByCategory(
            String category
    ) {

        return productRepository.findByCategory(category);
    }
}