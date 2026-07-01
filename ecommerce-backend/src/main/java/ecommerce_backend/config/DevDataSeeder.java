package ecommerce_backend.config;

import ecommerce_backend.auth.AppUser;
import ecommerce_backend.auth.AppUserRepository;
import ecommerce_backend.category.Category;
import ecommerce_backend.category.CategoryRepository;
import ecommerce_backend.product.Product;
import ecommerce_backend.product.ProductRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
public class DevDataSeeder {

	@Bean
	CommandLineRunner seedDevData(AppUserRepository userRepository,
			CategoryRepository categoryRepository,
			ProductRepository productRepository,
			PasswordEncoder passwordEncoder) {
		return args -> {
			seedAdmin(userRepository, passwordEncoder);
			Map<String, Category> categories = seedCategories(categoryRepository);
			seedProducts(productRepository, categories);
		};
	}

	private void seedAdmin(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
		userRepository.findByEmailIgnoreCase("admin@nexora.com").ifPresentOrElse(AppUser::promoteToAdmin, () -> {
			AppUser admin = new AppUser("Nexora Admin", "admin@nexora.com",
					passwordEncoder.encode("Admin12345"));
			admin.markEmailVerified();
			admin.promoteToAdmin();
			userRepository.save(admin);
		});
	}

	private Map<String, Category> seedCategories(CategoryRepository categoryRepository) {
		Map<String, String> categoryDescriptions = new LinkedHashMap<>();
		categoryDescriptions.put("Mobiles", "Smartphones and mobile accessories");
		categoryDescriptions.put("Electronics", "Audio, laptops, and connected devices");
		categoryDescriptions.put("Fashion", "Footwear, apparel, and wearable style");
		categoryDescriptions.put("Home", "Home comfort and everyday living");

		Map<String, Category> categories = new LinkedHashMap<>();
		categoryDescriptions.forEach((name, description) -> {
			Category category = categoryRepository.findByNameIgnoreCase(name)
					.orElseGet(() -> categoryRepository.save(new Category(name, description)));
			categories.put(name, category);
		});
		return categories;
	}

	private void seedProducts(ProductRepository productRepository, Map<String, Category> categories) {
		if (productRepository.count() > 0) {
			return;
		}

		productRepository.save(new Product("iPhone 15 128GB", "A16 Bionic, advanced dual camera, all-day battery.",
				new BigDecimal("67999.00"), 18, "", categories.get("Mobiles")));
		productRepository.save(new Product("Galaxy S24 5G", "Compact flagship with Galaxy AI and vivid AMOLED display.",
				new BigDecimal("58999.00"), 12, "", categories.get("Mobiles")));
		productRepository.save(new Product("WH-1000XM5 Headphones", "Premium wireless noise cancelling headphones.",
				new BigDecimal("26990.00"), 4, "", categories.get("Electronics")));
		productRepository.save(new Product("Inspiron 14 Intel i5 Laptop", "Portable productivity laptop for work and study.",
				new BigDecimal("52990.00"), 7, "", categories.get("Electronics")));
		productRepository.save(new Product("Air Max Running Shoes", "Responsive everyday running shoes with breathable mesh.",
				new BigDecimal("7495.00"), 3, "", categories.get("Fashion")));
		productRepository.save(new Product("Smart LED Desk Lamp", "Adjustable lamp with touch controls and warm light modes.",
				new BigDecimal("2199.00"), 15, "", categories.get("Home")));
	}
}
