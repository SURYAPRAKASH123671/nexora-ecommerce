package ecommerce_backend.payment;

import ecommerce_backend.order.CustomerOrder;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(name = "razorpay_payment_attempts")
public class RazorpayPaymentAttempt {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false)
	private CustomerOrder order;
	@Column(nullable = false, unique = true, length = 80)
	private String providerOrderId;
	@Column(unique = true, length = 80)
	private String providerPaymentId;
	@Column(nullable = false)
	private long amountPaise;
	@Column(nullable = false, length = 3)
	private String currency;
	@Enumerated(EnumType.STRING) @Column(nullable = false, length = 24)
	private RazorpayPaymentStatus status;
	@Column(length = 120)
	private String failureCode;
	@Column(length = 500)
	private String failureDescription;
	@Column(nullable = false, updatable = false)
	private Instant createdAt;
	@Column(nullable = false)
	private Instant updatedAt;
	@Version
	private long version;

	protected RazorpayPaymentAttempt() {}

	public RazorpayPaymentAttempt(CustomerOrder order, String providerOrderId, long amountPaise, String currency) {
		this.order = order;
		this.providerOrderId = providerOrderId;
		this.amountPaise = amountPaise;
		this.currency = currency;
		this.status = RazorpayPaymentStatus.CREATED;
	}

	@PrePersist void createTimestamps() { createdAt = updatedAt = Instant.now(); }
	@PreUpdate void updateTimestamp() { updatedAt = Instant.now(); }

	public void captured(String paymentId) {
		if (status == RazorpayPaymentStatus.CAPTURED) return;
		providerPaymentId = paymentId;
		status = RazorpayPaymentStatus.CAPTURED;
		failureCode = null;
		failureDescription = null;
	}

	public void failed(String paymentId, String code, String description) {
		if (status == RazorpayPaymentStatus.CAPTURED) return;
		providerPaymentId = paymentId;
		status = RazorpayPaymentStatus.FAILED;
		failureCode = trim(code, 120);
		failureDescription = trim(description, 500);
	}

	public void cancelled() {
		if (status == RazorpayPaymentStatus.CREATED) status = RazorpayPaymentStatus.CANCELLED;
	}

	private String trim(String value, int max) {
		return value == null || value.isBlank() ? null : value.trim().substring(0, Math.min(max, value.trim().length()));
	}

	public Long getId() { return id; }
	public CustomerOrder getOrder() { return order; }
	public String getProviderOrderId() { return providerOrderId; }
	public String getProviderPaymentId() { return providerPaymentId; }
	public long getAmountPaise() { return amountPaise; }
	public String getCurrency() { return currency; }
	public RazorpayPaymentStatus getStatus() { return status; }
	public String getFailureCode() { return failureCode; }
	public String getFailureDescription() { return failureDescription; }
	public Instant getCreatedAt() { return createdAt; }
}
