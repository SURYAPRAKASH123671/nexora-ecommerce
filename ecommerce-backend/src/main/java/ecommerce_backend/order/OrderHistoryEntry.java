package ecommerce_backend.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "order_history")
public class OrderHistoryEntry {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false)
	private CustomerOrder order;

	@Column(nullable = false, length = 50)
	private String eventType;

	@Column(nullable = false, length = 80)
	private String fromValue;

	@Column(nullable = false, length = 80)
	private String toValue;

	@Column(nullable = false, length = 180)
	private String actor;

	@Column(length = 500)
	private String note;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected OrderHistoryEntry() {
	}

	public OrderHistoryEntry(CustomerOrder order, String eventType, String fromValue, String toValue,
			String actor, String note) {
		this.order = order;
		this.eventType = eventType;
		this.fromValue = fromValue;
		this.toValue = toValue;
		this.actor = actor;
		this.note = note == null || note.isBlank() ? null : note.trim();
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

	public Long getId() { return id; }
	public String getEventType() { return eventType; }
	public String getFromValue() { return fromValue; }
	public String getToValue() { return toValue; }
	public String getActor() { return actor; }
	public String getNote() { return note; }
	public Instant getCreatedAt() { return createdAt; }
}
