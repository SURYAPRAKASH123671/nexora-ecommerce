package ecommerce_backend.product;

import ecommerce_backend.category.Category;
import ecommerce_backend.category.CategoryService;
import ecommerce_backend.common.NotFoundException;
import java.util.List;
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

	private String normalize(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
