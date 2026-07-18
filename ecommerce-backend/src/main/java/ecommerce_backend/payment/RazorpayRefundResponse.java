package ecommerce_backend.payment;

public record RazorpayRefundResponse(String orderNumber, String razorpayRefundId, String status) {}
