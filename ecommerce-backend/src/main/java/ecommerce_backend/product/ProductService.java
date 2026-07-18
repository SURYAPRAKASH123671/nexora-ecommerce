package ecommerce_backend.product;

import ecommerce_backend.category.Category;
import ecommerce_backend.category.CategoryService;
import ecommerce_backend.common.NotFoundException;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

	private final ProductRepository productRepository;
	private final CategoryService categoryService;

	public ProductService(ProductRepository productRepository, CategoryService categoryService) {
		this.productRepository = productRepository;
		this.categoryService = categoryService;
	}

	@Transactional(readOnly = true)
	public List<ProductResponse> getProducts() {
		return productRepository.findByActiveTrue().stream()
				.map(ProductResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public ProductResponse getProduct(Long id) {
		return ProductResponse.from(productRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Product not found: " + id)));
	}

	@Transactional
	public ProductResponse createProduct(ProductRequest request) {
		Category category = categoryService.findCategory(request.categoryId());
		Product product = new Product(
				request.name().trim(),
				normalize(request.description()),
				request.price(),
				request.stockQuantity(),
				normalize(request.imageUrl()),
				category
		);
		return ProductResponse.from(productRepository.save(product));
	}

	@Transactional
	public ProductResponse updateProduct(Long id, ProductRequest request) {
		Product product = findProduct(id);
		Category category = categoryService.findCategory(request.categoryId());
		product.update(request.name().trim(), normalize(request.description()), request.price(),
				request.stockQuantity(), normalize(request.imageUrl()), category);
		return ProductResponse.from(product);
	}

	@Transactional
	public ProductResponse setActive(Long id, boolean active) {
		Product product = findProduct(id);
		if (active) {
			product.activate();
		}
		else {
			product.deactivate();
		}
		return ProductResponse.from(product);
	}

	@Transactional(readOnly = true)
	public Page<ProductResponse> search(String query, Long categoryId, int page, int size, String sortBy,
			String direction) {
		int safeSize = Math.min(Math.max(size, 1), 100);
		String safeSort = switch (sortBy) {
			case "name", "price", "createdAt", "stockQuantity" -> sortBy;
			default -> "createdAt";
		};
		Sort.Direction safeDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
		String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
		return productRepository.searchActive(normalizedQuery, categoryId,
				PageRequest.of(Math.max(page, 0), safeSize, Sort.by(safeDirection, safeSort)))
				.map(ProductResponse::from);
	}

	@Transactional(readOnly = true)
	public long countByCategory(Long categoryId) {
		return productRepository.countByCategoryId(categoryId);
	}

	private Product findProduct(Long id) {
		return productRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Product not found: " + id));
	}

	private String normalize(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
