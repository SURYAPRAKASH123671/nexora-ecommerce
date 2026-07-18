package ecommerce_backend.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ecommerce_backend.auth.AppUser;
import ecommerce_backend.auth.AppUserRepository;
import ecommerce_backend.auth.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAuthorizationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AppUserRepository userRepository;

	@Autowired
	private JwtService jwtService;

	@Test
	void catalogReadsArePublicButWritesRequireAdmin() throws Exception {
		mockMvc.perform(get("/api/products")).andExpect(status().isOk());
		mockMvc.perform(post("/api/products")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void emailRelayIsNotPublic() throws Exception {
		mockMvc.perform(post("/api/email/send")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"to\":\"test@example.com\",\"subject\":\"x\",\"message\":\"x\",\"html\":false}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void paymentProofAndReviewQueuesAreNeverPublic() throws Exception {
		mockMvc.perform(get("/api/admin/payments/upi"))
				.andExpect(status().isForbidden());
		mockMvc.perform(post("/api/orders/NX-PRIVATE/payments/upi/proof")
					.contentType(MediaType.MULTIPART_FORM_DATA))
				.andExpect(status().isForbidden());
	}

	@Test
	void razorpayWebhookIsPublicButCheckoutEndpointsRequireAuthentication() throws Exception {
		mockMvc.perform(post("/api/payments/razorpay/webhook")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(post("/api/orders/NX-PRIVATE/payments/razorpay/order"))
				.andExpect(status().isForbidden());
	}

	@Test
	void adminCanCreateCategory() throws Exception {
		AppUser admin = new AppUser("Admin", "admin-security-test@example.com", "hash");
		admin.markEmailVerified();
		admin.promoteToAdmin();
		admin = userRepository.save(admin);
		String token = jwtService.issue(admin, false).token();

		mockMvc.perform(post("/api/categories")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Security Test Category\",\"description\":\"Created by admin\"}"))
				.andExpect(status().isCreated());
	}
}
