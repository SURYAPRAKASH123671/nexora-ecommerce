package ecommerce_backend.payment;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RazorpayApiClient {
	private static final URI API = URI.create("https://api.razorpay.com/v1/");
	private final HttpClient httpClient = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(8)).build();
	private final ObjectMapper objectMapper;
	private final String keyId;
	private final String keySecret;

	public RazorpayApiClient(ObjectMapper objectMapper,
			@Value("${app.razorpay.key-id:}") String keyId,
			@Value("${app.razorpay.key-secret:}") String keySecret) {
		this.objectMapper = objectMapper;
		this.keyId = keyId.trim();
		this.keySecret = keySecret.trim();
	}

	public JsonNode createOrder(long amountPaise, String receipt, String nexoraOrderNumber) {
		return send("orders", "POST", Map.of(
				"amount", amountPaise,
				"currency", "INR",
				"receipt", receipt,
				"notes", Map.of("nexora_order_number", nexoraOrderNumber)
		));
	}

	public JsonNode fetchPayment(String paymentId) {
		if (paymentId == null || !paymentId.matches("pay_[A-Za-z0-9]+"))
			throw new PaymentGatewayException("Invalid Razorpay payment identifier.");
		return send("payments/" + paymentId, "GET", null);
	}

	public String keyId() { ensureConfigured(); return keyId; }
	public String keySecret() { ensureConfigured(); return keySecret; }

	private JsonNode send(String path, String method, Object body) {
		ensureConfigured();
		try {
			HttpRequest.Builder builder = HttpRequest.newBuilder(API.resolve(path))
					.timeout(Duration.ofSeconds(15))
					.header("Authorization", "Basic " + Base64.getEncoder().encodeToString(
							(keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8)))
					.header("Accept", "application/json");
			if (body == null) builder.GET();
			else builder.header("Content-Type", "application/json")
					.method(method, HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
			HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300)
				throw new PaymentGatewayException("Razorpay rejected the payment request (HTTP " + response.statusCode() + ").");
			return objectMapper.readTree(response.body());
		}
		catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new PaymentGatewayException("Razorpay request was interrupted.", exception);
		}
		catch (IOException exception) {
			throw new PaymentGatewayException("Razorpay is temporarily unavailable.", exception);
		}
	}

	private void ensureConfigured() {
		if (keyId.isBlank() || keySecret.isBlank())
			throw new PaymentGatewayException("Razorpay checkout is not configured.");
	}
}
