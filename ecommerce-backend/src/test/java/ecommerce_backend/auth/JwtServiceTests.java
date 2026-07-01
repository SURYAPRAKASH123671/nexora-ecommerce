package ecommerce_backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTests {

	@Test
	void issuesAndValidatesAccessTokenSubject() {
		JwtService jwtService = new JwtService("test-secret-with-enough-length-for-hmac", 3600, 7200);
		AppUser user = new AppUser("Surya Kannan", "surya@example.com", "hash");
		ReflectionTestUtils.setField(user, "id", 42L);
		user.markEmailVerified();

		JwtService.TokenIssue token = jwtService.issue(user, false);

		assertEquals(3600, token.expiresInSeconds());
		assertEquals("surya@example.com", jwtService.subject(token.token()).orElseThrow());
	}

	@Test
	void rejectsTamperedToken() {
		JwtService jwtService = new JwtService("test-secret-with-enough-length-for-hmac", 3600, 7200);
		AppUser user = new AppUser("Surya Kannan", "surya@example.com", "hash");
		ReflectionTestUtils.setField(user, "id", 42L);
		user.markEmailVerified();
		String token = jwtService.issue(user, false).token();

		String tampered = token.substring(0, token.length() - 2) + "xx";

		assertTrue(jwtService.subject(tampered).isEmpty());
	}
}
