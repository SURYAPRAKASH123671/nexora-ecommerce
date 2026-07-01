package ecommerce_backend.profile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ecommerce_backend.auth.AppUser;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ProfileResponseTests {

	@Test
	void mapsUserAndSavedAddresses() {
		AppUser user = new AppUser("Surya Kannan", "surya@example.com", "hash");
		ReflectionTestUtils.setField(user, "id", 10L);
		user.markEmailVerified();
		user.updateProfile("Surya Kannan", "9876543210", "https://example.com/profile.jpg");

		SavedAddress address = new SavedAddress(user, "Home", "Surya Kannan", "9876543210",
				"Line 1", "Line 2", "Chennai", "Tamil Nadu", "600001", true);
		ReflectionTestUtils.setField(address, "id", 99L);

		ProfileResponse response = ProfileResponse.from(user, List.of(address));

		assertEquals("Surya Kannan", response.name());
		assertEquals("9876543210", response.phone());
		assertTrue(response.emailVerified());
		assertEquals(1, response.addresses().size());
		assertEquals("Home", response.addresses().get(0).label());
	}
}
