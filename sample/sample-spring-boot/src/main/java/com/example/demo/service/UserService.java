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
        user.setPhone(request.getPhone());
        return UserResponse.fromEntity(userRepository.save(user));
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id);
        if (user == null) throw new ResourceNotFoundException("User not found with id: " + id);
        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPassword() != null) user.setPassword(request.getPassword());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        return UserResponse.fromEntity(userRepository.update(user));
    }

    public UserResponse updateRole(Long id, CreateUserRequest request) {
        User user = userRepository.findById(id);
        if (user == null) throw new ResourceNotFoundException("User not found with id: " + id);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) throw new ResourceNotFoundException("User not found with id: " + id);
        userRepository.deleteById(id);
    }

    public List<UserResponse> search(String q, int page, int size) {
        return userRepository.findAll().stream()
                .filter(u -> q.isEmpty() || u.getName().toLowerCase().contains(q.toLowerCase()) || u.getEmail().toLowerCase().contains(q.toLowerCase()))
                .skip((long) page * size)
                .limit(size)
                .map(UserResponse::fromEntity)
                .toList();
    }
}
