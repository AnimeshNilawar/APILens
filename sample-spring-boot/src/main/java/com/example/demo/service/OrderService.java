package com.example.demo.service;

import com.example.demo.dto.request.CreateOrderRequest;
import com.example.demo.dto.response.OrderResponse;
import com.example.demo.entity.Order;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public List<OrderResponse> findAll() {
        return orderRepository.findAll().stream().map(OrderResponse::fromEntity).toList();
    }

    public OrderResponse findById(Long id) {
        Order order = orderRepository.findById(id);
        if (order == null) throw new ResourceNotFoundException("Order not found with id: " + id);
        return OrderResponse.fromEntity(order);
    }

    public OrderResponse create(CreateOrderRequest request) {
        if (!userRepository.existsById(request.getUserId())) {
            throw new ResourceNotFoundException("User not found with id: " + request.getUserId());
        }
        for (Long pid : request.getProductIds()) {
            if (!productRepository.existsById(pid)) {
                throw new ResourceNotFoundException("Product not found with id: " + pid);
            }
        }
        double total = request.getProductIds().stream()
                .mapToDouble(pid -> productRepository.findById(pid).getPrice())
                .sum();
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setProductIds(request.getProductIds());
        order.setTotalAmount(total);
        order.setStatus("CREATED");
        order.setCreatedAt(LocalDateTime.now());
        return OrderResponse.fromEntity(orderRepository.save(order));
    }
}
