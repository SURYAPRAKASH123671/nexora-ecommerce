package ecommerce_backend.payment;

public record PaymentProofContent(byte[] bytes, String contentType, String originalName) {
}
