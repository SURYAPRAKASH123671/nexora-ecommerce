package com.example.demo.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository
        extends JpaRepository<Product, Long> {

    // SEARCH BY NAME
    List<Product> findByName(String name);

    // FILTER BY CATEGORY
    List<Product> findByCategory(String category);
}