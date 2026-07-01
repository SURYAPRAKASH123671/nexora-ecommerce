package ecommerce_backend.profile;

import java.time.Instant;

public record AddressResponse(
		Long id,
		String label,
		String fullName,
		String phone,
		String line1,
		String line2,
		String city,
		String state,
		String pincode,
		boolean defaultAddress,
		Instant createdAt
) {
	public static AddressResponse from(SavedAddress address) {
		return new AddressResponse(
				address.getId(),
				address.getLabel(),
				address.getFullName(),
				address.getPhone(),
				address.getLine1(),
				address.getLine2(),
				address.getCity(),
				address.getState(),
				address.getPincode(),
				address.isDefaultAddress(),
				address.getCreatedAt()
		);
	}
}
