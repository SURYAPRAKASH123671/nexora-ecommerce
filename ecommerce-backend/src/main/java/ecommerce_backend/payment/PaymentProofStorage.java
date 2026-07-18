package ecommerce_backend.payment;

import org.springframework.web.multipart.MultipartFile;

public interface PaymentProofStorage {
	StoredPaymentProof store(MultipartFile file);
	PaymentProofContent read(ManualUpiPayment payment);
}
