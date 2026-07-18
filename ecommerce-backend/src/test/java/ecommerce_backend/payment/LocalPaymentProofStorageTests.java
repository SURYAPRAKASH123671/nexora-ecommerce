package ecommerce_backend.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class LocalPaymentProofStorageTests {
	@TempDir
	Path temporaryDirectory;

	@Test
	void storesGenuineImagesWithRandomizedNamesAndDigest() throws Exception {
		byte[] png = new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3};
		LocalPaymentProofStorage storage = new LocalPaymentProofStorage(temporaryDirectory.toString());

		StoredPaymentProof proof = storage.store(
				new MockMultipartFile("screenshot", "../../../payment.png", "image/png", png));

		assertThat(proof.storageKey()).endsWith(".png").doesNotContain("payment.png");
		assertThat(proof.originalName()).isEqualTo("payment.png");
		assertThat(proof.sha256()).hasSize(64);
		assertThat(Files.readAllBytes(temporaryDirectory.resolve(proof.storageKey()))).isEqualTo(png);
	}

	@Test
	void rejectsFilesThatOnlyClaimToBeImages() {
		LocalPaymentProofStorage storage = new LocalPaymentProofStorage(temporaryDirectory.toString());

		assertThatThrownBy(() -> storage.store(
				new MockMultipartFile("screenshot", "fake.png", "image/png", "not an image".getBytes())))
				.isInstanceOf(PaymentProofException.class)
				.hasMessageContaining("genuine PNG, JPEG, or WebP");
	}
}
