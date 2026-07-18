package ecommerce_backend.payment;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class LocalPaymentProofStorage implements PaymentProofStorage {

	private static final long MAX_BYTES = 5L * 1024 * 1024;
	private final Path root;

	public LocalPaymentProofStorage(@Value("${app.payment-proof.storage-dir:./data/payment-proofs}") String storageDir) {
		this.root = Path.of(storageDir).toAbsolutePath().normalize();
	}

	@Override
	public StoredPaymentProof store(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new PaymentProofException("Upload a PNG, JPEG, or WebP payment screenshot.");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new PaymentProofException("Payment screenshots must be 5 MB or smaller.");
		}
		try {
			byte[] bytes = file.getBytes();
			ImageType imageType = ImageType.detect(bytes);
			String declaredType = file.getContentType();
			if (declaredType != null && !declaredType.isBlank() && !imageType.contentType.equals(declaredType)) {
				throw new PaymentProofException("The uploaded file content does not match its image type.");
			}
			Files.createDirectories(root);
			String storageKey = UUID.randomUUID() + imageType.extension;
			Path destination = root.resolve(storageKey).normalize();
			if (!destination.startsWith(root)) {
				throw new PaymentProofException("Invalid proof storage path.");
			}
			Path temporary = Files.createTempFile(root, "proof-", ".upload");
			try {
				Files.write(temporary, bytes);
				Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE);
			}
			finally {
				Files.deleteIfExists(temporary);
			}
			return new StoredPaymentProof(storageKey, safeOriginalName(file.getOriginalFilename()),
					imageType.contentType, bytes.length, sha256(bytes));
		}
		catch (IOException exception) {
			throw new PaymentProofException("Payment screenshot could not be stored.", exception);
		}
	}

	@Override
	public PaymentProofContent read(ManualUpiPayment payment) {
		Path path = root.resolve(payment.getProofStorageKey()).normalize();
		if (!path.startsWith(root) || !Files.isRegularFile(path)) {
			throw new PaymentProofException("Payment screenshot is unavailable.");
		}
		try {
			return new PaymentProofContent(Files.readAllBytes(path), payment.getProofContentType(),
					payment.getProofOriginalName());
		}
		catch (IOException exception) {
			throw new PaymentProofException("Payment screenshot could not be read.", exception);
		}
	}

	private String safeOriginalName(String originalName) {
		if (originalName == null || originalName.isBlank()) return "payment-proof";
		String fileName = Path.of(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._ -]", "_");
		return fileName.length() > 255 ? fileName.substring(fileName.length() - 255) : fileName;
	}

	private String sha256(byte[] bytes) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
		}
		catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is unavailable.", exception);
		}
	}

	private enum ImageType {
		PNG("image/png", ".png"), JPEG("image/jpeg", ".jpg"), WEBP("image/webp", ".webp");

		private static final Map<String, ImageType> CONTENT_TYPES = Map.of(
				"image/png", PNG, "image/jpeg", JPEG, "image/webp", WEBP);
		private final String contentType;
		private final String extension;

		ImageType(String contentType, String extension) {
			this.contentType = contentType;
			this.extension = extension;
		}

		private static ImageType detect(byte[] bytes) {
			if (bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e
					&& bytes[3] == 0x47 && bytes[4] == 0x0d && bytes[5] == 0x0a
					&& bytes[6] == 0x1a && bytes[7] == 0x0a) return PNG;
			if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8
					&& (bytes[2] & 0xff) == 0xff) return JPEG;
			if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F'
					&& bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B'
					&& bytes[11] == 'P') return WEBP;
			throw new PaymentProofException("Only genuine PNG, JPEG, or WebP screenshots are accepted.");
		}
	}
}
