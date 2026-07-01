package ecommerce_backend.category;

import java.time.Instant;

public record CategoryResponse(
		Long id,
		String name,
		String description,
		Instant createdAt
) {

	public static CategoryResponse from(Category category) {
		return new CategoryResponse(
				category.getId(),
				category.getName(),
				category.getDescription(),
				category.getCreatedAt()
		);
	}
}
