package com.example.demo.service;

import com.example.demo.dto.request.CreateUserRequest;
import com.example.demo.dto.request.UpdateUserRequest;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(UserResponse::fromEntity).toList();
    }

    public UserResponse findById(Long id) {
        User user = userRepository.findById(id);
        if (user == null) throw new ResourceNotFoundException("User not found with id: " + id);
        return UserResponse.fromEntity(user);
    }

    public UserResponse create(CreateUserRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        return UserResponse.fromEntity(userRepository.save(user));
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id);
        if (user == null) throw new ResourceNotFoundException("User not found with id: " + id);
        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPassword() != null) user.setPassword(request.getPassword());
        return UserResponse.fromEntity(userRepository.update(user));
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) throw new ResourceNotFoundException("User not found with id: " + id);
        userRepository.deleteById(id);
    }
}
