package ecommerce_backend.order;

import ecommerce_backend.auth.UserPrincipal;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

	private final OrderService orderService;
	private final InvoicePdfService invoicePdfService;

	public OrderController(OrderService orderService, InvoicePdfService invoicePdfService) {
		this.orderService = orderService;
		this.invoicePdfService = invoicePdfService;
	}

	@PostMapping
	public ResponseEntity<OrderResponse> createOrder(@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody CreateOrderRequest request) {
		OrderResponse response = orderService.createOrder(principal, request);
		return ResponseEntity.created(URI.create("/api/orders/" + response.orderNumber())).body(response);
	}

	@GetMapping
	public List<OrderResponse> myOrders(@AuthenticationPrincipal UserPrincipal principal) {
		return orderService.myOrders(principal);
	}

	@GetMapping("/{orderNumber}")
	public OrderResponse orderDetails(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String orderNumber) {
		return orderService.orderDetails(principal, orderNumber);
	}

	@PostMapping("/{orderNumber}/cancel")
	public OrderResponse cancelOrder(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String orderNumber) {
		return orderService.cancelOrder(principal, orderNumber);
	}

	@GetMapping("/{orderNumber}/invoice")
	public ResponseEntity<ByteArrayResource> invoice(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String orderNumber) {
		CustomerOrder order = orderService.getOwnedOrder(principal, orderNumber);
		byte[] pdf = invoicePdfService.generate(order);
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION,
						ContentDisposition.attachment()
								.filename("nexora-invoice-" + order.getOrderNumber() + ".pdf")
								.build()
								.toString())
				.contentLength(pdf.length)
				.body(new ByteArrayResource(pdf));
	}
}
