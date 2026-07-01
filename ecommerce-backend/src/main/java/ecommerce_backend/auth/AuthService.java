package ecommerce_backend.auth;

import ecommerce_backend.common.ConflictException;
import ecommerce_backend.email.EmailRequest;
import ecommerce_backend.email.EmailResponse;
import ecommerce_backend.email.EmailService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private final AppUserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final EmailService emailService;
	private final EmailVerificationEmailBuilder verificationEmailBuilder;
	private final PasswordResetEmailBuilder passwordResetEmailBuilder;
	private final String frontendBaseUrl;
	private final String backendBaseUrl;

	public AuthService(AppUserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			EmailService emailService,
			EmailVerificationEmailBuilder verificationEmailBuilder,
			PasswordResetEmailBuilder passwordResetEmailBuilder,
			@Value("${app.frontend.base-url:${FRONTEND_BASE_URL:http://localhost:3000}}") String frontendBaseUrl,
			@Value("${app.backend.base-url:${BACKEND_BASE_URL:http://localhost:8080}}") String backendBaseUrl) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.emailService = emailService;
		this.verificationEmailBuilder = verificationEmailBuilder;
		this.passwordResetEmailBuilder = passwordResetEmailBuilder;
		this.frontendBaseUrl = frontendBaseUrl;
		this.backendBaseUrl = backendBaseUrl;
	}

	@Transactional
	public AuthResponse signup(SignupRequest request) {
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ConflictException("An account already exists with this email.");
		}

		AppUser user = new AppUser(request.name().trim(), email, passwordEncoder.encode(request.password()));
		issueVerificationToken(user);
		AppUser savedUser = userRepository.save(user);
		EmailResponse emailResponse = sendVerificationEmail(savedUser);
		if ("SKIPPED".equals(emailResponse.status())) {
			savedUser.markEmailVerified();
			JwtService.TokenIssue token = jwtService.issue(savedUser, false);
			return AuthResponse.authenticated(token.token(), token.expiresInSeconds(), savedUser);
		}
		return AuthResponse.verificationRequired(savedUser);
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
				.orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new BadCredentialsException("Invalid email or password.");
		}

		if (!user.isEmailVerified()) {
			throw new EmailNotVerifiedException("Please verify your email before logging in.");
		}

		user.markLogin();
		JwtService.TokenIssue token = jwtService.issue(user, request.rememberMe());
		return AuthResponse.authenticated(token.token(), token.expiresInSeconds(), user);
	}

	@Transactional
	public VerificationResponse verifyEmail(String token) {
		AppUser user = userRepository.findByEmailVerificationToken(token)
				.orElseThrow(() -> new AuthException("Verification link is invalid."));
		if (user.getEmailVerificationExpiresAt() == null
				|| user.getEmailVerificationExpiresAt().isBefore(Instant.now())) {
			throw new AuthException("Verification link has expired. Please request a new link.");
		}
		user.markEmailVerified();
		return new VerificationResponse("VERIFIED", "Email verified successfully. You can now login.");
	}

	@Transactional
	public VerificationResponse resendVerification(ResendVerificationRequest request) {
		AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
				.orElseThrow(() -> new AuthException("No account found for this email."));
		if (user.isEmailVerified()) {
			return new VerificationResponse("ALREADY_VERIFIED", "This email is already verified.");
		}
		issueVerificationToken(user);
		EmailResponse emailResponse = sendVerificationEmail(user);
		if ("SKIPPED".equals(emailResponse.status())) {
			user.markEmailVerified();
			return new VerificationResponse("VERIFIED", "Email verified for local development.");
		}
		return new VerificationResponse("SENT", "Verification email sent.");
	}

	@Transactional
	public VerificationResponse forgotPassword(ForgotPasswordRequest request) {
		userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
				.ifPresent(user -> {
					user.markPasswordResetRequested(UUID.randomUUID().toString().replace("-", ""),
							Instant.now().plus(30, ChronoUnit.MINUTES));
					sendPasswordResetEmail(user);
				});
		return new VerificationResponse("SENT",
				"If an account exists for this email, a password reset link has been sent.");
	}

	@Transactional
	public VerificationResponse resetPassword(ResetPasswordRequest request) {
		AppUser user = userRepository.findByPasswordResetToken(request.token())
				.orElseThrow(() -> new AuthException("Password reset link is invalid."));
		if (user.getPasswordResetExpiresAt() == null || user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
			throw new AuthException("Password reset link has expired. Please request a new link.");
		}
		user.resetPassword(passwordEncoder.encode(request.password()));
		return new VerificationResponse("RESET", "Password reset successfully. You can now login.");
	}

	public AuthUserResponse currentUser(UserPrincipal principal) {
		return AuthUserResponse.from(principal.getUser());
	}

	private void issueVerificationToken(AppUser user) {
		user.markEmailVerificationRequested(UUID.randomUUID().toString().replace("-", ""),
				Instant.now().plus(24, ChronoUnit.HOURS));
	}

	private EmailResponse sendVerificationEmail(AppUser user) {
		String verifyUrl = backendBaseUrl + "/api/auth/verify-email?token=" + user.getEmailVerificationToken();
		String html = verificationEmailBuilder.build(user.getName(), verifyUrl);
		return emailService.send(new EmailRequest(user.getEmail(), "Verify your Nexora account", html, true));
	}

	private void sendPasswordResetEmail(AppUser user) {
		String resetUrl = frontendBaseUrl + "/reset-password?token=" + user.getPasswordResetToken();
		String html = passwordResetEmailBuilder.build(user.getName(), resetUrl);
		emailService.send(new EmailRequest(user.getEmail(), "Reset your Nexora password", html, true));
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	public String verifiedRedirectUrl() {
		return frontendBaseUrl + "/login?verified=true";
	}
}
