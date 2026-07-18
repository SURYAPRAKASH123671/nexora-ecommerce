package ecommerce_backend.admin;

import ecommerce_backend.auth.UserPrincipal;
import ecommerce_backend.order.OrderResponse;
import ecommerce_backend.order.OrderService;
import ecommerce_backend.order.UpdateOrderStatusRequest;
import ecommerce_backend.order.UpdatePaymentStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

	private final OrderService orderService;

	public AdminOrderController(OrderService orderService) {
		this.orderService = orderService;
	}

	@GetMapping
	public List<OrderResponse> orders() {
		return orderService.allOrders();
	}

	@PatchMapping("/{orderNumber}/status")
	public OrderResponse updateStatus(@PathVariable String orderNumber,
			@Valid @RequestBody UpdateOrderStatusRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return orderService.updateStatus(orderNumber, request.status(), principal.getUsername());
	}

	@PatchMapping("/{orderNumber}/payment-status")
	public OrderResponse updatePaymentStatus(@PathVariable String orderNumber,
			@Valid @RequestBody UpdatePaymentStatusRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return orderService.updatePaymentStatus(orderNumber, request.status(), principal.getUsername());
	}
}
