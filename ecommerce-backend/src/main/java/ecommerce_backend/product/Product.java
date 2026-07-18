package ecommerce_backend.product;

import ecommerce_backend.category.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 160)
	private String name;

	@Column(length = 1000)
	private String description;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal price;

	@Column(nullable = false)
	private Integer stockQuantity;

	@Column(length = 500)
	private String imageUrl;

	@Column(nullable = false)
	private boolean active = true;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	@Version
	private Long version;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "category_id", nullable = false)
	private Category category;

	protected Product() {
	}

	public Product(String name, String description, BigDecimal price, Integer stockQuantity,
			String imageUrl, Category category) {
		this.name = name;
		this.description = description;
		this.price = price;
		this.stockQuantity = stockQuantity;
		this.imageUrl = imageUrl;
		this.category = category;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public Integer getStockQuantity() {
		return stockQuantity;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public boolean isActive() {
		return active;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Category getCategory() {
		return category;
	}

	public void update(String name, String description, BigDecimal price, Integer stockQuantity,
			String imageUrl, Category category) {
		this.name = name;
		this.description = description;
		this.price = price;
		this.stockQuantity = stockQuantity;
		this.imageUrl = imageUrl;
		this.category = category;
	}

	public void reserveStock(int quantity) {
		if (!active) {
			throw new IllegalStateException("Product is not available: " + name);
		}
		if (quantity <= 0 || stockQuantity < quantity) {
			throw new IllegalStateException("Insufficient stock for product: " + name);
		}
		stockQuantity -= quantity;
	}

	public void restoreStock(int quantity) {
		if (quantity > 0) {
			stockQuantity += quantity;
		}
	}

	public void deactivate() {
		this.active = false;
	}

	public void activate() {
		this.active = true;
	}
}
