package ecommerce_backend.service;

import ecommerce_backend.dto.LoginRequest;
import ecommerce_backend.dto.RegisterRequest;

import ecommerce_backend.entity.User;

import ecommerce_backend.repository.UserRepository;

import ecommerce_backend.security.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtUtil jwtUtil;

    public String register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {

            throw new RuntimeException(
                    "EMAIL_ALREADY_EXISTS"
            );
        }

        User user = new User();

        user.setName(request.getName());

        user.setEmail(request.getEmail());

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        userRepository.save(user);

        return "USER_REGISTERED_SUCCESSFULLY";
    }

    public String login(LoginRequest request) {

        User user = userRepository

                .findByEmail(request.getEmail())

                .orElseThrow(
                        () -> new RuntimeException(
                                "USER_NOT_FOUND"
                        )
                );

        boolean isPasswordCorrect =

                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!isPasswordCorrect) {

            throw new RuntimeException(
                    "INVALID_PASSWORD"
            );
        }

        return jwtUtil.generateToken(
                user.getEmail()
        );
    }
}

