package ecommerce_backend.auth;

import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping({ "/signup", "/register" })
	public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
		AuthResponse response = authService.signup(request);
		return ResponseEntity.created(URI.create("/api/auth/me")).body(response);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/verify-email")
	public RedirectView verifyEmail(@RequestParam String token) {
		authService.verifyEmail(token);
		RedirectView redirectView = new RedirectView(authService.verifiedRedirectUrl());
		redirectView.setStatusCode(HttpStatus.FOUND);
		return redirectView;
	}

	@PostMapping("/resend-verification")
	public VerificationResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
		return authService.resendVerification(request);
	}

	@PostMapping("/forgot-password")
	public VerificationResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		return authService.forgotPassword(request);
	}

	@PostMapping("/reset-password")
	public VerificationResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		return authService.resetPassword(request);
	}

	@GetMapping("/me")
	public AuthUserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
		return authService.currentUser(principal);
	}
}
