package ecommerce_backend.category;

import ecommerce_backend.common.ConflictException;
import ecommerce_backend.common.NotFoundException;
import ecommerce_backend.product.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

	private final CategoryRepository categoryRepository;
	private final ProductRepository productRepository;

	public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
		this.categoryRepository = categoryRepository;
		this.productRepository = productRepository;
	}

	@Transactional(readOnly = true)
	public List<CategoryResponse> getCategories() {
		return categoryRepository.findAll().stream()
				.map(CategoryResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public CategoryResponse getCategory(Long id) {
		return CategoryResponse.from(findCategory(id));
	}

	@Transactional
	public CategoryResponse createCategory(CategoryRequest request) {
		categoryRepository.findByNameIgnoreCase(request.name())
				.ifPresent(category -> {
					throw new ConflictException("Category already exists: " + category.getName());
				});

		Category category = new Category(request.name().trim(), normalize(request.description()));
		return CategoryResponse.from(categoryRepository.save(category));
	}

	@Transactional
	public CategoryResponse updateCategory(Long id, CategoryRequest request) {
		Category category = findCategory(id);
		categoryRepository.findByNameIgnoreCase(request.name())
				.filter(existing -> !existing.getId().equals(id))
				.ifPresent(existing -> {
					throw new ConflictException("Category already exists: " + existing.getName());
				});
		category.setName(request.name().trim());
		category.setDescription(normalize(request.description()));
		return CategoryResponse.from(category);
	}

	@Transactional
	public void deleteCategory(Long id) {
		Category category = findCategory(id);
		if (productRepository.countByCategoryId(id) > 0) {
			throw new ConflictException("Category cannot be deleted while products reference it.");
		}
		categoryRepository.delete(category);
	}

	@Transactional(readOnly = true)
	public Category findCategory(Long id) {
		return categoryRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Category not found: " + id));
	}

	private String normalize(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
