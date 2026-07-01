package ecommerce_backend.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "app_users")
public class AppUser {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(length = 20)
	private String phone;

	@Column(length = 500)
	private String profilePictureUrl;

	@Column(nullable = false, unique = true, length = 180)
	private String email;

	@Column(nullable = false, length = 120)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private UserRole role = UserRole.ROLE_CUSTOMER;

	@Column(nullable = false)
	private boolean emailVerified;

	@Column(length = 96)
	private String emailVerificationToken;

	private Instant emailVerificationExpiresAt;

	@Column(length = 96)
	private String passwordResetToken;

	private Instant passwordResetExpiresAt;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant updatedAt;

	private Instant lastLoginAt;

	protected AppUser() {
	}

	public AppUser(String name, String email, String passwordHash) {
		this.name = name;
		this.email = email;
		this.passwordHash = passwordHash;
	}

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getPhone() {
		return phone;
	}

	public String getProfilePictureUrl() {
		return profilePictureUrl;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public UserRole getRole() {
		return role;
	}

	public boolean isEmailVerified() {
		return emailVerified;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getLastLoginAt() {
		return lastLoginAt;
	}

	public String getEmailVerificationToken() {
		return emailVerificationToken;
	}

	public Instant getEmailVerificationExpiresAt() {
		return emailVerificationExpiresAt;
	}

	public String getPasswordResetToken() {
		return passwordResetToken;
	}

	public Instant getPasswordResetExpiresAt() {
		return passwordResetExpiresAt;
	}

	public void markEmailVerificationRequested(String token, Instant expiresAt) {
		this.emailVerificationToken = token;
		this.emailVerificationExpiresAt = expiresAt;
		touch();
	}

	public void markEmailVerified() {
		this.emailVerified = true;
		this.emailVerificationToken = null;
		this.emailVerificationExpiresAt = null;
		touch();
	}

	public void promoteToAdmin() {
		this.role = UserRole.ROLE_ADMIN;
		touch();
	}

	public void markPasswordResetRequested(String token, Instant expiresAt) {
		this.passwordResetToken = token;
		this.passwordResetExpiresAt = expiresAt;
		touch();
	}

	public void resetPassword(String passwordHash) {
		this.passwordHash = passwordHash;
		this.passwordResetToken = null;
		this.passwordResetExpiresAt = null;
		touch();
	}

	public void updateProfile(String name, String phone, String profilePictureUrl) {
		this.name = name;
		this.phone = phone;
		this.profilePictureUrl = profilePictureUrl;
		touch();
	}

	public void markLogin() {
		this.lastLoginAt = Instant.now();
		touch();
	}

	private void touch() {
		this.updatedAt = Instant.now();
	}
}
