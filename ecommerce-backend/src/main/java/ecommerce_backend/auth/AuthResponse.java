package ecommerce_backend.auth;

public record AuthResponse(
		String token,
		String tokenType,
		long expiresInSeconds,
		AuthUserResponse user,
		String message
) {
	public static AuthResponse authenticated(String token, long expiresInSeconds, AppUser user) {
		return new AuthResponse(token, "Bearer", expiresInSeconds, AuthUserResponse.from(user), "Authenticated");
	}

	public static AuthResponse verificationRequired(AppUser user) {
		return new AuthResponse(null, "Bearer", 0, AuthUserResponse.from(user),
				"Account created. Please verify your email before logging in.");
	}
}
