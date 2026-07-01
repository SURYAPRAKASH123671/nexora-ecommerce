package ecommerce_backend.category;

import ecommerce_backend.common.ConflictException;
import ecommerce_backend.common.NotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

	private final CategoryRepository categoryRepository;

	public CategoryService(CategoryRepository categoryRepository) {
		this.categoryRepository = categoryRepository;
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
