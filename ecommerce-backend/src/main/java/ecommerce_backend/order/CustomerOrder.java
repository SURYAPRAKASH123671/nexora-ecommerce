package ecommerce_backend.order;

import ecommerce_backend.auth.AppUser;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 40)
	private String orderNumber;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private OrderStatus status = OrderStatus.PLACED;

	@Column(nullable = false, length = 80)
	private String paymentMethod;

	@Column(nullable = false, length = 80)
	private String paymentStatus;

	@Column(nullable = false, length = 120)
	private String deliveryFullName;

	@Column(nullable = false, length = 180)
	private String deliveryEmail;

	@Column(nullable = false, length = 20)
	private String deliveryPhone;

	@Column(nullable = false, length = 220)
	private String deliveryLine1;

	@Column(length = 220)
	private String deliveryLine2;

	@Column(nullable = false, length = 90)
	private String deliveryCity;

	@Column(nullable = false, length = 90)
	private String deliveryState;

	@Column(nullable = false, length = 12)
	private String deliveryPincode;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal subtotal;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal gst;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal shipping;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal total;

	@Column(nullable = false, updatable = false)
	private Instant placedAt;

	private Instant cancelledAt;

	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
	private List<OrderItem> items = new ArrayList<>();

	protected CustomerOrder() {
	}

	public CustomerOrder(String orderNumber, AppUser user, String paymentMethod, String paymentStatus,
			OrderAddress address, BigDecimal subtotal, BigDecimal gst, BigDecimal shipping, BigDecimal total) {
		this.orderNumber = orderNumber;
		this.user = user;
		this.paymentMethod = paymentMethod;
		this.paymentStatus = paymentStatus;
		this.deliveryFullName = address.fullName();
		this.deliveryEmail = address.email();
		this.deliveryPhone = address.phone();
		this.deliveryLine1 = address.line1();
		this.deliveryLine2 = address.line2();
		this.deliveryCity = address.city();
		this.deliveryState = address.state();
		this.deliveryPincode = address.pincode();
		this.subtotal = subtotal;
		this.gst = gst;
		this.shipping = shipping;
		this.total = total;
	}

	@PrePersist
	void onCreate() {
		this.placedAt = Instant.now();
	}

	public void addItem(OrderItem item) {
		item.attachTo(this);
		this.items.add(item);
	}

	public void cancel() {
		this.status = OrderStatus.CANCELLED;
		this.cancelledAt = Instant.now();
	}

	public Long getId() { return id; }
	public String getOrderNumber() { return orderNumber; }
	public AppUser getUser() { return user; }
	public OrderStatus getStatus() { return status; }
	public String getPaymentMethod() { return paymentMethod; }
	public String getPaymentStatus() { return paymentStatus; }
	public String getDeliveryFullName() { return deliveryFullName; }
	public String getDeliveryEmail() { return deliveryEmail; }
	public String getDeliveryPhone() { return deliveryPhone; }
	public String getDeliveryLine1() { return deliveryLine1; }
	public String getDeliveryLine2() { return deliveryLine2; }
	public String getDeliveryCity() { return deliveryCity; }
	public String getDeliveryState() { return deliveryState; }
	public String getDeliveryPincode() { return deliveryPincode; }
	public BigDecimal getSubtotal() { return subtotal; }
	public BigDecimal getGst() { return gst; }
	public BigDecimal getShipping() { return shipping; }
	public BigDecimal getTotal() { return total; }
	public Instant getPlacedAt() { return placedAt; }
	public Instant getCancelledAt() { return cancelledAt; }
	public List<OrderItem> getItems() { return items; }
}
