package com.example.demo.service;

import com.example.demo.dto.request.CreateProductRequest;
import com.example.demo.dto.response.ProductResponse;
import com.example.demo.entity.Product;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream().map(ProductResponse::fromEntity).toList();
    }

    public ProductResponse findById(Long id) {
        Product product = productRepository.findById(id);
        if (product == null) throw new ResourceNotFoundException("Product not found with id: " + id);
        return ProductResponse.fromEntity(product);
    }

    public ProductResponse create(CreateProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        return ProductResponse.fromEntity(productRepository.save(product));
    }

    public void delete(Long id) {
        if (!productRepository.existsById(id)) throw new ResourceNotFoundException("Product not found with id: " + id);
        productRepository.deleteById(id);
    }

    public ProductResponse update(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id);
        if (product == null) throw new ResourceNotFoundException("Product not found with id: " + id);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        return ProductResponse.fromEntity(productRepository.save(product));
    }
}
