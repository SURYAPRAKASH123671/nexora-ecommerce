package ecommerce_backend.profile;

import ecommerce_backend.auth.AppUser;
import ecommerce_backend.auth.AppUserRepository;
import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.common.NotFoundException;
import ecommerce_backend.auth.AuthException;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

	private final SavedAddressRepository addressRepository;
	private final PasswordEncoder passwordEncoder;
	private final AppUserRepository userRepository;

	public ProfileService(SavedAddressRepository addressRepository, PasswordEncoder passwordEncoder,
			AppUserRepository userRepository) {
		this.addressRepository = addressRepository;
		this.passwordEncoder = passwordEncoder;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public ProfileResponse getProfile(UserPrincipal principal) {
		AppUser user = currentUser(principal);
		return ProfileResponse.from(user, addressRepository.findByUserOrderByDefaultAddressDescCreatedAtDesc(user));
	}

	@Transactional
	public ProfileResponse updateProfile(UserPrincipal principal, UpdateProfileRequest request) {
		AppUser user = currentUser(principal);
		user.updateProfile(
				request.name().trim(),
				blankToNull(request.phone()),
				blankToNull(request.profilePictureUrl())
		);
		return getProfile(principal);
	}

	@Transactional
	public void changePassword(UserPrincipal principal, ChangePasswordRequest request) {
		AppUser user = currentUser(principal);
		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new AuthException("Current password is incorrect.");
		}
		user.resetPassword(passwordEncoder.encode(request.newPassword()));
	}

	@Transactional
	public AddressResponse addAddress(UserPrincipal principal, AddressRequest request) {
		AppUser user = currentUser(principal);
		if (request.defaultAddress()) {
			clearDefaultAddresses(user);
		}
		SavedAddress address = toAddress(user, request);
		return AddressResponse.from(addressRepository.save(address));
	}

	@Transactional
	public AddressResponse updateAddress(UserPrincipal principal, Long id, AddressRequest request) {
		AppUser user = currentUser(principal);
		SavedAddress address = addressRepository.findByIdAndUser(id, user)
				.orElseThrow(() -> new NotFoundException("Address not found: " + id));
		if (request.defaultAddress()) {
			clearDefaultAddresses(user);
		}
		address.update(
				request.label().trim(),
				request.fullName().trim(),
				request.phone().trim(),
				request.line1().trim(),
				blankToNull(request.line2()),
				request.city().trim(),
				request.state().trim(),
				request.pincode().trim(),
				request.defaultAddress()
		);
		return AddressResponse.from(address);
	}

	@Transactional
	public void deleteAddress(UserPrincipal principal, Long id) {
		AppUser user = currentUser(principal);
		SavedAddress address = addressRepository.findByIdAndUser(id, user)
				.orElseThrow(() -> new NotFoundException("Address not found: " + id));
		addressRepository.delete(address);
	}

	private SavedAddress toAddress(AppUser user, AddressRequest request) {
		return new SavedAddress(
				user,
				request.label().trim(),
				request.fullName().trim(),
				request.phone().trim(),
				request.line1().trim(),
				blankToNull(request.line2()),
				request.city().trim(),
				request.state().trim(),
				request.pincode().trim(),
				request.defaultAddress()
		);
	}

	private void clearDefaultAddresses(AppUser user) {
		List<SavedAddress> addresses = addressRepository.findByUserOrderByDefaultAddressDescCreatedAtDesc(user);
		addresses.forEach(address -> address.setDefaultAddress(false));
	}

	private String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private AppUser currentUser(UserPrincipal principal) {
		return userRepository.findById(principal.getUser().getId())
				.orElseThrow(() -> new NotFoundException("User not found."));
	}
}
