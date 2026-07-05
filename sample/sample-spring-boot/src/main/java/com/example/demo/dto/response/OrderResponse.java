package com.example.demo.dto.response;

import com.example.demo.entity.Order;
import java.time.LocalDateTime;

public class OrderResponse {
    private Long id;
    private Long userId;
    private double totalAmount;
    private String status;
    private String shippingAddress;
    private LocalDateTime createdAt;

    public OrderResponse() {}

    public OrderResponse(Long id, Long userId, double totalAmount, String status, String shippingAddress, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.totalAmount = totalAmount;
        this.status = status;
        this.shippingAddress = shippingAddress;
        this.createdAt = createdAt;
    }

    public static OrderResponse fromEntity(Order order) {
        return new OrderResponse(order.getId(), order.getUserId(), order.getTotalAmount(), order.getStatus(), order.getShippingAddress(), order.getCreatedAt());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
