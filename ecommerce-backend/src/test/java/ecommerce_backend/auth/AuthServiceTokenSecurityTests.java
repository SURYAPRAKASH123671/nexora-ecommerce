package ecommerce_backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ecommerce_backend.email.EmailRequest;
import ecommerce_backend.email.EmailResponse;
import ecommerce_backend.email.EmailService;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTokenSecurityTests {

	private AppUserRepository userRepository;
	private EmailService emailService;
	private EmailVerificationEmailBuilder verificationBuilder;
	private AuthService authService;

	@BeforeEach
	void setUp() {
		userRepository = mock(AppUserRepository.class);
		PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
		JwtService jwtService = mock(JwtService.class);
		emailService = mock(EmailService.class);
		verificationBuilder = mock(EmailVerificationEmailBuilder.class);
		PasswordResetEmailBuilder resetBuilder = mock(PasswordResetEmailBuilder.class);
		when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
		when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
		when(verificationBuilder.build(anyString(), anyString())).thenReturn("verification-html");
		when(emailService.send(any())).thenAnswer(invocation -> EmailResponse.skipped(invocation.getArgument(0)));
		authService = new AuthService(userRepository, passwordEncoder, jwtService, emailService,
				verificationBuilder, resetBuilder, "http://frontend", "http://backend", false);
	}

	@Test
	void storesOnlyHashedVerificationToken() {
		when(userRepository.existsByEmailIgnoreCase("surya@example.com")).thenReturn(false);

		AuthResponse response = authService.signup(new SignupRequest("Surya", "surya@example.com", "Password1"));

		ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
		verify(userRepository).save(userCaptor.capture());
		AppUser saved = userCaptor.getValue();
		assertEquals(64, saved.getEmailVerificationToken().length());
		assertFalse(saved.isEmailVerified());
		assertEquals(null, response.token());
		assertTrue(response.message().contains("verify your email"));

		ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
		verify(verificationBuilder).build(anyString(), urlCaptor.capture());
		String rawToken = urlCaptor.getValue().substring(urlCaptor.getValue().indexOf("token=") + 6);
		assertNotEquals(rawToken, saved.getEmailVerificationToken());
		assertTrue(rawToken.length() >= 64);
	}

	@Test
	void hashesIncomingVerificationTokenBeforeLookup() {
		AppUser user = new AppUser("Surya", "surya@example.com", "hash");
		user.markEmailVerificationRequested("stored-hash", Instant.now().plusSeconds(300));
		when(userRepository.findByEmailVerificationToken(anyString())).thenReturn(Optional.of(user));

		authService.verifyEmail("raw-token-from-link");

		ArgumentCaptor<String> hashCaptor = ArgumentCaptor.forClass(String.class);
		verify(userRepository).findByEmailVerificationToken(hashCaptor.capture());
		assertEquals(64, hashCaptor.getValue().length());
		assertNotEquals("raw-token-from-link", hashCaptor.getValue());
		assertTrue(user.isEmailVerified());
	}
}
