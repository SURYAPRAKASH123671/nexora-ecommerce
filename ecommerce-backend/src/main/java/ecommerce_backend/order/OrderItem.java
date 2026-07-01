package ecommerce_backend.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false)
	private CustomerOrder order;

	private Long productId;

	@Column(nullable = false, length = 180)
	private String productName;

	@Column(length = 120)
	private String brand;

	@Column(length = 120)
	private String variant;

	@Column(length = 500)
	private String imageUrl;

	@Column(nullable = false)
	private Integer quantity;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal unitPrice;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal lineTotal;

	protected OrderItem() {
	}

	public OrderItem(Long productId, String productName, String brand, String variant,
			String imageUrl, Integer quantity, BigDecimal unitPrice) {
		this.productId = productId;
		this.productName = productName;
		this.brand = brand;
		this.variant = variant;
		this.imageUrl = imageUrl;
		this.quantity = quantity;
		this.unitPrice = unitPrice;
		this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
	}

	void attachTo(CustomerOrder order) {
		this.order = order;
	}

	public Long getId() { return id; }
	public Long getProductId() { return productId; }
	public String getProductName() { return productName; }
	public String getBrand() { return brand; }
	public String getVariant() { return variant; }
	public String getImageUrl() { return imageUrl; }
	public Integer getQuantity() { return quantity; }
	public BigDecimal getUnitPrice() { return unitPrice; }
	public BigDecimal getLineTotal() { return lineTotal; }
}
