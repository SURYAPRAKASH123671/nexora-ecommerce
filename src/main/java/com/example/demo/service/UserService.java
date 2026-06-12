package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.jwt.JwtUtil;
import com.example.demo.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // CREATE USER
    public User saveUser(User user) {

        String encryptedPassword =
                passwordEncoder.encode(user.getPassword());

        user.setPassword(encryptedPassword);

        return userRepository.save(user);
    }

    // GET ALL USERS
    public List<User> getAllUsers() {

        return userRepository.findAll();
    }

    // GET USER BY ID
    public User getUserById(Long id) {

        return userRepository.findById(id).orElse(null);
    }

    // UPDATE USER
    public User updateUser(Long id, User updatedUser) {

        User existingUser =
                userRepository.findById(id).orElse(null);

        if (existingUser != null) {

            existingUser.setName(updatedUser.getName());
            existingUser.setEmail(updatedUser.getEmail());

            String encryptedPassword =
                    passwordEncoder.encode(updatedUser.getPassword());

            existingUser.setPassword(encryptedPassword);

            return userRepository.save(existingUser);
        }

        return null;
    }

    // DELETE USER
    public String deleteUser(Long id, String role) {

        if (!role.equals("ADMIN")) {

            return "Access Denied! Only ADMIN can delete users";
        }

        userRepository.deleteById(id);

        return "User deleted successfully";
    }

    // LOGIN USER + GENERATE JWT TOKEN
    public String loginUser(String email, String password) {

        User user = userRepository.findByEmail(email);

        if (user == null) {
            return "User not found";
        }

        boolean passwordMatched =
                passwordEncoder.matches(password, user.getPassword());

        if (passwordMatched) {

            return jwtUtil.generateToken(email);
        }

        return "Invalid password";
    }
}