package ecommerce_backend.profile;

import ecommerce_backend.auth.AppUser;
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
@Table(name = "saved_addresses")
public class SavedAddress {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@Column(nullable = false, length = 80)
	private String label;

	@Column(nullable = false, length = 120)
	private String fullName;

	@Column(nullable = false, length = 20)
	private String phone;

	@Column(nullable = false, length = 220)
	private String line1;

	@Column(length = 220)
	private String line2;

	@Column(nullable = false, length = 90)
	private String city;

	@Column(nullable = false, length = 90)
	private String state;

	@Column(nullable = false, length = 12)
	private String pincode;

	@Column(nullable = false)
	private boolean defaultAddress;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected SavedAddress() {
	}

	public SavedAddress(AppUser user, String label, String fullName, String phone, String line1,
			String line2, String city, String state, String pincode, boolean defaultAddress) {
		this.user = user;
		this.label = label;
		this.fullName = fullName;
		this.phone = phone;
		this.line1 = line1;
		this.line2 = line2;
		this.city = city;
		this.state = state;
		this.pincode = pincode;
		this.defaultAddress = defaultAddress;
	}

	@PrePersist
	void onCreate() {
		this.createdAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public AppUser getUser() {
		return user;
	}

	public String getLabel() {
		return label;
	}

	public String getFullName() {
		return fullName;
	}

	public String getPhone() {
		return phone;
	}

	public String getLine1() {
		return line1;
	}

	public String getLine2() {
		return line2;
	}

	public String getCity() {
		return city;
	}

	public String getState() {
		return state;
	}

	public String getPincode() {
		return pincode;
	}

	public boolean isDefaultAddress() {
		return defaultAddress;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void update(String label, String fullName, String phone, String line1, String line2,
			String city, String state, String pincode, boolean defaultAddress) {
		this.label = label;
		this.fullName = fullName;
		this.phone = phone;
		this.line1 = line1;
		this.line2 = line2;
		this.city = city;
		this.state = state;
		this.pincode = pincode;
		this.defaultAddress = defaultAddress;
	}

	public void setDefaultAddress(boolean defaultAddress) {
		this.defaultAddress = defaultAddress;
	}
}
