package com.example.demo.service;

import com.example.demo.entity.User;

import com.example.demo.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // REGISTER

    public String registerUser(
            User user
    ) {

        User existingUser =
                userRepository.findByEmail(
                        user.getEmail()
                );

        if (existingUser != null) {

            return "Email already exists";

        }

        user.setPassword(

                passwordEncoder.encode(
                        user.getPassword()
                )

        );

        userRepository.save(user);

        return "User registered successfully";

    }

    // LOGIN

    public String loginUser(

            String email,

            String password

    ) {

        User user =
                userRepository.findByEmail(
                        email
                );

        if (user == null) {

            return "User not found";

        }

        boolean passwordMatches =

                passwordEncoder.matches(

                        password,

                        user.getPassword()

                );

        if (!passwordMatches) {

            return "Invalid password";

        }

        return "Login successful";

    }

}