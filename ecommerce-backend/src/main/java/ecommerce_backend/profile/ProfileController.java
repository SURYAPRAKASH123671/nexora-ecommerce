package ecommerce_backend.profile;

import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.auth.VerificationResponse;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

	private final ProfileService profileService;

	public ProfileController(ProfileService profileService) {
		this.profileService = profileService;
	}

	@GetMapping
	public ProfileResponse getProfile(@AuthenticationPrincipal UserPrincipal principal) {
		return profileService.getProfile(principal);
	}

	@PutMapping
	public ProfileResponse updateProfile(@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody UpdateProfileRequest request) {
		return profileService.updateProfile(principal, request);
	}

	@PostMapping("/change-password")
	public VerificationResponse changePassword(@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody ChangePasswordRequest request) {
		profileService.changePassword(principal, request);
		return new VerificationResponse("UPDATED", "Password changed successfully.");
	}

	@PostMapping("/addresses")
	public ResponseEntity<AddressResponse> addAddress(@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody AddressRequest request) {
		AddressResponse response = profileService.addAddress(principal, request);
		return ResponseEntity.created(URI.create("/api/profile/addresses/" + response.id())).body(response);
	}

	@PutMapping("/addresses/{id}")
	public AddressResponse updateAddress(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long id,
			@Valid @RequestBody AddressRequest request) {
		return profileService.updateAddress(principal, id, request);
	}

	@DeleteMapping("/addresses/{id}")
	public ResponseEntity<Void> deleteAddress(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
		profileService.deleteAddress(principal, id);
		return ResponseEntity.noContent().build();
	}
}
