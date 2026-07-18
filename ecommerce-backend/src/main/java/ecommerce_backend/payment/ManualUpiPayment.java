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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "manual_upi_payments")
public class ManualUpiPayment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false, unique = true)
	private CustomerOrder order;

	@Column(nullable = false, length = 120)
	private String merchantUpiId;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(length = 40)
	private String payerReference;

	@Column(nullable = false, length = 500)
	private String proofStorageKey;

	@Column(nullable = false, length = 255)
	private String proofOriginalName;

	@Column(nullable = false, length = 80)
	private String proofContentType;

	@Column(nullable = false)
	private long proofSize;

	@Column(nullable = false, length = 64)
	private String proofSha256;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private ManualUpiReviewStatus reviewStatus;

	@Column(nullable = false)
	private Instant submittedAt;

	private Instant reviewedAt;

	@Column(length = 180)
	private String reviewedBy;

	@Column(length = 500)
	private String reviewerNote;

	@Version
	private long version;

	protected ManualUpiPayment() {
	}

	public ManualUpiPayment(CustomerOrder order, String merchantUpiId, StoredPaymentProof proof,
			String payerReference) {
		this.order = order;
		this.merchantUpiId = merchantUpiId;
		this.amount = order.getTotal();
		submit(proof, payerReference);
	}

	public void resubmit(StoredPaymentProof proof, String payerReference) {
		if (reviewStatus != ManualUpiReviewStatus.REJECTED) {
			throw new IllegalStateException("A payment proof can only be replaced after rejection.");
		}
		submit(proof, payerReference);
	}

	private void submit(StoredPaymentProof proof, String payerReference) {
		this.proofStorageKey = proof.storageKey();
		this.proofOriginalName = proof.originalName();
		this.proofContentType = proof.contentType();
		this.proofSize = proof.size();
		this.proofSha256 = proof.sha256();
		this.payerReference = blankToNull(payerReference);
		this.reviewStatus = ManualUpiReviewStatus.PENDING_VERIFICATION;
		this.submittedAt = Instant.now();
		this.reviewedAt = null;
		this.reviewedBy = null;
		this.reviewerNote = null;
	}

	public void verify(String reviewer, String note) {
		requirePending();
		this.reviewStatus = ManualUpiReviewStatus.VERIFIED;
		finishReview(reviewer, note);
	}

	public void reject(String reviewer, String note) {
		requirePending();
		this.reviewStatus = ManualUpiReviewStatus.REJECTED;
		finishReview(reviewer, note);
	}

	private void requirePending() {
		if (reviewStatus != ManualUpiReviewStatus.PENDING_VERIFICATION) {
			throw new IllegalStateException("This payment proof has already been reviewed.");
		}
	}

	private void finishReview(String reviewer, String note) {
		this.reviewedAt = Instant.now();
		this.reviewedBy = reviewer;
		this.reviewerNote = blankToNull(note);
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	public Long getId() { return id; }
	public CustomerOrder getOrder() { return order; }
	public String getMerchantUpiId() { return merchantUpiId; }
	public BigDecimal getAmount() { return amount; }
	public String getPayerReference() { return payerReference; }
	public String getProofStorageKey() { return proofStorageKey; }
	public String getProofOriginalName() { return proofOriginalName; }
	public String getProofContentType() { return proofContentType; }
	public long getProofSize() { return proofSize; }
	public String getProofSha256() { return proofSha256; }
	public ManualUpiReviewStatus getReviewStatus() { return reviewStatus; }
	public Instant getSubmittedAt() { return submittedAt; }
	public Instant getReviewedAt() { return reviewedAt; }
	public String getReviewedBy() { return reviewedBy; }
	public String getReviewerNote() { return reviewerNote; }
}
